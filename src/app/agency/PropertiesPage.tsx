import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Plus, Search, Pencil, Trash2, Eye, MapPin, X, MoreHorizontal,
  Copy, CheckCircle, Clock, Archive, AlertCircle, ChevronDown,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import { type Transaction, type Status, NAVY, GOLD, B, STATUS_CFG, fmt } from "../data";
import {
  useProperties, updateProperty, deleteProperty, duplicateProperty,
  type StoreProp,
} from "./store";

// ─── Types & config ───────────────────────────────────────────────────────────
const TABS: { key: "all" | Transaction; label: string }[] = [
  { key: "all",      label: "Tous"     },
  { key: "vente",    label: "Vente"    },
  { key: "location", label: "Location" },
  { key: "terrain",  label: "Terrain"  },
];

const STATUS_ACTIONS: { status: Status; label: string; icon: typeof CheckCircle }[] = [
  { status: "disponible", label: "Publier",           icon: CheckCircle  },
  { status: "réservé",    label: "Marquer réservé",   icon: Clock        },
  { status: "loué",       label: "Marquer loué",      icon: AlertCircle  },
  { status: "vendu",      label: "Archiver",          icon: Archive      },
];

// ─── Row Actions Dropdown ─────────────────────────────────────────────────────
function ActionsDropdown({ prop, onDelete }: { prop: StoreProp; onDelete: (id: number) => void }) {
  const currentStatus = prop.status as Status;

  const handleStatus = (status: Status) => {
    updateProperty(prop.id, { status });
    toast.success(`Statut mis à jour : ${STATUS_CFG[status].label}`);
  };

  const handleDuplicate = () => {
    const dup = duplicateProperty(prop.id);
    if (dup) toast.success(`Bien dupliqué : ${dup.ref}`);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Plus d'actions">
          <MoreHorizontal size={15} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end" sideOffset={4}
          className="bg-white rounded-2xl border shadow-2xl z-50 min-w-[200px] py-1.5 overflow-hidden"
          style={{ borderColor: B }}>

          {/* Duplication */}
          <DropdownMenu.Item
            onSelect={handleDuplicate}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
            <Copy size={14} className="text-gray-400" />Dupliquer
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />

          {/* Status actions */}
          <div className="px-4 py-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Changer le statut</p>
          </div>

          {STATUS_ACTIONS.filter(a => a.status !== currentStatus).map(({ status, label, icon: Icon }) => (
            <DropdownMenu.Item
              key={status}
              onSelect={() => handleStatus(status)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${STATUS_CFG[status].bg}`}>
                <span className={`w-2 h-2 rounded-full ${STATUS_CFG[status].dot}`} />
              </div>
              {label}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />

          {/* Delete */}
          <DropdownMenu.Item
            onSelect={() => onDelete(prop.id)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-red-50 text-red-500 outline-none">
            <Trash2 size={14} />Supprimer
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ prop, onClose, onConfirm }: {
  prop: StoreProp; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="font-bold text-[#0F1C2E] text-center mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
          Supprimer ce bien ?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-1">{prop.title}</p>
        <p className="text-xs font-mono text-gray-300 text-center mb-5">{prop.ref}</p>
        <p className="text-xs text-gray-400 text-center mb-6">
          Cette action est irréversible. Le bien sera définitivement supprimé de la liste.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose}
            className="py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-gray-50"
            style={{ borderColor: B, color: NAVY }}>
            Annuler
          </button>
          <button onClick={onConfirm}
            className="py-3 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition-colors">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline status badge-select ───────────────────────────────────────────────
function StatusSelect({ prop }: { prop: StoreProp }) {
  const st     = STATUS_CFG[prop.status as Status];
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${st.bg} ${st.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
        {st.label}
        <ChevronDown size={10} className="opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border shadow-xl min-w-[150px] py-1 overflow-hidden" style={{ borderColor: B }}>
            {(Object.keys(STATUS_CFG) as Status[]).map(s => {
              const cfg = STATUS_CFG[s];
              return (
                <button key={s}
                  onClick={() => {
                    if (s !== prop.status) {
                      updateProperty(prop.id, { status: s });
                      toast.success(`Statut : ${cfg.label}`);
                    }
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold transition-colors hover:bg-[#F8F6F2] ${s === prop.status ? "opacity-40" : ""}`}
                  style={{ color: NAVY }}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                  {s === prop.status && <CheckCircle size={11} className="ml-auto" style={{ color: GOLD }} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PropertiesPage() {
  const properties = useProperties();
  const [tab,      setTab]      = useState<"all" | Transaction>("all");
  const [search,   setSearch]   = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let r = [...properties];
    if (tab !== "all")   r = r.filter(p => p.transaction === tab);
    if (search.trim())   r = r.filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase())    ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.ref.toLowerCase().includes(search.toLowerCase())
    );
    return r;
  }, [properties, tab, search]);

  const deleteProp = deleteId !== null ? properties.find(p => p.id === deleteId) : null;

  const handleConfirmDelete = () => {
    if (deleteId === null) return;
    const title = deleteProp?.title ?? "";
    deleteProperty(deleteId);
    setDeleteId(null);
    toast.error(`"${title}" supprimé`);
  };

  // ── Count by tab ─────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:      properties.length,
    vente:    properties.filter(p => p.transaction === "vente").length,
    location: properties.filter(p => p.transaction === "location").length,
    terrain:  properties.filter(p => p.transaction === "terrain").length,
  }), [properties]);

  return (
    <div className="p-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1C2E]" style={{ fontFamily: "'Playfair Display',serif" }}>
            Mes biens
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {filtered.length} bien{filtered.length !== 1 ? "s" : ""}
            {tab !== "all" || search ? ` correspondants` : " au total"}
          </p>
        </div>
        <Link to="/agence/biens/nouveau"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors hover:opacity-90"
          style={{ background: GOLD }}>
          <Plus size={16} />Nouveau bien
        </Link>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl border bg-white" style={{ borderColor: B }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
              style={{
                background: tab === t.key ? GOLD : "transparent",
                color:      tab === t.key ? "white" : "#6B7280",
              }}>
              {t.label}
              <span className={`text-[11px] font-bold px-1.5 rounded-full ${tab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Titre, ville, référence…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white"
            style={{ borderColor: B, color: NAVY }} />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: B }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: B, background: "#F8F6F2" }}>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Bien</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Prix</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Surface</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: B }}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14">
                    <Search size={24} className="mx-auto mb-3 opacity-20" />
                    <p className="text-gray-400 text-sm">Aucun bien trouvé</p>
                    {search && (
                      <button onClick={() => setSearch("")}
                        className="text-xs font-bold mt-2 transition-colors"
                        style={{ color: GOLD }}>
                        Effacer la recherche
                      </button>
                    )}
                  </td>
                </tr>
              ) : filtered.map(p => {
                const st = STATUS_CFG[p.status as Status];
                return (
                  <tr key={p.id} className="hover:bg-[#F8F6F2] transition-colors">
                    {/* Bien */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={p.img} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-[#0F1C2E] truncate max-w-[160px]">{p.title}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />{p.location}
                          </div>
                          <div className="text-[10px] font-mono text-gray-300">{p.ref}</div>
                        </div>
                      </div>
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F0EDE8] text-[#7A6A52]">
                        {p.propertyType}
                      </span>
                    </td>
                    {/* Prix */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold" style={{ fontFamily: "'DM Mono',monospace", color: GOLD, fontSize: 13 }}>
                        {fmt(p.price)}
                      </div>
                      <div className="text-[10px] text-gray-400">FCFA</div>
                    </td>
                    {/* Surface */}
                    <td className="px-4 py-3.5 hidden lg:table-cell text-gray-600">{p.surface} m²</td>
                    {/* Statut */}
                    <td className="px-4 py-3.5">
                      <StatusSelect prop={p} />
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        {/* View public */}
                        <Link to={`/bien/${p.id}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0F1C2E] hover:bg-gray-100 transition-colors"
                          title="Voir la fiche publique">
                          <Eye size={15} />
                        </Link>
                        {/* Edit */}
                        <Link to={`/agence/biens/${p.id}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#C9963A] hover:bg-[#FDF6E7] transition-colors"
                          title="Modifier">
                          <Pencil size={15} />
                        </Link>
                        {/* More actions dropdown */}
                        <ActionsDropdown prop={p} onDelete={setDeleteId} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: B, background: "#FAFAF9" }}>
            <p className="text-xs text-gray-400">
              {filtered.length} sur {properties.length} bien{properties.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{properties.filter(p => p.status === "disponible").length} disponibles</span>
              <span className="text-gray-200">·</span>
              <span>{properties.filter(p => p.status === "réservé" || p.status === "loué").length} en cours</span>
              <span className="text-gray-200">·</span>
              <span>{properties.filter(p => p.status === "vendu").length} archivés</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation ──────────────────────────────────────────── */}
      {deleteId !== null && deleteProp && (
        <DeleteModal
          prop={deleteProp}
          onClose={() => setDeleteId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
