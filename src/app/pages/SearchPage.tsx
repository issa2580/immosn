import { useState, useEffect, useRef, useMemo, useCallback, useTransition } from "react";
import { useSearchParams } from "react-router";
import {
  Search, SlidersHorizontal, Grid3X3, List, X,
  ChevronLeft, ChevronRight, MapPin, Loader2,
} from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import {
  ALL_PROPERTIES, type Transaction, type Prop,
  NAVY, GOLD, CREAM, B,
  VILLES, QUARTIERS, PROP_TYPES, EQUIPEMENTS_LIST, fmt,
} from "../data";

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = "grid" | "list";
type SortKey  = "pertinence" | "prix-asc" | "prix-desc" | "surface-desc" | "date";

interface Filters {
  tab:         Transaction;
  search:      string;
  ville:       string;
  quartier:    string;
  type:        string;
  prixMin:     string;
  prixMax:     string;
  chambresMin: number;
  surfaceMin:  string;
  equipements: string[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setV(true); obs.disconnect(); }
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible: v };
}

function AnimCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} style={{
      opacity:    visible ? 1 : 0,
      transform:  visible ? "none" : "translateY(24px)",
      transition: `opacity 0.52s ease ${delay}s, transform 0.52s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

// ─── Sort ─────────────────────────────────────────────────────────────────────
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "pertinence",   label: "Pertinence"          },
  { key: "prix-asc",     label: "Prix croissant"       },
  { key: "prix-desc",    label: "Prix décroissant"     },
  { key: "surface-desc", label: "Plus grande surface"  },
  { key: "date",         label: "Date de publication"  },
];

const SORT_FN: Record<SortKey, (a: Prop, b: Prop) => number> = {
  pertinence:    () => 0,
  "prix-asc":    (a, b) => a.price  - b.price,
  "prix-desc":   (a, b) => b.price  - a.price,
  "surface-desc":(a, b) => b.surface - a.surface,
  date:          (a, b) => b.id - a.id,
};

const PER_PAGE: Record<ViewMode, number> = { grid: 6, list: 4 };

const TAB_CFG: { key: Transaction; label: string }[] = [
  { key: "vente",    label: "Acheter" },
  { key: "location", label: "Louer"   },
  { key: "terrain",  label: "Terrain" },
];

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard({ variant = "grid" }: { variant?: ViewMode }) {
  if (variant === "list") {
    return (
      <div className="bg-white rounded-[20px] overflow-hidden border flex animate-pulse" style={{ borderColor: B }}>
        <div className="shrink-0 bg-gray-100" style={{ width: 200, minHeight: 96 }} />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-[20px] overflow-hidden border animate-pulse" style={{ borderColor: B }}>
      <div className="bg-gray-100" style={{ height: 228 }} />
      <div className="p-5 space-y-3">
        <div className="flex gap-2"><div className="h-5 bg-gray-100 rounded-full w-20" /><div className="h-5 bg-gray-100 rounded-full w-16" /></div>
        <div className="h-5 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-16 bg-gray-100 rounded-xl" />
        <div className="h-10 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Filter sidebar ───────────────────────────────────────────────────────────
interface SidebarProps {
  filters:   Filters;
  onChange:  (patch: Partial<Filters>) => void;
  count:     number;
  onClose?:  () => void;
}

function FilterSidebar({ filters, onChange, count, onClose }: SidebarProps) {
  const quartiers = filters.ville ? QUARTIERS[filters.ville] ?? [] : [];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: B }}>
        <span className="font-bold text-[#0F1C2E]" style={{ fontFamily: "'Playfair Display',serif" }}>
          Filtres
        </span>
        {onClose && (
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

        {/* Ville */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Ville</label>
          <select
            value={filters.ville}
            onChange={e => onChange({ ville: e.target.value, quartier: "" })}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white"
            style={{ borderColor: B, color: NAVY }}
          >
            <option value="">Toutes les villes</option>
            {VILLES.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        {/* Quartier */}
        {quartiers.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Quartier</label>
            <select
              value={filters.quartier}
              onChange={e => onChange({ quartier: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: B, color: NAVY }}
            >
              <option value="">Tous les quartiers</option>
              {quartiers.map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
        )}

        {/* Type de bien */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Type de bien</label>
          <div className="flex flex-wrap gap-2">
            {PROP_TYPES.map(t => {
              const active = filters.type === t;
              return (
                <button key={t}
                  onClick={() => onChange({ type: active ? "" : t })}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all border"
                  style={{
                    borderColor: active ? GOLD : B,
                    background:  active ? `${GOLD}15` : "transparent",
                    color:       active ? GOLD : "#6B7280",
                  }}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Budget (FCFA)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-gray-400 block mb-1">Minimum</span>
              <input
                type="number" min={0} placeholder="0"
                value={filters.prixMin}
                onChange={e => onChange({ prixMin: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-white"
                style={{ borderColor: B, color: NAVY }}
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block mb-1">Maximum</span>
              <input
                type="number" min={0} placeholder="∞"
                value={filters.prixMax}
                onChange={e => onChange({ prixMax: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-white"
                style={{ borderColor: B, color: NAVY }}
              />
            </div>
          </div>
        </div>

        {/* Chambres */}
        {filters.tab !== "terrain" && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Chambres min.</label>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 5].map(n => {
                const active = filters.chambresMin === n;
                return (
                  <button key={n}
                    onClick={() => onChange({ chambresMin: n })}
                    className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                    style={{
                      borderColor: active ? GOLD : B,
                      background:  active ? `${GOLD}15` : "transparent",
                      color:       active ? GOLD : "#6B7280",
                    }}>
                    {n === 0 ? "Tous" : n === 5 ? "5+" : n}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Superficie */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Surface min. (m²)</label>
          <input
            type="number" min={0} placeholder="0"
            value={filters.surfaceMin}
            onChange={e => onChange({ surfaceMin: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
            style={{ borderColor: B, color: NAVY }}
          />
        </div>

        {/* Équipements */}
        {filters.tab !== "terrain" && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Équipements</label>
            <div className="space-y-2.5">
              {EQUIPEMENTS_LIST.map(eq => {
                const checked = filters.equipements.includes(eq);
                return (
                  <label key={eq} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all"
                      style={{
                        borderColor: checked ? GOLD : "#D1D5DB",
                        background:  checked ? GOLD : "white",
                      }}
                      onClick={() => {
                        const next = checked
                          ? filters.equipements.filter(x => x !== eq)
                          : [...filters.equipements, eq];
                        onChange({ equipements: next });
                      }}
                    >
                      {checked && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-[#0F1C2E] transition-colors">{eq}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer — only on mobile drawer */}
      {onClose && (
        <div className="p-5 border-t" style={{ borderColor: B }}>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-colors"
            style={{ background: GOLD }}
          >
            Voir {count} bien{count !== 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // ── Init from URL ──────────────────────────────────────────────────────────
  const initTab = (searchParams.get("tab") as Transaction) || "vente";

  const [filters, setFilters] = useState<Filters>({
    tab:         initTab,
    search:      searchParams.get("search")   || "",
    ville:       "",
    quartier:    searchParams.get("quartier") || "",
    type:        searchParams.get("type")     || "",
    prixMin:     "",
    prixMax:     "",
    chambresMin: 0,
    surfaceMin:  "",
    equipements: [],
  });

  const [sort,     setSort]     = useState<SortKey>("pertinence");
  const [view,     setView]     = useState<ViewMode>("grid");
  const [page,     setPage]     = useState(1);
  const [sideOpen, setSideOpen] = useState(false);

  // Separate input state for text — debounced before applying to filters
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 380);

  // Apply debounced search value into filters
  useEffect(() => {
    startTransition(() => {
      setFilters(f => ({ ...f, search: debouncedSearch }));
      setPage(1);
    });
  }, [debouncedSearch]);

  // Sync tab/quartier/type back to URL (replace, no push)
  useEffect(() => {
    const p = new URLSearchParams();
    p.set("tab", filters.tab);
    if (filters.search)   p.set("search",   filters.search);
    if (filters.quartier) p.set("quartier", filters.quartier);
    if (filters.type)     p.set("type",     filters.type);
    setSearchParams(p, { replace: true });
  }, [filters.tab, filters.search, filters.quartier, filters.type, setSearchParams]);

  // Merge helper — wraps in transition so React can batch + show pending state
  const merge = useCallback((patch: Partial<Filters>) => {
    startTransition(() => {
      setFilters(f => ({ ...f, ...patch }));
      setPage(1);
    });
  }, []);

  // ── Filter logic ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = ALL_PROPERTIES.filter(p => p.transaction === filters.tab);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      r = r.filter(p =>
        p.title.toLowerCase().includes(q)    ||
        p.location.toLowerCase().includes(q) ||
        p.ref.toLowerCase().includes(q)      ||
        p.quartier.toLowerCase().includes(q) ||
        p.ville.toLowerCase().includes(q)
      );
    }
    if (filters.ville)        r = r.filter(p => p.ville       === filters.ville);
    if (filters.quartier)     r = r.filter(p => p.quartier    === filters.quartier);
    if (filters.type)         r = r.filter(p => p.propertyType === filters.type);
    if (filters.prixMin)      r = r.filter(p => p.price        >= Number(filters.prixMin));
    if (filters.prixMax)      r = r.filter(p => p.price        <= Number(filters.prixMax));
    if (filters.chambresMin)  r = r.filter(p => p.beds         >= filters.chambresMin);
    if (filters.surfaceMin)   r = r.filter(p => p.surface      >= Number(filters.surfaceMin));
    if (filters.equipements.length)
      r = r.filter(p => filters.equipements.every(eq => p.equipements.includes(eq)));

    return [...r].sort(SORT_FN[sort]);
  }, [filters, sort]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const perPage     = PER_PAGE[view];
  const totalPages  = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageItems   = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const goPage = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Active chips ───────────────────────────────────────────────────────────
  const activeChips = [
    filters.ville       && { key: "ville",       label: filters.ville },
    filters.quartier    && { key: "quartier",     label: filters.quartier },
    filters.type        && { key: "type",         label: filters.type },
    filters.prixMin     && { key: "prixMin",      label: `≥ ${fmt(Number(filters.prixMin))} FCFA` },
    filters.prixMax     && { key: "prixMax",      label: `≤ ${fmt(Number(filters.prixMax))} FCFA` },
    filters.chambresMin > 0 && { key: "chambresMin", label: `${filters.chambresMin}+ ch.` },
    filters.surfaceMin  && { key: "surfaceMin",   label: `${filters.surfaceMin}+ m²` },
    ...filters.equipements.map(eq => ({ key: `eq:${eq}`, label: eq })),
  ].filter(Boolean) as { key: string; label: string }[];

  const removeChip = (key: string) => {
    if (key.startsWith("eq:")) {
      merge({ equipements: filters.equipements.filter(e => `eq:${e}` !== key) });
    } else {
      merge({ [key]: key === "chambresMin" ? 0 : "" } as Partial<Filters>);
    }
  };

  const resetAll = () => {
    startTransition(() => {
      setFilters(f => ({
        ...f,
        search: "", ville: "", quartier: "", type: "",
        prixMin: "", prixMax: "", chambresMin: 0, surfaceMin: "", equipements: [],
      }));
      setSearchInput("");
      setSort("pertinence");
      setPage(1);
    });
  };

  // ── Pagination display ─────────────────────────────────────────────────────
  const pageNums = (): (number | "…")[] => {
    const nums: (number | "…")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        nums.push(i);
      } else if (nums[nums.length - 1] !== "…") {
        nums.push("…");
      }
    }
    return nums;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: CREAM, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="border-b bg-white" style={{ borderColor: B }}>
        <div className="max-w-[1200px] mx-auto px-5 py-5">

          {/* Transaction tabs */}
          <div className="flex gap-1 mb-4">
            {TAB_CFG.map(t => (
              <button
                key={t.key}
                onClick={() => merge({ tab: t.key })}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: filters.tab === t.key ? GOLD : "transparent",
                  color:      filters.tab === t.key ? "#fff" : "#6B7280",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative max-w-xl">
            <MapPin size={16} style={{ color: GOLD }} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Ville, quartier, titre, référence…"
              className="w-full pl-10 pr-10 py-3 rounded-xl border text-sm outline-none transition-all"
              style={{ borderColor: B, color: NAVY }}
            />
            {/* Debounce indicator */}
            {searchInput !== filters.search && (
              <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-gray-300" />
            )}
            {/* Clear button */}
            {searchInput && searchInput === filters.search && (
              <button
                onClick={() => { setSearchInput(""); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeChips.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => removeChip(key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                  style={{ borderColor: GOLD, color: GOLD, background: `${GOLD}10` }}
                >
                  {label}<X size={11} />
                </button>
              ))}
              <button
                onClick={resetAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
                style={{ borderColor: B }}
              >
                <X size={11} />Tout effacer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── LAYOUT ──────────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-5 py-6">
        <div className="flex gap-6 items-start">

          {/* Desktop sidebar */}
          <aside
            className="hidden lg:block shrink-0 sticky top-[84px] rounded-2xl border overflow-hidden"
            style={{ width: 272, maxHeight: "calc(100vh - 100px)", overflowY: "auto", borderColor: B }}
          >
            <FilterSidebar filters={filters} onChange={merge} count={filtered.length} />
          </aside>

          {/* Results column */}
          <div className="flex-1 min-w-0">

            {/* Results bar */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              {/* Counter */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {isPending ? (
                  <Loader2 size={14} className="animate-spin shrink-0" style={{ color: GOLD }} />
                ) : null}
                <span>
                  <span className="font-bold text-[#0F1C2E]">{filtered.length}</span>
                  {" "}bien{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
                  {filtered.length > 0 && (
                    <span className="text-gray-400">
                      {" "}· {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <button
                  onClick={() => setSideOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-colors hover:bg-white"
                  style={{ borderColor: B }}
                >
                  <SlidersHorizontal size={15} style={{ color: GOLD }} />
                  Filtres
                  {activeChips.length > 0 && (
                    <span className="w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                      style={{ background: GOLD }}>
                      {activeChips.length}
                    </span>
                  )}
                </button>

                {/* Sort */}
                <select
                  value={sort}
                  onChange={e => { startTransition(() => { setSort(e.target.value as SortKey); setPage(1); }); }}
                  className="px-3.5 py-2 rounded-xl border text-sm font-semibold outline-none transition-colors bg-white"
                  style={{ borderColor: B, color: NAVY }}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>

                {/* View toggle */}
                <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: B }}>
                  {(["grid", "list"] as ViewMode[]).map(v => (
                    <button
                      key={v}
                      onClick={() => { setView(v); setPage(1); }}
                      className="w-9 h-9 flex items-center justify-center transition-colors"
                      style={{
                        background: view === v ? NAVY : "white",
                        color:      view === v ? "white" : "#9CA3AF",
                      }}
                    >
                      {v === "grid" ? <Grid3X3 size={15} /> : <List size={15} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading bar */}
            {isPending && (
              <div className="h-0.5 rounded-full overflow-hidden mb-4" style={{ background: `${GOLD}20` }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    background: GOLD,
                    animation: "loadbar 0.9s ease-in-out infinite",
                    width: "45%",
                  }}
                />
                <style>{`@keyframes loadbar { 0%{transform:translateX(-120%)} 100%{transform:translateX(280%)} }`}</style>
              </div>
            )}

            {/* ── CARDS ─────────────────────────────────────────────────── */}
            {isPending ? (
              /* Skeleton loading state */
              view === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: perPage }).map((_, i) => <SkeletonCard key={i} variant="grid" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: perPage }).map((_, i) => <SkeletonCard key={i} variant="list" />)}
                </div>
              )
            ) : pageItems.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: `${GOLD}12` }}>
                  <Search size={32} style={{ color: GOLD }} />
                </div>
                <h3 className="font-bold text-[#0F1C2E] mb-2"
                  style={{ fontFamily: "'Playfair Display',serif", fontSize: 22 }}>
                  Aucun bien trouvé
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mb-6 leading-relaxed">
                  Aucun bien ne correspond à vos critères.
                  Essayez de modifier ou d'effacer certains filtres.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={resetAll}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                    style={{ background: GOLD }}
                  >
                    Effacer tous les filtres
                  </button>
                  <button
                    onClick={() => merge({ tab: filters.tab === "vente" ? "location" : "vente" })}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors"
                    style={{ borderColor: B, color: NAVY }}
                  >
                    {filters.tab === "vente" ? "Voir les locations" : "Voir les ventes"}
                  </button>
                </div>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {pageItems.map((p, i) => (
                  <AnimCard key={p.id} delay={i * 0.06}>
                    <PropertyCard prop={p} variant="grid" />
                  </AnimCard>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {pageItems.map((p, i) => (
                  <AnimCard key={p.id} delay={i * 0.06}>
                    <PropertyCard prop={p} variant="list" />
                  </AnimCard>
                ))}
              </div>
            )}

            {/* ── PAGINATION ────────────────────────────────────────────── */}
            {!isPending && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  disabled={currentPage === 1}
                  onClick={() => goPage(currentPage - 1)}
                  className="w-9 h-9 rounded-xl border flex items-center justify-center text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ borderColor: B }}
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNums().map((n, i) =>
                  n === "…" ? (
                    <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => goPage(n as number)}
                      className="w-9 h-9 rounded-xl border text-sm font-bold transition-all"
                      style={{
                        borderColor: currentPage === n ? GOLD : B,
                        background:  currentPage === n ? GOLD : "white",
                        color:       currentPage === n ? "white" : "#374151",
                      }}
                    >
                      {n}
                    </button>
                  )
                )}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => goPage(currentPage + 1)}
                  className="w-9 h-9 rounded-xl border flex items-center justify-center text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ borderColor: B }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Bottom summary */}
            {!isPending && filtered.length > 0 && totalPages > 1 && (
              <p className="text-center text-xs text-gray-400 mt-4">
                Page {currentPage} sur {totalPages} · {filtered.length} bien{filtered.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {sideOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSideOpen(false)} />
          <div className="relative w-80 h-full flex flex-col shadow-2xl">
            <FilterSidebar
              filters={filters}
              onChange={merge}
              count={filtered.length}
              onClose={() => setSideOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
