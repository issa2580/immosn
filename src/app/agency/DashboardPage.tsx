import { useState, useMemo, useTransition, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  Home, TrendingUp, Eye, MessageSquare, Plus, ArrowRight, ArrowUpRight,
  Clock, MapPin, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle,
  AlertTriangle, Bell, RotateCcw, Users, Loader2, ExternalLink,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  ALL_PROPERTIES, AGENTS, NAVY, GOLD, B,
  STATUS_CFG, fmt, type Status, type Transaction,
} from "../data";

// ─── Types ────────────────────────────────────────────────────────────────────
type Period     = "semaine" | "mois" | "trimestre" | "annee";
type TypeFilter = "all" | Transaction;
type AgentFilter = "all" | string;

// ─── Config ───────────────────────────────────────────────────────────────────
const PERIOD_CFG: { key: Period; label: string; mult: number; rows: number }[] = [
  { key: "semaine",    label: "7 jours",     mult: 7/30,  rows: 7  },
  { key: "mois",       label: "Ce mois",     mult: 1,     rows: 30 },
  { key: "trimestre",  label: "Trimestre",   mult: 3,     rows: 90 },
  { key: "annee",      label: "Cette année", mult: 12,    rows: 365 },
];

const TYPE_CFG: { key: TypeFilter; label: string }[] = [
  { key: "all",      label: "Tous types" },
  { key: "vente",    label: "Vente"      },
  { key: "location", label: "Location"   },
  { key: "terrain",  label: "Terrain"    },
];

const AGENT_SHARE: Record<string, number> = {
  all: 1,
  [AGENTS[0].name]: 0.47,
  [AGENTS[1].name]: 0.30,
  [AGENTS[2].name]: 0.23,
};

// ─── Base monthly chart data ───────────────────────────────────────────────────
const BASE_MONTHLY = [
  { mois:"Jan", ventes:4, locations:7, terrains:1, vues:820,  contacts:18 },
  { mois:"Fév", ventes:3, locations:5, terrains:2, vues:940,  contacts:14 },
  { mois:"Mar", ventes:6, locations:8, terrains:1, vues:1120, contacts:22 },
  { mois:"Avr", ventes:5, locations:6, terrains:3, vues:1050, contacts:19 },
  { mois:"Mai", ventes:8, locations:10,terrains:2, vues:1380, contacts:31 },
  { mois:"Jun", ventes:7, locations:9, terrains:2, vues:1847, contacts:28 },
];

// ─── Alerts ───────────────────────────────────────────────────────────────────
type AlertType = "info" | "success" | "warning";
interface Alert { id: number; type: AlertType; msg: string; propRef?: string; propId?: number }

const INIT_ALERTS: Alert[] = [
  { id:1, type:"info",    propRef:"IS-2025-001", propId:1,  msg:"Nouveau contact — Moussa Diallo souhaite visiter la Villa Contemporaine des Almadies." },
  { id:2, type:"success", propRef:"IS-2025-007", propId:7,  msg:"Villa Balnéaire Saly : dossier de réservation reçu et validé par l'équipe juridique." },
  { id:3, type:"warning", propRef:"IS-2025-016", propId:16, msg:"Terrain IS-2025-016 : non mis à jour depuis 30 jours. Vérifiez les informations." },
];

// ─── Inquiries ────────────────────────────────────────────────────────────────
interface Inquiry {
  id: number; name: string; avatar: string; ref: string;
  propId: number; sujet: string; time: string; agent: string;
  detail: string;
}

const ALL_INQUIRIES: Inquiry[] = [
  { id:1, name:"Moussa Diallo",  avatar:"MD", ref:"IS-2025-001", propId:1,  sujet:"Demande de visite",  time:"Il y a 1h",  agent:AGENTS[0].name, detail:"Je souhaite visiter la villa ce samedi matin si possible. Mon budget est confirmé." },
  { id:2, name:"Aminata Sow",    avatar:"AS", ref:"IS-2025-003", propId:3,  sujet:"Info disponibilité", time:"Il y a 3h",  agent:AGENTS[0].name, detail:"Est-ce que l'appartement du Plateau est encore disponible ? Je suis disponible rapidement." },
  { id:3, name:"Ibrahima Fall",  avatar:"IF", ref:"IS-2025-016", propId:16, sujet:"Terrain Saly",        time:"Hier 14h",  agent:AGENTS[2].name, detail:"Intéressé pour investissement hôtelier. Pouvez-vous me transmettre le dossier complet ?" },
  { id:4, name:"Fatou Ndiaye",   avatar:"FN", ref:"IS-2025-010", propId:10, sujet:"Location villa",      time:"Hier 10h",  agent:AGENTS[1].name, detail:"Je cherche une location pour 1 an minimum. Bail diplomatique possible ?" },
  { id:5, name:"Cheikh Mbaye",   avatar:"CM", ref:"IS-2025-004", propId:4,  sujet:"Négociation prix",    time:"Lundi",     agent:AGENTS[1].name, detail:"Le bien m'intéresse, pouvez-vous faire un geste sur le prix ? Je suis cash." },
  { id:6, name:"Rokhaya Diop",   avatar:"RD", ref:"IS-2025-002", propId:2,  sujet:"Duplex Ngor",         time:"Lundi",     agent:AGENTS[0].name, detail:"Vue sur la mer confirmée ? Je suis disponible pour une visite en semaine." },
];

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonStat() {
  return (
    <div className="bg-white rounded-2xl border p-5 animate-pulse" style={{ borderColor: B }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
        <div className="w-20 h-5 rounded-full bg-gray-100" />
      </div>
      <div className="h-7 bg-gray-100 rounded w-1/2 mb-1" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
    </div>
  );
}

// ─── Alert icon ───────────────────────────────────────────────────────────────
function AlertIcon({ type }: { type: AlertType }) {
  if (type === "success") return <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />;
  if (type === "warning") return <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />;
  return <Bell size={16} style={{ color: GOLD }} className="shrink-0 mt-0.5" />;
}

const ALERT_STYLE: Record<AlertType, string> = {
  info:    "bg-[#FDF6E7] border-[#C9963A]/30",
  success: "bg-emerald-50 border-emerald-200",
  warning: "bg-amber-50 border-amber-200",
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  // ── Filter states ──────────────────────────────────────────────────────────
  const [period,      setPeriod]      = useState<Period>("mois");
  const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");
  const [typeFilter,  setTypeFilter]  = useState<TypeFilter>("all");

  // ── UI states ──────────────────────────────────────────────────────────────
  const [alerts,       setAlerts]       = useState<Alert[]>(INIT_ALERTS);
  const [readSet,      setReadSet]      = useState<Set<number>>(new Set([3, 4, 5]));
  const [expandedInq,  setExpandedInq]  = useState<number | null>(null);
  const [kpiModal,     setKpiModal]     = useState<string | null>(null);
  const [selectedBar,  setSelectedBar]  = useState<string | null>(null);
  const [alertExiting, setAlertExiting] = useState<Set<number>>(new Set());

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const applyFilter = (fn: () => void) => startTransition(fn);

  const periodConf  = PERIOD_CFG.find(p => p.key === period)!;
  const agentShare  = AGENT_SHARE[agentFilter] ?? 1;

  const typeRatio = useMemo(() => {
    if (typeFilter === "all") return 1;
    const counts = { vente: 8, location: 6, terrain: 4 }; // from dataset
    const total  = 18;
    return (counts[typeFilter] ?? 0) / total;
  }, [typeFilter]);

  const scaleFactor = agentShare * typeRatio;

  // ── Derived: filtered properties ──────────────────────────────────────────
  const filteredProps = useMemo(() => {
    let r = ALL_PROPERTIES;
    if (agentFilter !== "all") r = r.filter(p => p.agent?.name === agentFilter);
    if (typeFilter  !== "all") r = r.filter(p => p.transaction  === typeFilter);
    return r;
  }, [agentFilter, typeFilter]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const mult = periodConf.mult;
    const total    = filteredProps.length;
    const actifs   = filteredProps.filter(p => p.status === "disponible").length;
    const rawVues  = filteredProps.reduce((s, p) => s + (p.views ?? 0), 0);
    const vues     = Math.round(rawVues  * mult);
    const contacts = Math.round(total * 1.9 * mult);

    const prevMult = period === "annee" ? 0.88 : period === "trimestre" ? 0.85 : 0.78;
    return {
      total, actifs, vues, contacts,
      totalDelta:    total    > 0 ? "+2 ce mois"           : "0",
      actifsDelta:   `${Math.round(actifs / Math.max(total,1) * 100)}% actifs`,
      vuesDelta:     `+${Math.round((1 - prevMult) * 100)}% vs période préc.`,
      contactsDelta: `+${Math.round((1 - prevMult * 0.95) * 100)}% vs période préc.`,
    };
  }, [filteredProps, periodConf, period]);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const barData = useMemo(() => {
    const months = period === "semaine" ? BASE_MONTHLY.slice(-1) : period === "mois" ? BASE_MONTHLY.slice(-3) : BASE_MONTHLY;
    return months.map(m => ({
      mois:      m.mois,
      Ventes:    typeFilter === "location" || typeFilter === "terrain" ? 0 : Math.round(m.ventes    * agentShare),
      Locations: typeFilter === "vente"    || typeFilter === "terrain" ? 0 : Math.round(m.locations * agentShare),
      Terrains:  typeFilter === "vente"    || typeFilter === "location"? 0 : Math.round(m.terrains  * agentShare),
    }));
  }, [period, agentShare, typeFilter]);

  const lineData = useMemo(() => {
    const months = period === "semaine" ? BASE_MONTHLY.slice(-1) : period === "mois" ? BASE_MONTHLY.slice(-3) : BASE_MONTHLY;
    return months.map(m => ({
      mois: m.mois,
      Vues: Math.round(m.vues * agentShare * typeRatio),
    }));
  }, [period, agentShare, typeRatio]);

  const pieData = useMemo(() => {
    const vente    = filteredProps.filter(p => p.transaction === "vente").length;
    const location = filteredProps.filter(p => p.transaction === "location").length;
    const terrain  = filteredProps.filter(p => p.transaction === "terrain").length;
    return [
      { name: "Vente",    value: vente,    color: NAVY },
      { name: "Location", value: location, color: GOLD },
      { name: "Terrain",  value: terrain,  color: "#16A34A" },
    ].filter(d => d.value > 0);
  }, [filteredProps]);

  // ── Inquiries ──────────────────────────────────────────────────────────────
  const filteredInquiries = useMemo(() => {
    let r = ALL_INQUIRIES;
    if (agentFilter !== "all") r = r.filter(q => q.agent === agentFilter);
    return r;
  }, [agentFilter]);

  const unreadCount = filteredInquiries.filter(q => !readSet.has(q.id)).length;

  // ── Table rows (recent properties) ────────────────────────────────────────
  const tableRows = useMemo(() => {
    const rows = selectedBar
      ? filteredProps.filter(p =>
          selectedBar === "Ventes"    ? p.transaction === "vente"    :
          selectedBar === "Locations" ? p.transaction === "location" :
          p.transaction === "terrain"
        )
      : filteredProps;
    return rows.slice(0, 5);
  }, [filteredProps, selectedBar]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const dismissAlert = (id: number) => {
    setAlertExiting(s => new Set([...s, id]));
    setTimeout(() => {
      setAlerts(a => a.filter(x => x.id !== id));
      setAlertExiting(s => { const n = new Set(s); n.delete(id); return n; });
    }, 300);
  };

  const markRead = (id: number) => setReadSet(s => new Set([...s, id]));
  const markUnread = (id: number) => setReadSet(s => { const n = new Set(s); n.delete(id); return n; });

  const resetFilters = () => applyFilter(() => {
    setPeriod("mois");
    setAgentFilter("all");
    setTypeFilter("all");
    setSelectedBar(null);
  });

  const hasActiveFilters = agentFilter !== "all" || typeFilter !== "all" || period !== "mois";

  // ── KPI modal content ──────────────────────────────────────────────────────
  const viewsBreakdown = useMemo(() => filteredProps
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 5)
    .map(p => ({ ref: p.ref, title: p.title, id: p.id, views: Math.round((p.views ?? 0) * periodConf.mult) }))
  , [filteredProps, periodConf]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1C2E]" style={{ fontFamily: "'Playfair Display',serif" }}>
            Tableau de bord
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Activité de l'agence
            {agentFilter !== "all" && <> · <strong>{agentFilter.split(" ")[0]}</strong></>}
            {typeFilter  !== "all" && <> · <strong>{TYPE_CFG.find(t=>t.key===typeFilter)?.label}</strong></>}
          </p>
        </div>
        <Link to="/agence/biens/nouveau"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white"
          style={{ background: GOLD }}>
          <Plus size={16} />Nouveau bien
        </Link>
      </div>

      {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Period */}
        <div className="flex gap-0.5 p-1 rounded-xl border bg-white" style={{ borderColor: B }}>
          {PERIOD_CFG.map(p => (
            <button key={p.key}
              onClick={() => applyFilter(() => setPeriod(p.key))}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: period === p.key ? NAVY : "transparent",
                color:      period === p.key ? "#fff" : "#6B7280",
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Agent */}
        <select
          value={agentFilter}
          onChange={e => applyFilter(() => setAgentFilter(e.target.value))}
          className="px-3.5 py-2 rounded-xl border text-xs font-bold outline-none bg-white"
          style={{ borderColor: agentFilter !== "all" ? GOLD : B, color: NAVY }}>
          <option value="all">Tous les agents</option>
          {AGENTS.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
        </select>

        {/* Type */}
        <div className="flex gap-0.5 p-1 rounded-xl border bg-white" style={{ borderColor: B }}>
          {TYPE_CFG.map(t => (
            <button key={t.key}
              onClick={() => applyFilter(() => setTypeFilter(t.key))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: typeFilter === t.key ? GOLD : "transparent",
                color:      typeFilter === t.key ? "#fff" : "#6B7280",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <button onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-500"
            style={{ borderColor: B, color: "#6B7280" }}>
            <RotateCcw size={12} />Réinitialiser
          </button>
        )}

        {/* Pending indicator */}
        {isPending && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Loader2 size={13} className="animate-spin" style={{ color: GOLD }} />
            Mise à jour…
          </div>
        )}
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
      {isPending ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonStat key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total biens */}
          <button
            onClick={() => navigate("/agence/biens")}
            className="bg-white rounded-2xl border p-5 text-left hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
            style={{ borderColor: B }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `${GOLD}15`, color: GOLD }}>
                <Home size={20} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                {kpis.totalDelta}
              </span>
            </div>
            <div className="text-2xl font-bold text-[#0F1C2E]" style={{ fontFamily: "'DM Mono',monospace" }}>{kpis.total}</div>
            <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1 group-hover:text-[#C9963A] transition-colors">
              Total des biens <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Biens actifs */}
          <button
            onClick={() => navigate("/agence/biens")}
            className="bg-white rounded-2xl border p-5 text-left hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
            style={{ borderColor: B }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `${GOLD}15`, color: GOLD }}>
                <TrendingUp size={20} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                {kpis.actifsDelta}
              </span>
            </div>
            <div className="text-2xl font-bold text-[#0F1C2E]" style={{ fontFamily: "'DM Mono',monospace" }}>{kpis.actifs}</div>
            <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1 group-hover:text-[#C9963A] transition-colors">
              Disponibles <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Vues */}
          <button
            onClick={() => setKpiModal("vues")}
            className="bg-white rounded-2xl border p-5 text-left hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
            style={{ borderColor: B }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `${GOLD}15`, color: GOLD }}>
                <Eye size={20} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                {kpis.vuesDelta}
              </span>
            </div>
            <div className="text-2xl font-bold text-[#0F1C2E]" style={{ fontFamily: "'DM Mono',monospace" }}>
              {kpis.vues.toLocaleString("fr-SN")}
            </div>
            <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1 group-hover:text-[#C9963A] transition-colors">
              Vues — {periodConf.label} <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Contacts */}
          <button
            onClick={() => navigate("/agence/messages")}
            className="bg-white rounded-2xl border p-5 text-left hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
            style={{ borderColor: B }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `${GOLD}15`, color: GOLD }}>
                <MessageSquare size={20} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                {kpis.contactsDelta}
              </span>
            </div>
            <div className="text-2xl font-bold text-[#0F1C2E]" style={{ fontFamily: "'DM Mono',monospace" }}>
              {kpis.contacts}
            </div>
            <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1 group-hover:text-[#C9963A] transition-colors">
              Contacts — {periodConf.label} <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>
      )}

      {/* ── ALERTS ──────────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${ALERT_STYLE[alert.type]} ${alertExiting.has(alert.id) ? "opacity-0 -translate-y-1" : ""}`}>
              <AlertIcon type={alert.type} />
              <p className="flex-1 text-sm text-gray-700 leading-relaxed">{alert.msg}</p>
              {alert.propId && (
                <Link to={`/bien/${alert.propId}`}
                  className="shrink-0 text-xs font-bold flex items-center gap-1 transition-colors hover:underline"
                  style={{ color: GOLD }}>
                  Voir <ExternalLink size={11} />
                </Link>
              )}
              <button onClick={() => dismissAlert(alert.id)}
                className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── CHARTS ──────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        {/* Bar chart — transactions */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: B }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-[#0F1C2E]">Transactions</h2>
            {selectedBar && (
              <button onClick={() => setSelectedBar(null)}
                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border transition-colors"
                style={{ borderColor: GOLD, color: GOLD, background: `${GOLD}10` }}>
                <X size={10} />Filtre : {selectedBar}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-4">Cliquez sur un segment pour filtrer les biens</p>
          {barData.every(d => d.Ventes === 0 && d.Locations === 0 && d.Terrains === 0) ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <TrendingUp size={24} className="mb-2 opacity-30" />
              <p className="text-sm">Aucune donnée pour ce filtre</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={barData} barGap={3}
                onClick={e => {
                  if (e?.activePayload?.[0]) {
                    const name = e.activePayload[0].name as string;
                    setSelectedBar(prev => prev === name ? null : name);
                  }
                }}>
                <CartesianGrid strokeDasharray="3 3" stroke={B} />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: `1px solid ${B}`, fontSize: 12 }}
                  cursor={{ fill: `${GOLD}08` }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Ventes"    fill={NAVY} radius={[4,4,0,0]}
                  opacity={selectedBar && selectedBar !== "Ventes"    ? 0.25 : 1} />
                <Bar dataKey="Locations" fill={GOLD} radius={[4,4,0,0]}
                  opacity={selectedBar && selectedBar !== "Locations" ? 0.25 : 1} />
                <Bar dataKey="Terrains"  fill="#16A34A" radius={[4,4,0,0]}
                  opacity={selectedBar && selectedBar !== "Terrains"  ? 0.25 : 1} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie + Line stacked */}
        <div className="flex flex-col gap-4">
          {/* Pie */}
          <div className="bg-white rounded-2xl border p-5 flex-1" style={{ borderColor: B }}>
            <h2 className="font-bold text-[#0F1C2E] mb-4">Répartition</h2>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-gray-400 text-sm">Aucune donnée</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v} biens`]} contentStyle={{ borderRadius: 10, border: `1px solid ${B}`, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-1">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-gray-500">{d.name}</span>
                      </div>
                      <span className="font-bold text-[#0F1C2E]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mini line chart */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: B }}>
            <h2 className="font-bold text-[#0F1C2E] mb-3">Vues</h2>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={lineData}>
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${B}`, fontSize: 11 }} />
                <Line type="monotone" dataKey="Vues" stroke={GOLD} strokeWidth={2.5}
                  dot={{ fill: GOLD, r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── BOTTOM GRID ─────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">

        {/* Recent properties */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: B }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: B }}>
            <div>
              <h2 className="font-bold text-[#0F1C2E]">Biens récents</h2>
              {selectedBar && (
                <p className="text-xs text-gray-400 mt-0.5">Filtrés : {selectedBar}</p>
              )}
            </div>
            <Link to="/agence/biens" className="text-sm font-bold flex items-center gap-1" style={{ color: GOLD }}>
              Tout voir <ArrowRight size={14} />
            </Link>
          </div>

          {tableRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Home size={28} className="mb-2 opacity-20" />
              <p className="text-sm text-gray-400">Aucun bien pour ce filtre</p>
              {selectedBar && (
                <button onClick={() => setSelectedBar(null)} className="text-xs font-bold mt-2" style={{ color: GOLD }}>
                  Effacer le filtre graphique
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: B }}>
              {tableRows.map(p => {
                const st = STATUS_CFG[p.status as Status];
                return (
                  <div key={p.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8F6F2] transition-colors cursor-pointer group"
                    onClick={() => navigate(`/bien/${p.id}`)}>
                    <img src={p.img} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#0F1C2E] truncate group-hover:text-[#C9963A] transition-colors">
                        {p.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <MapPin size={10} />{p.location}
                      </div>
                    </div>
                    <div className="shrink-0 text-right hidden sm:block">
                      <div className="font-bold text-sm" style={{ fontFamily: "'DM Mono',monospace", color: GOLD }}>
                        {fmt(p.price)}
                      </div>
                      <div className="text-[10px] text-gray-400">FCFA</div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                    </span>
                    <ArrowUpRight size={14} style={{ color: GOLD }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent inquiries */}
        <div className="bg-white rounded-2xl border overflow-hidden flex flex-col" style={{ borderColor: B }}>
          <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: B }}>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[#0F1C2E]">Contacts récents</h2>
              {unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ background: GOLD }}>{unreadCount}</span>
              )}
            </div>
            <Link to="/agence/messages" className="text-sm font-bold flex items-center gap-1" style={{ color: GOLD }}>
              <MessageSquare size={13} />Tout voir
            </Link>
          </div>

          <div className="flex-1 divide-y overflow-y-auto" style={{ borderColor: B }}>
            {filteredInquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <MessageSquare size={24} className="mb-2 opacity-20" />
                <p className="text-sm text-gray-400">Aucun contact pour cet agent</p>
              </div>
            ) : filteredInquiries.map(inq => {
              const isRead = readSet.has(inq.id);
              const isExpanded = expandedInq === inq.id;

              return (
                <div key={inq.id}
                  className={`transition-colors ${isExpanded ? "bg-[#FDF6E7]" : "hover:bg-[#F8F6F2]"}`}>
                  {/* Row */}
                  <div className="flex items-start gap-3 px-4 py-3.5 cursor-pointer"
                    onClick={() => setExpandedInq(prev => prev === inq.id ? null : inq.id)}>
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: isRead ? "#9CA3AF" : NAVY }}>
                        {inq.avatar}
                      </div>
                      {!isRead && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                          style={{ background: GOLD }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${isRead ? "font-medium text-gray-600" : "font-bold text-[#0F1C2E]"}`}>
                        {inq.name}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{inq.sujet}</div>
                      <div className="text-[10px] font-mono text-gray-300">{inq.ref}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock size={9} />{inq.time}
                      </span>
                      {isExpanded
                        ? <ChevronUp size={13} style={{ color: GOLD }} />
                        : <ChevronDown size={13} className="text-gray-300" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <p className="text-xs text-gray-600 leading-relaxed mb-3 bg-white rounded-xl p-3 border"
                        style={{ borderColor: B }}>
                        "{inq.detail}"
                      </p>
                      <div className="flex gap-2">
                        <Link to={`/bien/${inq.propId}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-colors hover:bg-white"
                          style={{ borderColor: B, color: NAVY }}>
                          <Home size={12} />Voir le bien
                        </Link>
                        <Link to="/agence/messages"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-colors"
                          style={{ background: GOLD }}>
                          <MessageSquare size={12} />Répondre
                        </Link>
                        <button
                          onClick={e => { e.stopPropagation(); isRead ? markUnread(inq.id) : markRead(inq.id); }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center border transition-colors hover:bg-white"
                          style={{ borderColor: B, color: isRead ? "#9CA3AF" : GOLD }}
                          title={isRead ? "Marquer non lu" : "Marquer comme lu"}>
                          {isRead ? <Bell size={13} /> : <CheckCircle size={13} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t shrink-0" style={{ borderColor: B }}>
            <Link to="/agence/messages" className="text-sm font-semibold text-center block w-full transition-colors hover:opacity-70"
              style={{ color: GOLD }}>
              Ouvrir la messagerie
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI MODAL: Vues ─────────────────────────────────────────────── */}
      {kpiModal === "vues" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setKpiModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: B }}>
              <div>
                <h3 className="font-bold text-[#0F1C2E]" style={{ fontFamily: "'Playfair Display',serif" }}>
                  Détail des vues
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{periodConf.label} — {kpis.vues.toLocaleString("fr-SN")} vues totales</p>
              </div>
              <button onClick={() => setKpiModal(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Top biens les plus vus</p>
              {viewsBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucune donnée disponible</p>
              ) : viewsBreakdown.map((item, i) => (
                <div key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl border hover:border-[#C9963A]/40 transition-colors cursor-pointer"
                  style={{ borderColor: B }}
                  onClick={() => { setKpiModal(null); navigate(`/bien/${item.id}`); }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: i === 0 ? GOLD : i === 1 ? NAVY : "#9CA3AF" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#0F1C2E] truncate">{item.title}</div>
                    <div className="text-[10px] font-mono text-gray-400">{item.ref}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm" style={{ fontFamily: "'DM Mono',monospace", color: GOLD }}>
                      {item.views.toLocaleString("fr-SN")}
                    </div>
                    <div className="text-[10px] text-gray-400">vues</div>
                  </div>
                  <ArrowUpRight size={13} style={{ color: GOLD }} className="shrink-0" />
                </div>
              ))}

              {/* Bar chart preview in modal */}
              <div className="pt-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Évolution des vues</p>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={lineData}>
                    <XAxis dataKey="mois" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${B}`, fontSize: 11 }} />
                    <Line type="monotone" dataKey="Vues" stroke={GOLD} strokeWidth={2}
                      dot={{ fill: GOLD, r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
