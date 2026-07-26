import { useState, useMemo, useEffect, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, Home, Users, Calendar, Handshake, Download,
  RefreshCw, AlertTriangle, BarChart3, DollarSign,
  ChevronDown, Building2, Star, FileText, Loader2,
  ArrowUpRight, ArrowDownRight, CheckCircle, X,
} from "lucide-react";
import { toast } from "sonner";
import { NAVY, GOLD, B, AGENTS, fmt, VILLES, PROP_TYPES } from "../data";
import { useProperties } from "./store";
import { useOffers, OFFER_STATUS_CFG } from "./offersStore";

// ─── Static report data (visits + prospects — managed locally in their pages) ──
type RVisit = {
  id: number; propTitle: string; propTransaction: string; propType: string;
  agent: string; ville: string; statut: string; date: string;
};
type RProspect = {
  id: number; name: string; agent: string; ville: string;
  stage: string; propType: string; propTransaction: string; date: string;
};

const REPORT_VISITS: RVisit[] = [
  { id:1,  propTitle:"Villa Contemporaine d'Exception", propTransaction:"vente",    propType:"Villa",       agent:"Amadou Ba",      ville:"Dakar", statut:"effectuée",  date:"2026-07-20" },
  { id:2,  propTitle:"Villa de Luxe Balnéaire",         propTransaction:"vente",    propType:"Villa",       agent:"Amadou Ba",      ville:"Mbour", statut:"confirmée",  date:"2026-07-18" },
  { id:3,  propTitle:"Duplex Prestige Vue Mer",         propTransaction:"vente",    propType:"Duplex",      agent:"Fatou Diallo",   ville:"Dakar", statut:"planifiée",  date:"2026-07-22" },
  { id:4,  propTitle:"Villa Meublée Almadies",          propTransaction:"location", propType:"Villa",       agent:"Amadou Ba",      ville:"Dakar", statut:"effectuée",  date:"2026-07-10" },
  { id:5,  propTitle:"Duplex Point E",                  propTransaction:"location", propType:"Duplex",      agent:"Ousmane Ndiaye", ville:"Dakar", statut:"effectuée",  date:"2026-06-28" },
  { id:6,  propTitle:"Terrain Balnéaire Saly",          propTransaction:"terrain",  propType:"Terrain",     agent:"Ousmane Ndiaye", ville:"Mbour", statut:"annulée",    date:"2026-07-05" },
  { id:7,  propTitle:"Villa Moderne avec Piscine",      propTransaction:"vente",    propType:"Villa",       agent:"Fatou Diallo",   ville:"Dakar", statut:"planifiée",  date:"2026-07-22" },
  { id:8,  propTitle:"Appartement Familial Yoff",       propTransaction:"location", propType:"Appartement", agent:"Amadou Ba",      ville:"Dakar", statut:"reportée",   date:"2026-07-15" },
  { id:9,  propTitle:"Studio Étudiant Mermoz",          propTransaction:"location", propType:"Studio",      agent:"Fatou Diallo",   ville:"Dakar", statut:"effectuée",  date:"2026-06-15" },
  { id:10, propTitle:"Villa Les Mamelles",              propTransaction:"vente",    propType:"Villa",       agent:"Amadou Ba",      ville:"Dakar", statut:"confirmée",  date:"2026-07-19" },
  { id:11, propTitle:"Terrain Titré Mbour",             propTransaction:"terrain",  propType:"Terrain",     agent:"Ousmane Ndiaye", ville:"Mbour", statut:"effectuée",  date:"2026-06-10" },
  { id:12, propTitle:"Maison Familiale Thiès",          propTransaction:"location", propType:"Villa",       agent:"Ousmane Ndiaye", ville:"Thiès", statut:"effectuée",  date:"2026-06-20" },
];

const REPORT_PROSPECTS: RProspect[] = [
  { id:1,  name:"Moussa Diallo",    agent:"Amadou Ba",      ville:"Dakar",    stage:"offre",       propType:"Villa",       propTransaction:"vente",    date:"2026-06-01" },
  { id:2,  name:"Ibrahima Fall",    agent:"Fatou Diallo",   ville:"Dakar",    stage:"visite",      propType:"Villa",       propTransaction:"vente",    date:"2026-07-10" },
  { id:3,  name:"Rokhaya Diop",     agent:"Fatou Diallo",   ville:"Dakar",    stage:"offre",       propType:"Duplex",      propTransaction:"vente",    date:"2026-07-18" },
  { id:4,  name:"Aminata Sow",      agent:"Ousmane Ndiaye", ville:"Dakar",    stage:"gagné",       propType:"Duplex",      propTransaction:"location", date:"2026-06-25" },
  { id:5,  name:"Oumar Sarr",       agent:"Amadou Ba",      ville:"Mbour",    stage:"négociation", propType:"Villa",       propTransaction:"vente",    date:"2026-07-05" },
  { id:6,  name:"Cheikh Mbaye",     agent:"Amadou Ba",      ville:"Dakar",    stage:"gagné",       propType:"Villa",       propTransaction:"location", date:"2026-06-01" },
  { id:7,  name:"Ndéye Diallo",     agent:"Ousmane Ndiaye", ville:"Mbour",    stage:"annulé",      propType:"Terrain",     propTransaction:"terrain",  date:"2026-07-01" },
  { id:8,  name:"Serigne C. Mbaye", agent:"Amadou Ba",      ville:"Dakar",    stage:"contrat",     propType:"Villa",       propTransaction:"vente",    date:"2026-06-15" },
  { id:9,  name:"Marième Sall",     agent:"Amadou Ba",      ville:"Dakar",    stage:"contacté",    propType:"Villa",       propTransaction:"vente",    date:"2026-07-18" },
  { id:10, name:"Ibrahim Kouyaté",  agent:"Fatou Diallo",   ville:"Dakar",    stage:"qualifié",    propType:"Appartement", propTransaction:"location", date:"2026-07-13" },
  { id:11, name:"Pape Sow",         agent:"Ousmane Ndiaye", ville:"Thiès",    stage:"visite",      propType:"Terrain",     propTransaction:"terrain",  date:"2026-07-08" },
  { id:12, name:"Aïda Ndiaye",      agent:"Fatou Diallo",   ville:"Dakar",    stage:"nouveau",     propType:"Appartement", propTransaction:"location", date:"2026-07-19" },
  { id:13, name:"Babacar Fall",     agent:"Amadou Ba",      ville:"Rufisque", stage:"qualifié",    propType:"Terrain",     propTransaction:"terrain",  date:"2026-07-12" },
  { id:14, name:"Fatou Mbodj",      agent:"Fatou Diallo",   ville:"Dakar",    stage:"visite",      propType:"Villa",       propTransaction:"location", date:"2026-07-16" },
  { id:15, name:"Omar Diallo",      agent:"Ousmane Ndiaye", ville:"Mbour",    stage:"nouveau",     propType:"Terrain",     propTransaction:"terrain",  date:"2026-07-14" },
];

const HISTORICAL: Record<string, { offres:number; tx:number; visites:number; prospects:number }> = {
  "2026-01": { offres:2, tx:1, visites:4,  prospects:5  },
  "2026-02": { offres:3, tx:1, visites:6,  prospects:6  },
  "2026-03": { offres:4, tx:2, visites:8,  prospects:8  },
  "2026-04": { offres:3, tx:2, visites:7,  prospects:7  },
  "2026-05": { offres:5, tx:3, visites:9,  prospects:9  },
};
const MONTHS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul"];
const MONTH_KEYS    = ["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function commission(montant: number, tx: string) {
  if (tx === "location") return montant * 12 * 0.05;
  return montant * 0.03;
}

function inPeriod(dateStr: string, periode: string) {
  if (periode === "tout") return true;
  const d = new Date(dateStr);
  if (periode === "mois")      return d.getFullYear() === 2026 && d.getMonth() === 6;
  if (periode === "trimestre") return d.getFullYear() === 2026 && d.getMonth() >= 6;
  if (periode === "annee")     return d.getFullYear() === 2026;
  return true;
}

function exportCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FilterSelect({
  value, onChange, options, allLabel, minWidth = 140,
}: { value:string; onChange:(v:string)=>void; options:{value:string;label:string}[]; allLabel:string; minWidth?:number }) {
  const active = !!value;
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none text-sm font-semibold rounded-xl border pl-3 pr-8 py-2 bg-white cursor-pointer outline-none transition-all focus:ring-2 focus:ring-[#C9963A]/30"
        style={{
          borderColor: active ? GOLD : B,
          color: active ? GOLD : "#6B7280",
          minWidth,
        }}
      >
        <option value="">{allLabel}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: active ? GOLD : "#9CA3AF" }} />
    </div>
  );
}

function KPICard({ label, value, icon, color, sub, loading }: {
  label:string; value:string|number; icon:React.ReactNode;
  color:string; sub?:string; loading?:boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5 flex flex-col gap-3" style={{ borderColor: B }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, color }}>
          {icon}
        </div>
        {sub && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">{sub}</span>}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 rounded-lg w-20" style={{ background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }} />
          <div className="h-4 rounded w-16" style={{ background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }} />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold leading-tight" style={{ fontFamily:"'DM Mono',monospace", color }}>
            {value}
          </div>
          <div className="text-sm text-gray-500">{label}</div>
        </>
      )}
    </div>
  );
}

function EmptyState({ onReset }: { onReset:()=>void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: `${GOLD}10` }}>
        <BarChart3 size={26} style={{ color: `${GOLD}80` }} />
      </div>
      <div className="text-base font-bold mb-1" style={{ color: NAVY }}>Aucune donnée pour ces filtres</div>
      <div className="text-sm text-gray-400 mb-5">Modifiez vos critères pour afficher des résultats.</div>
      <button onClick={onReset}
        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
        style={{ background: `${GOLD}15`, color: GOLD }}>
        Réinitialiser les filtres
      </button>
    </div>
  );
}

function ErrorBanner({ onRetry, onClose }: { onRetry:()=>void; onClose:()=>void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-5 flex items-start gap-4 mb-6">
      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
        <AlertTriangle size={18} className="text-red-500" />
      </div>
      <div className="flex-1">
        <div className="font-bold text-red-700 text-sm">Erreur de chargement</div>
        <div className="text-red-600 text-xs mt-0.5">Impossible de récupérer les données. Veuillez réessayer.</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
          <RefreshCw size={12} />Réessayer
        </button>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-100 transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

const RTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-xl px-3 py-2.5 text-xs shadow-lg" style={{ borderColor: B }}>
      {label && <div className="font-bold mb-1.5" style={{ color: NAVY }}>{label}</div>}
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color ?? p.fill }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-bold" style={{ color: NAVY }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
interface Filters {
  periode: string; ville: string; typeBien: string; agent: string; transaction: string;
}
const BLANK_F: Filters = { periode:"", ville:"", typeBien:"", agent:"", transaction:"" };

const PERIODE_OPTS = [
  { value:"mois",      label:"Ce mois" },
  { value:"trimestre", label:"Ce trimestre" },
  { value:"annee",     label:"Cette année" },
];
const TX_OPTS = [
  { value:"vente",    label:"Vente" },
  { value:"location", label:"Location" },
  { value:"terrain",  label:"Terrain" },
];

export default function StatsPage() {
  const properties = useProperties();
  const offers     = useOffers();
  const [filters, setFilters] = useState<Filters>(BLANK_F);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(false);

  // Simulate loading on filter change
  const filterKey = Object.values(filters).join("|");
  const prevKey   = useRef<string | null>(null);
  useEffect(() => {
    if (prevKey.current === null) { prevKey.current = filterKey; return; }
    if (prevKey.current === filterKey) return;
    prevKey.current = filterKey;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, [filterKey]);

  const setF = (p: Partial<Filters>) => setFilters(f => ({ ...f, ...p }));
  const resetFilters = () => setFilters(BLANK_F);
  const hasFilters = Object.values(filters).some(Boolean);

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filteredProps = useMemo(() => properties.filter(p => {
    if (filters.ville       && p.ville          !== filters.ville)       return false;
    if (filters.typeBien    && p.propertyType   !== filters.typeBien)    return false;
    if (filters.agent       && p.agent?.name    !== filters.agent)       return false;
    if (filters.transaction && p.transaction    !== filters.transaction) return false;
    return true;
  }), [properties, filters]);

  const filteredOffers = useMemo(() => offers.filter(o => {
    if (filters.agent       && o.agentName      !== filters.agent)       return false;
    if (filters.transaction && o.propTransaction !== filters.transaction) return false;
    if (filters.periode     && !inPeriod(o.createdAt, filters.periode))  return false;
    // ville: cross-reference with properties
    if (filters.ville) {
      const prop = properties.find(p => p.id === o.propId);
      if (prop && prop.ville !== filters.ville) return false;
    }
    if (filters.typeBien) {
      const prop = properties.find(p => p.id === o.propId);
      if (prop && prop.propertyType !== filters.typeBien) return false;
    }
    return true;
  }), [offers, properties, filters]);

  const filteredVisits = useMemo(() => REPORT_VISITS.filter(v => {
    if (filters.ville       && v.ville          !== filters.ville)       return false;
    if (filters.agent       && v.agent          !== filters.agent)       return false;
    if (filters.typeBien    && v.propType        !== filters.typeBien)    return false;
    if (filters.transaction && v.propTransaction !== filters.transaction) return false;
    if (filters.periode     && !inPeriod(v.date,  filters.periode))      return false;
    return true;
  }), [filters]);

  const filteredProspects = useMemo(() => REPORT_PROSPECTS.filter(p => {
    if (filters.ville       && p.ville          !== filters.ville)       return false;
    if (filters.agent       && p.agent          !== filters.agent)       return false;
    if (filters.typeBien    && p.propType        !== filters.typeBien)    return false;
    if (filters.transaction && p.propTransaction !== filters.transaction) return false;
    if (filters.periode     && !inPeriod(p.date,  filters.periode))      return false;
    return true;
  }), [filters]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const finalized   = filteredOffers.filter(o => o.statut === "finalisée");
    const active      = filteredOffers.filter(o => !["finalisée","annulée"].includes(o.statut));
    const comm        = finalized.reduce((s, o) => s + commission(o.montant, o.propTransaction), 0);
    return {
      annonces:    filteredProps.length,
      ventes:      finalized.filter(o => o.propTransaction === "vente").length,
      locations:   finalized.filter(o => o.propTransaction === "location").length,
      prospects:   filteredProspects.length,
      visites:     filteredVisits.filter(v => v.statut === "effectuée").length,
      offresActives: active.length,
      transactions: finalized.length,
      commissions:  comm,
    };
  }, [filteredProps, filteredOffers, filteredVisits, filteredProspects]);

  // ── Donut mix ──────────────────────────────────────────────────────────────
  const txMix = useMemo(() => {
    const total = filteredOffers.length || 1;
    const v = filteredOffers.filter(o => o.propTransaction === "vente").length;
    const l = filteredOffers.filter(o => o.propTransaction === "location").length;
    const t = filteredOffers.filter(o => o.propTransaction === "terrain").length;
    return [
      { name:"Vente",    value: Math.round(v/total*100), count:v, color:NAVY  },
      { name:"Location", value: Math.round(l/total*100), count:l, color:GOLD  },
      { name:"Terrain",  value: Math.round(t/total*100), count:t, color:"#16A34A" },
    ];
  }, [filteredOffers]);

  // ── Monthly trend ──────────────────────────────────────────────────────────
  const monthlyData = useMemo(() =>
    MONTHS_LABELS.map((mois, i) => {
      const key  = MONTH_KEYS[i];
      const base = HISTORICAL[key];
      if (base) return { mois, ...base };
      // Compute live for Jun/Jul 2026
      return {
        mois,
        offres:    filteredOffers.filter(o => o.createdAt.startsWith(key)).length,
        tx:        filteredOffers.filter(o => o.statut === "finalisée" && o.updatedAt.startsWith(key)).length,
        visites:   filteredVisits.filter(v => v.date.startsWith(key)).length,
        prospects: filteredProspects.filter(p => p.date.startsWith(key)).length,
      };
    }),
  [filteredOffers, filteredVisits, filteredProspects]);

  // ── Agent performance ──────────────────────────────────────────────────────
  const agentPerf = useMemo(() =>
    AGENTS.map(ag => {
      const agOffers  = filteredOffers.filter(o => o.agentName === ag.name);
      const agFin     = agOffers.filter(o => o.statut === "finalisée");
      const agComm    = agFin.reduce((s, o) => s + commission(o.montant, o.propTransaction), 0);
      return {
        name:         ag.name,
        avatar:       ag.avatar,
        rating:       ag.rating,
        annonces:     filteredProps.filter(p => p.agent?.name === ag.name).length,
        prospects:    filteredProspects.filter(p => p.agent === ag.name).length,
        visites:      filteredVisits.filter(v => v.agent === ag.name).length,
        offres:       agOffers.length,
        transactions: agFin.length,
        commission:   agComm,
      };
    }),
  [filteredOffers, filteredProps, filteredVisits, filteredProspects]);

  // ── Empty state detection ──────────────────────────────────────────────────
  const isEmpty = !loading && hasFilters &&
    filteredOffers.length === 0 &&
    filteredProps.length === 0 &&
    filteredVisits.length === 0 &&
    filteredProspects.length === 0;

  // ── CSV export ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const header = ["Bien","Réf.","Type","Agent","Prospect","Montant (FCFA)","Statut","Date"];
    const rows = filteredOffers.map(o => [
      o.propTitle, o.propRef, o.propTransaction, o.agentName,
      o.prospectName, String(o.montant), o.statut, o.updatedAt,
    ]);
    exportCSV([header, ...rows], `rapport-immosenegal-${new Date().toISOString().slice(0,10)}.csv`);
    toast.success("Rapport CSV exporté avec succès");
  };

  const handleExportPDF = () => {
    toast.info("Génération du rapport en cours…");
    setTimeout(() => toast.success("Rapport PDF prêt — téléchargement simulé"), 2000);
  };

  const handleSimulateError = () => { setError(true); };
  const handleRetry = () => { setError(false); setLoading(true); setTimeout(() => setLoading(false), 700); };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold" style={{ fontFamily:"'Playfair Display',serif", color:NAVY }}>
            Rapports & Statistiques
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Vue consolidée des performances — 2026
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:bg-gray-50"
            style={{ borderColor: B, color: NAVY }}
          >
            <FileText size={15} />Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: NAVY }}
          >
            <Download size={15} />Export PDF
          </button>
          <button
            onClick={handleSimulateError}
            title="Simuler une erreur"
            className="w-9 h-9 flex items-center justify-center rounded-xl border text-gray-300 hover:text-red-400 hover:border-red-200 transition-colors"
            style={{ borderColor: B }}
          >
            <AlertTriangle size={14} />
          </button>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border p-4" style={{ borderColor: B }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold shrink-0" style={{ color: NAVY }}>
            <BarChart3 size={15} style={{ color: GOLD }} />Filtres
          </div>

          <FilterSelect
            value={filters.periode}
            onChange={v => setF({ periode: v })}
            options={PERIODE_OPTS}
            allLabel="Toute période"
            minWidth={130}
          />
          <FilterSelect
            value={filters.ville}
            onChange={v => setF({ ville: v })}
            options={VILLES.map(x => ({ value:x, label:x }))}
            allLabel="Toutes les villes"
            minWidth={150}
          />
          <FilterSelect
            value={filters.typeBien}
            onChange={v => setF({ typeBien: v })}
            options={PROP_TYPES.map(x => ({ value:x, label:x }))}
            allLabel="Tous les types"
            minWidth={140}
          />
          <FilterSelect
            value={filters.agent}
            onChange={v => setF({ agent: v })}
            options={AGENTS.map(a => ({ value:a.name, label:a.name }))}
            allLabel="Tous les agents"
            minWidth={155}
          />
          <FilterSelect
            value={filters.transaction}
            onChange={v => setF({ transaction: v })}
            options={TX_OPTS}
            allLabel="Tous les types"
            minWidth={140}
          />

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-gray-100"
              style={{ color: "#EF4444" }}
            >
              <X size={12} />Réinitialiser
            </button>
          )}

          {loading && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 ml-auto">
              <Loader2 size={13} className="animate-spin" />Calcul en cours…
            </div>
          )}
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && <ErrorBanner onRetry={handleRetry} onClose={() => setError(false)} />}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {isEmpty && !error ? (
        <div className="bg-white rounded-2xl border" style={{ borderColor: B }}>
          <EmptyState onReset={resetFilters} />
        </div>
      ) : (
        <>
          {/* ── KPI grid ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Annonces en portefeuille" icon={<Home size={18}/>} color={NAVY}
              value={loading ? "—" : kpis.annonces} loading={loading}
            />
            <KPICard
              label="Ventes finalisées" icon={<Handshake size={18}/>} color="#16A34A"
              value={loading ? "—" : kpis.ventes} loading={loading}
            />
            <KPICard
              label="Locations finalisées" icon={<Building2 size={18}/>} color={GOLD}
              value={loading ? "—" : kpis.locations} loading={loading}
            />
            <KPICard
              label="Offres en cours" icon={<TrendingUp size={18}/>} color="#3B82F6"
              value={loading ? "—" : kpis.offresActives} loading={loading}
            />
            <KPICard
              label="Prospects suivis" icon={<Users size={18}/>} color="#D97706"
              value={loading ? "—" : kpis.prospects} loading={loading}
            />
            <KPICard
              label="Visites réalisées" icon={<Calendar size={18}/>} color="#7C3AED"
              value={loading ? "—" : kpis.visites} loading={loading}
            />
            <KPICard
              label="Transactions totales" icon={<CheckCircle size={18}/>} color="#16A34A"
              value={loading ? "—" : kpis.transactions} loading={loading}
            />
            <KPICard
              label="Commissions FCFA" icon={<DollarSign size={18}/>} color={GOLD}
              value={loading ? "—" : kpis.commissions > 0 ? `${fmt(Math.round(kpis.commissions/1000))} k` : "0"}
              loading={loading}
            />
          </div>

          {/* ── Charts row 1 ──────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
            {/* Monthly bar chart */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: B }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-[#0F1C2E]">Évolution mensuelle 2026</h2>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background:GOLD }} />Offres</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background:NAVY }} />Transactions</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={B} vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize:11, fill:"#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:"#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<RTooltip />} />
                  <Bar dataKey="offres"    name="Offres reçues"       fill={GOLD} radius={[4,4,0,0]} />
                  <Bar dataKey="tx"        name="Transactions"        fill={NAVY} radius={[4,4,0,0]} />
                  <Bar dataKey="visites"   name="Visites"             fill="#7C3AED" radius={[4,4,0,0]} />
                  <Bar dataKey="prospects" name="Prospects"           fill="#3B82F6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Donut chart */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: B }}>
              <h2 className="font-bold text-[#0F1C2E] mb-5">Répartition des offres</h2>
              {filteredOffers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <BarChart3 size={28} className="text-gray-200 mb-2" />
                  <div className="text-xs text-gray-400">Aucune offre pour ces filtres</div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={txMix} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                        paddingAngle={4} dataKey="value">
                        {txMix.map(({ name, color }) => <Cell key={name} fill={color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v}%`]}
                        contentStyle={{ borderRadius:12, border:`1px solid ${B}`, fontSize:12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {txMix.map(({ name, value, count, color }) => (
                      <div key={name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background:color }} />
                          <span className="text-gray-600">{name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{count} offre{count !== 1 ? "s" : ""}</span>
                          <span className="font-bold text-xs" style={{ color }}>{value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Charts row 2 ──────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            {/* Line chart - evolution offres vs transactions */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: B }}>
              <h2 className="font-bold text-[#0F1C2E] mb-5">Offres vs Transactions — tendance</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={B} vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize:11, fill:"#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:"#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<RTooltip />} />
                  <Line type="monotone" dataKey="offres" name="Offres reçues"
                    stroke={GOLD} strokeWidth={2.5} dot={{ fill:GOLD, r:4 }} activeDot={{ r:6 }} />
                  <Line type="monotone" dataKey="tx" name="Transactions"
                    stroke={NAVY} strokeWidth={2.5} dot={{ fill:NAVY, r:4 }} activeDot={{ r:6 }} />
                  <Line type="monotone" dataKey="prospects" name="Prospects"
                    stroke="#3B82F6" strokeWidth={1.5} strokeDasharray="4 3"
                    dot={{ fill:"#3B82F6", r:3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Agent performance */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: B }}>
              <h2 className="font-bold text-[#0F1C2E] mb-4">Performance agents</h2>
              <div className="space-y-3">
                {agentPerf.map(ag => (
                  <div key={ag.name} className="p-4 rounded-xl border" style={{ borderColor: B }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: GOLD }}>
                        {ag.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate" style={{ color:NAVY }}>{ag.name}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold shrink-0" style={{ color:GOLD }}>
                        <Star size={11} fill={GOLD} />
                        {ag.rating}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label:"Annonces",     v:ag.annonces     },
                        { label:"Visites",      v:ag.visites      },
                        { label:"Transactions", v:ag.transactions },
                      ].map(({ label, v }) => (
                        <div key={label}>
                          <div className="text-base font-bold" style={{ fontFamily:"'DM Mono',monospace", color:NAVY }}>{v}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</div>
                        </div>
                      ))}
                    </div>
                    {ag.commission > 0 && (
                      <div className="mt-3 pt-2 border-t text-xs font-semibold text-gray-500 flex items-center justify-between" style={{ borderColor:B }}>
                        <span>Commission</span>
                        <span className="font-bold" style={{ color:GOLD }}>{fmt(Math.round(ag.commission))} FCFA</span>
                      </div>
                    )}
                    {/* Progress bar */}
                    <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width:`${Math.min((ag.transactions / 3) * 100, 100)}%`, background:GOLD }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Transactions table ────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: B }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: B }}>
              <div>
                <h2 className="font-bold" style={{ color:NAVY }}>Transactions & Offres</h2>
                <p className="text-xs text-gray-400 mt-0.5">{filteredOffers.length} entrée{filteredOffers.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {filteredOffers.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Aucune offre ne correspond aux filtres sélectionnés.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs font-bold text-gray-400 uppercase tracking-wide" style={{ borderColor:B }}>
                      {["Bien","Type","Agent","Prospect","Montant","Statut","Date"].map(h => (
                        <th key={h} className="px-5 py-3 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor:B }}>
                    {filteredOffers.map(o => {
                      const sc = OFFER_STATUS_CFG[o.statut];
                      const comm = commission(o.montant, o.propTransaction);
                      return (
                        <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-[#0F1C2E] text-xs truncate max-w-[160px]">{o.propTitle}</div>
                            <div className="text-gray-400 text-[11px]">{o.propRef}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              o.propTransaction === "vente"    ? "bg-blue-50 text-blue-700" :
                              o.propTransaction === "location" ? "bg-amber-50 text-amber-700" :
                              "bg-emerald-50 text-emerald-700"
                            }`}>
                              {o.propTransaction.charAt(0).toUpperCase() + o.propTransaction.slice(1)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                style={{ background:GOLD, fontSize:9 }}>
                                {o.agentName.split(" ").map(w=>w[0]).join("").slice(0,2)}
                              </div>
                              <span className="text-[#0F1C2E] font-medium text-xs">{o.agentName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-gray-600 text-xs">{o.prospectName}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-xs" style={{ fontFamily:"'DM Mono',monospace", color:NAVY }}>
                              {fmt(o.montant)} FCFA
                            </div>
                            {o.statut === "finalisée" && (
                              <div className="text-[11px] text-emerald-600 font-medium">
                                Comm. {fmt(Math.round(comm))} FCFA
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-500">{o.updatedAt}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Prospects table ───────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: B }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: B }}>
              <div>
                <h2 className="font-bold" style={{ color:NAVY }}>Prospects suivis</h2>
                <p className="text-xs text-gray-400 mt-0.5">{filteredProspects.length} prospect{filteredProspects.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {filteredProspects.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Aucun prospect pour ces filtres.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs font-bold text-gray-400 uppercase tracking-wide" style={{ borderColor:B }}>
                      {["Prospect","Agent","Ville","Type","Transaction","Étape","Date"].map(h => (
                        <th key={h} className="px-5 py-3 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor:B }}>
                    {filteredProspects.map(p => {
                      const stageCfg: Record<string,{bg:string;text:string}> = {
                        nouveau:      { bg:"bg-gray-50",    text:"text-gray-500"   },
                        contacté:     { bg:"bg-blue-50",    text:"text-blue-600"   },
                        qualifié:     { bg:"bg-purple-50",  text:"text-purple-700" },
                        visite:       { bg:"bg-amber-50",   text:"text-amber-700"  },
                        offre:        { bg:"bg-orange-50",  text:"text-orange-700" },
                        négociation:  { bg:"bg-yellow-50",  text:"text-yellow-700" },
                        contrat:      { bg:"bg-indigo-50",  text:"text-indigo-700" },
                        gagné:        { bg:"bg-emerald-50", text:"text-emerald-700"},
                        annulé:       { bg:"bg-red-50",     text:"text-red-600"    },
                      };
                      const sc = stageCfg[p.stage] ?? { bg:"bg-gray-50", text:"text-gray-500" };
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                style={{ background: NAVY }}>
                                {p.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                              </div>
                              <span className="font-semibold text-[#0F1C2E] text-xs">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-600">{p.agent}</td>
                          <td className="px-5 py-3.5 text-xs text-gray-600">{p.ville}</td>
                          <td className="px-5 py-3.5 text-xs text-gray-600">{p.propType}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              p.propTransaction === "vente"    ? "bg-blue-50 text-blue-700" :
                              p.propTransaction === "location" ? "bg-amber-50 text-amber-700" :
                              "bg-emerald-50 text-emerald-700"
                            }`}>
                              {p.propTransaction.charAt(0).toUpperCase() + p.propTransaction.slice(1)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${sc.bg} ${sc.text}`}>
                              {p.stage}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-500">{p.date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
