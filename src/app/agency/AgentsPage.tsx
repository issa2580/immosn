import { useState, useMemo, useCallback } from "react";
import {
  Plus, Search, X, MoreHorizontal, Pencil, Trash2, Eye,
  Phone, Mail, MapPin, Star, CheckCircle, XCircle, Loader2,
  Users, Home, Calendar, TrendingUp, ArrowRight, LayoutGrid,
  List, ChevronRight, UserCheck, UserX, RotateCcw, BadgeCheck,
  AlertTriangle, Building2,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tabs from "@radix-ui/react-tabs";
import { toast } from "sonner";
import { NAVY, GOLD, B, fmt } from "../data";
import { useProperties, updateProperty } from "./store";
import type { StoreProp } from "./store";
import {
  useAgents, addAgent, updateAgent, deleteAgent, toggleAgent,
  assignProspect, removeProspect, assignVisit, removeVisit,
  MOCK_PROSPECTS, MOCK_VISITS,
  type AgentFull, type Specialite,
} from "./agentsStore";

// ─── Constants ────────────────────────────────────────────────────────────────
const SPECIALITES: Specialite[] = ["Vente", "Location", "Terrain & Foncier", "Luxe & Prestige", "Commerce & Bureaux"];
const ZONES = ["Dakar — Almadies, Ngor, Les Mamelles", "Dakar — Plateau, Mermoz, Point E, Yoff", "Mbour, Thiès, Rufisque", "Dakar — Toutes zones", "National"];

const AVATAR_COLORS = [
  "#1E3A5F", "#2D6A4F", "#7B4F2E", "#5A2D82", "#1A5276",
  "#7D6608", "#922B21", "#1B6F2A", "#145A7C", "#6C3483",
];
function avatarColor(avatar: string) {
  let h = 0;
  for (let i = 0; i < avatar.length; i++) h = avatar.charCodeAt(i) + (h << 5) - h;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const VISIT_STATUS_COLOR: Record<string, string> = {
  planifiée: "#3B82F6", confirmée: "#16A34A", effectuée: GOLD, annulée: "#EF4444", reportée: "#F97316",
};

// ─── Stats helper ─────────────────────────────────────────────────────────────
interface AgentStats { annonces: number; transactions: number; commissionPeriode: number; }
function computeStats(agent: AgentFull, properties: StoreProp[]): AgentStats {
  const mine = properties.filter(p => p.agent?.name === agent.name);
  let transactions = 0; let commissionPeriode = 0;
  for (const p of mine) {
    if (p.status === "vendu" || p.status === "loué") {
      transactions++;
      const base = p.transaction === "location" ? p.price * 12 : p.price;
      commissionPeriode += base * agent.tauxCommission / 100;
    }
  }
  return { annonces: mine.length, transactions, commissionPeriode };
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11}
          fill={i <= Math.round(rating) ? GOLD : "none"}
          stroke={i <= Math.round(rating) ? GOLD : "#D1D5DB"} />
      ))}
      <span className="ml-1 text-[11px] font-bold" style={{ color: GOLD }}>{rating.toFixed(1)}</span>
    </span>
  );
}

// ─── AgentForm ────────────────────────────────────────────────────────────────
type FormState = {
  name: string; title: string; specialite: Specialite; zone: string;
  phone: string; email: string; tauxCommission: string; bio: string; actif: boolean;
};
const BLANK_FORM: FormState = {
  name:"", title:"", specialite:"Vente", zone:"", phone:"", email:"",
  tauxCommission:"3.0", bio:"", actif:true,
};
function agentToForm(a: AgentFull): FormState {
  return {
    name: a.name, title: a.title, specialite: a.specialite, zone: a.zone,
    phone: a.phone, email: a.email, tauxCommission: String(a.tauxCommission),
    bio: a.bio, actif: a.actif,
  };
}

function AgentForm({ title, initial, onSave, onClose }: {
  title: string; initial: FormState; onSave: (f: FormState) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const upd = (p: Partial<FormState>) => setForm(f => ({ ...f, ...p }));
  const clr = (k: keyof FormState) => setErrors(e => ({ ...e, [k]: "" }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim())  e.name  = "Le nom est requis";
    if (!form.title.trim()) e.title = "Le titre est requis";
    if (!form.phone.trim()) e.phone = "Le téléphone est requis";
    if (!form.email.trim()) e.email = "L'email est requis";
    const tx = parseFloat(form.tauxCommission);
    if (isNaN(tx) || tx < 0 || tx > 20) e.tauxCommission = "Taux invalide (0–20 %)";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => { setSuccess(true); setTimeout(() => onSave(form), 600); }, 500);
  };

  const ic = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#C9963A]/30 transition-all bg-white";
  const sty = (k: keyof FormState) => errors[k]
    ? { borderColor: "#F87171", boxShadow: "0 0 0 3px rgba(248,113,113,0.18)", color: NAVY }
    : { borderColor: B, color: NAVY };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">

        {success && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <p className="font-bold text-[#0F1C2E] text-lg" style={{ fontFamily: "'Playfair Display',serif" }}>
              {title.includes("Modifier") ? "Agent mis à jour" : "Agent créé !"}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor: B }}>
          <h3 className="font-bold text-[#0F1C2E] text-lg" style={{ fontFamily: "'Playfair Display',serif" }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"><X size={16}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Avatar preview */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0"
              style={{ background: form.name ? avatarColor(form.name.slice(0,2).toUpperCase()) : NAVY }}>
              {form.name ? form.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() : "??"}
            </div>
            <div>
              <p className="font-bold text-sm text-[#0F1C2E]">{form.name || "Nom de l'agent"}</p>
              <p className="text-xs text-gray-400">{form.title || "Titre / poste"}</p>
            </div>
          </div>

          {/* Name + Title */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nom complet *</label>
              <input className={ic} style={sty("name")} value={form.name} placeholder="Prénom Nom"
                onChange={e => { upd({ name: e.target.value }); clr("name"); }} />
              {errors.name && <p className="text-xs text-red-500 mt-1">⚠ {errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Titre *</label>
              <input className={ic} style={sty("title")} value={form.title} placeholder="Ex: Conseiller immobilier"
                onChange={e => { upd({ title: e.target.value }); clr("title"); }} />
              {errors.title && <p className="text-xs text-red-500 mt-1">⚠ {errors.title}</p>}
            </div>
          </div>

          {/* Specialite + Zone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Spécialité</label>
              <select className={ic} style={{ borderColor: B, color: NAVY }}
                value={form.specialite} onChange={e => upd({ specialite: e.target.value as Specialite })}>
                {SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Zone couverte</label>
              <select className={ic} style={{ borderColor: B, color: NAVY }}
                value={form.zone} onChange={e => upd({ zone: e.target.value })}>
                <option value="">— Choisir —</option>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone *</label>
              <input className={ic} style={sty("phone")} value={form.phone} placeholder="+221 77 000 00 00"
                onChange={e => { upd({ phone: e.target.value }); clr("phone"); }} />
              {errors.phone && <p className="text-xs text-red-500 mt-1">⚠ {errors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email *</label>
              <input type="email" className={ic} style={sty("email")} value={form.email} placeholder="agent@immosenegal.sn"
                onChange={e => { upd({ email: e.target.value }); clr("email"); }} />
              {errors.email && <p className="text-xs text-red-500 mt-1">⚠ {errors.email}</p>}
            </div>
          </div>

          {/* Commission + Actif */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Taux de commission (%)</label>
              <input type="number" step="0.5" min="0" max="20" className={ic} style={sty("tauxCommission")}
                value={form.tauxCommission}
                onChange={e => { upd({ tauxCommission: e.target.value }); clr("tauxCommission"); }} />
              {errors.tauxCommission && <p className="text-xs text-red-500 mt-1">⚠ {errors.tauxCommission}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Statut</label>
              <button type="button"
                onClick={() => upd({ actif: !form.actif })}
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all"
                style={{
                  borderColor: form.actif ? "#16A34A" : "#F87171",
                  background: form.actif ? "#F0FDF4" : "#FEF2F2",
                  color: form.actif ? "#16A34A" : "#EF4444",
                }}>
                {form.actif ? <><CheckCircle size={14}/>Actif</> : <><XCircle size={14}/>Inactif</>}
              </button>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Biographie (optionnel)</label>
            <textarea rows={3} className={`${ic} resize-none`} style={{ borderColor: B, color: NAVY }}
              value={form.bio} placeholder="Présentation, expertise, expérience…"
              onChange={e => upd({ bio: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: B }}>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-gray-50"
            style={{ borderColor: B, color: NAVY }}>Annuler</button>
          <button onClick={handleSave} disabled={submitting || success}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: GOLD }}>
            {submitting ? <><Loader2 size={14} className="animate-spin"/>Enregistrement…</> : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Attribution modal ────────────────────────────────────────────────────────
type AttributionType = "annonce" | "prospect" | "visite";

function AttributionModal({ agent, type, properties, onConfirm, onClose }: {
  agent: AgentFull; type: AttributionType;
  properties: StoreProp[];
  onConfirm: (id: number | string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const title = type === "annonce" ? "Attribuer une annonce" : type === "prospect" ? "Attribuer un prospect" : "Attribuer une visite";

  const items = useMemo(() => {
    const s = search.toLowerCase();
    if (type === "annonce") {
      // Show properties NOT already assigned to this agent
      return properties
        .filter(p => p.agent?.name !== agent.name && (p.title.toLowerCase().includes(s) || p.ref.toLowerCase().includes(s)));
    }
    if (type === "prospect") {
      return MOCK_PROSPECTS
        .filter(p => !agent.prospectIds.includes(p.id) && (p.name.toLowerCase().includes(s) || p.type.toLowerCase().includes(s)));
    }
    return MOCK_VISITS
      .filter(v => !agent.visitIds.includes(v.id) && (v.propTitle.toLowerCase().includes(s) || v.prospectName.toLowerCase().includes(s)));
  }, [search, type, properties, agent]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b shrink-0" style={{ borderColor: B }}>
          <h3 className="font-bold text-[#0F1C2E]" style={{ fontFamily: "'Playfair Display',serif" }}>{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">→ {agent.name}</p>
        </div>

        <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: B }}>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-8 pr-4 py-2 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: B, color: NAVY }}/>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              {search ? "Aucun résultat" : "Aucun élément disponible à attribuer"}
            </div>
          ) : items.map(item => {
            const isAnno = type === "annonce";
            const isPros = type === "prospect";
            const p = isAnno ? item as StoreProp : null;
            const pr = isPros ? item as typeof MOCK_PROSPECTS[0] : null;
            const v  = !isAnno && !isPros ? item as typeof MOCK_VISITS[0] : null;
            const id  = item.id as number;
            const sel = selected === id;

            return (
              <button key={id} onClick={() => setSelected(sel ? null : id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b transition-colors hover:bg-[#F8F6F2]"
                style={{ borderColor: B, background: sel ? `${GOLD}10` : undefined }}>

                {isAnno && p && (
                  <>
                    <img src={p.img} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 bg-gray-100"/>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#0F1C2E] truncate">{p.title}</p>
                      <p className="text-[11px] font-mono text-gray-400">{p.ref} · {fmt(p.price)} FCFA</p>
                    </div>
                  </>
                )}
                {isPros && pr && (
                  <>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: NAVY }}>
                      {pr.name.split(" ").map((w:string)=>w[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#0F1C2E]">{pr.name}</p>
                      <p className="text-[11px] text-gray-400">{pr.type} · Budget: {fmt(pr.budget)} FCFA</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{pr.stage}</span>
                  </>
                )}
                {v && (
                  <>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${VISIT_STATUS_COLOR[v.statut] ?? "#6B7280"}15`, color: VISIT_STATUS_COLOR[v.statut] ?? "#6B7280" }}>
                      <Calendar size={14}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#0F1C2E] truncate">{v.propTitle}</p>
                      <p className="text-[11px] text-gray-400">{v.prospectName} · {v.date} {v.heure}</p>
                    </div>
                    <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{v.statut}</span>
                  </>
                )}

                {sel && (
                  <CheckCircle size={16} style={{ color: GOLD }} className="shrink-0"/>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 p-4 border-t shrink-0" style={{ borderColor: B }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm border"
            style={{ borderColor: B, color: NAVY }}>Annuler</button>
          <button onClick={() => { if (selected !== null) { onConfirm(selected); onClose(); } }}
            disabled={selected === null}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-40"
            style={{ background: GOLD }}>Attribuer</button>
        </div>
      </div>
    </div>
  );
}

// ─── AgentDetail slide-in ─────────────────────────────────────────────────────
function AgentDetail({ agent, properties, onClose, onEdit, onToggle, onDelete }: {
  agent: AgentFull; properties: StoreProp[];
  onClose: () => void; onEdit: () => void;
  onToggle: () => void; onDelete: () => void;
}) {
  const [attribution, setAttribution] = useState<AttributionType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const stats = computeStats(agent, properties);
  const myProps = properties.filter(p => p.agent?.name === agent.name);
  const myProspects = MOCK_PROSPECTS.filter(p => agent.prospectIds.includes(p.id));
  const myVisits = MOCK_VISITS.filter(v => agent.visitIds.includes(v.id));

  const totalCommission = agent.commissionHistorique + stats.commissionPeriode;

  const handleAssign = useCallback((id: number, type: AttributionType) => {
    if (type === "annonce") {
      const prop = properties.find(p => p.id === id);
      if (!prop) return;
      const agInfo = {
        name: agent.name, title: agent.title, phone: agent.phone,
        whatsapp: agent.whatsapp, email: agent.email, avatar: agent.avatar,
        listings: myProps.length + 1, rating: agent.rating,
      };
      updateProperty(id, { agent: agInfo });
      toast.success(`"${prop.title}" attribué à ${agent.name}`);
    } else if (type === "prospect") {
      assignProspect(agent.id, id);
      const pr = MOCK_PROSPECTS.find(p => p.id === id);
      toast.success(`Prospect "${pr?.name}" attribué à ${agent.name}`);
    } else {
      assignVisit(agent.id, id);
      const v = MOCK_VISITS.find(v => v.id === id);
      toast.success(`Visite "${v?.propTitle}" attribuée à ${agent.name}`);
    }
  }, [agent, properties, myProps.length]);

  const handleRemoveProp = (propId: number) => {
    const prop = properties.find(p => p.id === propId);
    if (!prop) return;
    updateProperty(propId, { agent: undefined });
    toast.info(`"${prop.title}" retiré du portefeuille`);
  };

  const color = avatarColor(agent.avatar);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white w-full sm:w-[440px] h-[92vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-5 py-5 border-b shrink-0" style={{ borderColor: B }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
                  style={{ background: color }}>
                  {agent.avatar}
                </div>
                <div>
                  <p className="font-bold text-lg text-[#0F1C2E] leading-tight" style={{ fontFamily: "'Playfair Display',serif" }}>
                    {agent.name}
                  </p>
                  <p className="text-xs text-gray-500">{agent.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Stars rating={agent.rating}/>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${agent.actif ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-500"}`}>
                      {agent.actif ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!deleteConfirm && (
                  <>
                    <button onClick={onEdit}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#C9963A] hover:bg-[#FDF6E7] transition-colors">
                      <Pencil size={14}/>
                    </button>
                    <button onClick={() => setDeleteConfirm(true)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </>
                )}
                {deleteConfirm && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-red-500 font-semibold">Supprimer ?</span>
                    <button onClick={onDelete} className="px-2 py-1 rounded-lg text-xs font-bold text-white bg-red-500">Oui</button>
                    <button onClick={() => setDeleteConfirm(false)} className="px-2 py-1 rounded-lg text-xs font-bold border" style={{ borderColor: B, color: NAVY }}>Non</button>
                  </div>
                )}
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors ml-1">
                  <X size={16}/>
                </button>
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Annonces",   value: stats.annonces,      color: NAVY  },
                { label: "Prospects",  value: myProspects.length,  color: "#3B82F6" },
                { label: "Visites",    value: myVisits.length,     color: GOLD  },
                { label: "Transactions", value: stats.transactions, color: "#16A34A" },
              ].map(({ label, value, color: c }) => (
                <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: `${c}10` }}>
                  <div className="text-lg font-bold" style={{ fontFamily: "'DM Mono',monospace", color: c }}>{value}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wide text-gray-400">{label}</div>
                </div>
              ))}
            </div>

            {/* Commission */}
            <div className="mt-3 flex items-center justify-between p-3 rounded-xl" style={{ background: `${GOLD}10` }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Commission totale</p>
                <p className="font-bold text-base" style={{ fontFamily: "'DM Mono',monospace", color: GOLD }}>
                  {fmt(Math.round(totalCommission))} FCFA
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Taux</p>
                <p className="font-bold text-sm" style={{ color: GOLD }}>{agent.tauxCommission}%</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs.Root defaultValue="profil" className="flex-1 flex flex-col overflow-hidden">
            <Tabs.List className="flex border-b shrink-0 px-2" style={{ borderColor: B }}>
              <style>{`
              [data-radix-tabs-trigger][data-state="active"] { border-color: ${GOLD}; color: ${NAVY}; }
              [data-radix-tabs-trigger][data-state="inactive"] { border-color: transparent; color: #9CA3AF; }
              [data-radix-tabs-trigger][data-state="inactive"]:hover { color: ${NAVY}; }
            `}</style>
            {[
                { val: "profil",    label: "Profil"    },
                { val: "annonces",  label: `Annonces (${stats.annonces})`  },
                { val: "prospects", label: `Prospects (${myProspects.length})` },
                { val: "visites",   label: `Visites (${myVisits.length})`   },
              ].map(({ val, label }) => (
                <Tabs.Trigger key={val} value={val}
                  className="px-3.5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap outline-none">
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* Profil */}
            <Tabs.Content value="profil" className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow icon={<BadgeCheck size={13}/>} label="Spécialité" value={agent.specialite}/>
                <InfoRow icon={<MapPin size={13}/>} label="Zone" value={agent.zone || "—"}/>
                <InfoRow icon={<Phone size={13}/>} label="Téléphone" value={agent.phone}/>
                <InfoRow icon={<Mail size={13}/>} label="Email" value={agent.email} small/>
                <InfoRow icon={<Calendar size={13}/>} label="Date d'entrée" value={new Date(agent.dateEntree).toLocaleDateString("fr-SN", { year:"numeric", month:"long" })}/>
                <InfoRow icon={<TrendingUp size={13}/>} label="Commission" value={`${agent.tauxCommission}%`}/>
              </div>
              {agent.bio && (
                <div className="p-4 rounded-xl border" style={{ borderColor: B, background: "#FAFAF9" }}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Biographie</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{agent.bio}</p>
                </div>
              )}
              {/* Toggle actif */}
              <button onClick={onToggle}
                className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all"
                style={{
                  borderColor: agent.actif ? "#EF4444" : "#16A34A",
                  background: agent.actif ? "#FEF2F2" : "#F0FDF4",
                  color: agent.actif ? "#EF4444" : "#16A34A",
                }}>
                {agent.actif ? <><UserX size={15}/>Désactiver l'agent</> : <><UserCheck size={15}/>Activer l'agent</>}
              </button>
            </Tabs.Content>

            {/* Annonces */}
            <Tabs.Content value="annonces" className="flex-1 overflow-y-auto">
              <div className="p-4">
                <button onClick={() => setAttribution("annonce")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border border-dashed transition-colors mb-4"
                  style={{ borderColor: `${GOLD}50`, color: GOLD }}>
                  <Plus size={14}/>Attribuer une annonce
                </button>
              </div>
              {myProps.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400"><Home size={24} className="mx-auto mb-2 opacity-20"/>Aucune annonce attribuée</div>
              ) : myProps.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: B }}>
                  <img src={p.img} alt="" className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-[#0F1C2E] truncate">{p.title}</p>
                    <p className="text-[10px] font-mono text-gray-400">{p.ref} · {fmt(p.price)} FCFA</p>
                  </div>
                  <button onClick={() => handleRemoveProp(p.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0">
                    <X size={12}/>
                  </button>
                </div>
              ))}
            </Tabs.Content>

            {/* Prospects */}
            <Tabs.Content value="prospects" className="flex-1 overflow-y-auto">
              <div className="p-4">
                <button onClick={() => setAttribution("prospect")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border border-dashed transition-colors mb-4"
                  style={{ borderColor: `${GOLD}50`, color: GOLD }}>
                  <Plus size={14}/>Attribuer un prospect
                </button>
              </div>
              {myProspects.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400"><Users size={24} className="mx-auto mb-2 opacity-20"/>Aucun prospect attribué</div>
              ) : myProspects.map(pr => (
                <div key={pr.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: B }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: NAVY }}>
                    {pr.name.split(" ").map((w:string)=>w[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-[#0F1C2E]">{pr.name}</p>
                    <p className="text-[10px] text-gray-400">{pr.type} · {fmt(pr.budget)} FCFA · {pr.stage}</p>
                  </div>
                  <button onClick={() => { removeProspect(agent.id, pr.id); toast.info(`"${pr.name}" retiré`); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0">
                    <X size={12}/>
                  </button>
                </div>
              ))}
            </Tabs.Content>

            {/* Visites */}
            <Tabs.Content value="visites" className="flex-1 overflow-y-auto">
              <div className="p-4">
                <button onClick={() => setAttribution("visite")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border border-dashed transition-colors mb-4"
                  style={{ borderColor: `${GOLD}50`, color: GOLD }}>
                  <Plus size={14}/>Attribuer une visite
                </button>
              </div>
              {myVisits.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400"><Calendar size={24} className="mx-auto mb-2 opacity-20"/>Aucune visite attribuée</div>
              ) : myVisits.map(v => {
                const vc = VISIT_STATUS_COLOR[v.statut] ?? "#6B7280";
                return (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: B }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${vc}15`, color: vc }}>
                      <Calendar size={14}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-[#0F1C2E] truncate">{v.propTitle}</p>
                      <p className="text-[10px] text-gray-400">{v.prospectName} · {v.date} {v.heure}</p>
                    </div>
                    <span className="text-[9px] font-bold capitalize px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: `${vc}15`, color: vc }}>{v.statut}</span>
                    <button onClick={() => { removeVisit(agent.id, v.id); toast.info(`Visite "${v.propTitle}" retirée`); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0">
                      <X size={12}/>
                    </button>
                  </div>
                );
              })}
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>

      {attribution && (
        <AttributionModal
          agent={agent}
          type={attribution}
          properties={properties}
          onConfirm={id => handleAssign(id as number, attribution)}
          onClose={() => setAttribution(null)}
        />
      )}
    </>
  );
}

function InfoRow({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="p-3 rounded-xl border" style={{ borderColor: B, background: "#FAFAF9" }}>
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">{icon}<span className="text-[9px] font-bold uppercase tracking-wide">{label}</span></div>
      <p className={`font-semibold text-[#0F1C2E] ${small ? "text-[11px]" : "text-xs"} truncate`}>{value}</p>
    </div>
  );
}

// ─── AgentCard (grid) ─────────────────────────────────────────────────────────
function AgentCard({ agent, stats, myProspects, myVisits, onSelect, onEdit, onToggle, onDelete }: {
  agent: AgentFull; stats: AgentStats; myProspects: number; myVisits: number;
  onSelect: () => void; onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const color = avatarColor(agent.avatar);
  const commission = fmt(Math.round(agent.commissionHistorique + stats.commissionPeriode));

  return (
    <div className="bg-white rounded-2xl border overflow-hidden group hover:shadow-md transition-all" style={{ borderColor: B }}>
      {/* Top strip */}
      <div className="h-1.5" style={{ background: agent.actif ? `linear-gradient(90deg,${color},${GOLD})` : "#E5E7EB" }} />

      <div className="p-5">
        {/* Avatar + name */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shrink-0"
              style={{ background: color }}>
              {agent.avatar}
            </div>
            <div>
              <p className="font-bold text-sm text-[#0F1C2E] leading-tight">{agent.name}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{agent.title}</p>
              <div className="mt-1"><Stars rating={agent.rating}/></div>
            </div>
          </div>

          {/* Actions dropdown */}
          <div onClick={e => e.stopPropagation()}>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <MoreHorizontal size={16}/>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={4}
                  className="bg-white rounded-2xl border shadow-xl z-50 min-w-[170px] py-1.5 overflow-hidden"
                  style={{ borderColor: B }}>
                  <DropdownMenu.Item onSelect={onSelect}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                    <Eye size={13} style={{ color: GOLD }}/>Voir le profil
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={onEdit}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                    <Pencil size={13}/>Modifier
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={onToggle}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] outline-none"
                    style={{ color: agent.actif ? "#F97316" : "#16A34A" }}>
                    {agent.actif ? <><UserX size={13}/>Désactiver</> : <><UserCheck size={13}/>Activer</>}
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-gray-100"/>
                  <DropdownMenu.Item onSelect={onDelete}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-red-50 text-red-500 outline-none">
                    <Trash2 size={13}/>Supprimer
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        {/* Specialite + actif */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}15`, color }}>
            {agent.specialite}
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ml-auto ${agent.actif ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-500"}`}>
            {agent.actif ? "● Actif" : "○ Inactif"}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {[
            { label: "Annonces",    value: stats.annonces,   c: NAVY      },
            { label: "Prospects",   value: myProspects,      c: "#3B82F6" },
            { label: "Visites",     value: myVisits,         c: GOLD      },
            { label: "Transact.",   value: stats.transactions, c: "#16A34A" },
          ].map(({ label, value, c }) => (
            <div key={label} className="rounded-xl p-2 text-center" style={{ background: `${c}08` }}>
              <div className="text-sm font-bold" style={{ fontFamily: "'DM Mono',monospace", color: c }}>{value}</div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-none mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Commission */}
        <div className="flex items-center justify-between p-3 rounded-xl mb-4" style={{ background: `${GOLD}08` }}>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Commission</span>
          <span className="font-bold text-sm" style={{ fontFamily: "'DM Mono',monospace", color: GOLD }}>
            {commission} FCFA
          </span>
        </div>

        {/* View profile button */}
        <button onClick={onSelect}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:bg-[#F8F6F2]"
          style={{ borderColor: B, color: NAVY }}>
          Voir le profil<ArrowRight size={13}/>
        </button>
      </div>
    </div>
  );
}

// ─── AgentRow (list view) ─────────────────────────────────────────────────────
function AgentRow({ agent, stats, myProspects, myVisits, onSelect, onEdit, onToggle, onDelete }: {
  agent: AgentFull; stats: AgentStats; myProspects: number; myVisits: number;
  onSelect: () => void; onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const color = avatarColor(agent.avatar);
  return (
    <tr className="hover:bg-[#F8F6F2] transition-colors cursor-pointer border-b" style={{ borderColor: B }} onClick={onSelect}>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: color }}>{agent.avatar}</div>
          <div>
            <p className="font-bold text-sm text-[#0F1C2E]">{agent.name}</p>
            <p className="text-[11px] text-gray-400">{agent.title}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 hidden md:table-cell">
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}12`, color }}>{agent.specialite}</span>
      </td>
      <td className="px-4 py-4 hidden lg:table-cell">
        <div className="flex items-center gap-1"><Stars rating={agent.rating}/></div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-bold" style={{ color: NAVY }}>{stats.annonces}</span>
          <span className="text-gray-300">·</span>
          <span className="font-bold" style={{ color: "#3B82F6" }}>{myProspects}</span>
          <span className="text-gray-300">·</span>
          <span className="font-bold" style={{ color: GOLD }}>{myVisits}</span>
        </div>
        <div className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Ann. · Pros. · Vis.</div>
      </td>
      <td className="px-4 py-4 hidden xl:table-cell">
        <span className="font-bold text-xs" style={{ fontFamily: "'DM Mono',monospace", color: GOLD }}>
          {fmt(Math.round(agent.commissionHistorique + stats.commissionPeriode))} F
        </span>
      </td>
      <td className="px-4 py-4">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${agent.actif ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-500"}`}>
          {agent.actif ? "Actif" : "Inactif"}
        </span>
      </td>
      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <button onClick={onSelect} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0F1C2E] hover:bg-gray-100 transition-colors">
            <Eye size={14}/>
          </button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <MoreHorizontal size={14}/>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={4}
                className="bg-white rounded-2xl border shadow-xl z-50 min-w-[170px] py-1.5 overflow-hidden" style={{ borderColor: B }}>
                <DropdownMenu.Item onSelect={onEdit}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                  <Pencil size={13}/>Modifier
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={onToggle}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] outline-none"
                  style={{ color: agent.actif ? "#F97316" : "#16A34A" }}>
                  {agent.actif ? <><UserX size={13}/>Désactiver</> : <><UserCheck size={13}/>Activer</>}
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-gray-100"/>
                <DropdownMenu.Item onSelect={onDelete}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-red-50 text-red-500 outline-none">
                  <Trash2 size={13}/>Supprimer
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </td>
    </tr>
  );
}

// ─── DeleteConfirmModal ────────────────────────────────────────────────────────
function DeleteConfirmModal({ agent, onConfirm, onClose }: {
  agent: AgentFull; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-500"/>
          </div>
          <h3 className="font-bold text-[#0F1C2E] text-lg mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>Supprimer l'agent</h3>
          <p className="text-sm text-gray-500">Êtes-vous sûr de vouloir supprimer <strong>{agent.name}</strong> ? Cette action est irréversible.</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm border"
            style={{ borderColor: B, color: NAVY }}>Annuler</button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition-colors">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const agents     = useAgents();
  const properties = useProperties();

  const [view,     setView]     = useState<"grille" | "liste">("grille");
  const [search,   setSearch]   = useState("");
  const [statusFlt, setStatusFlt] = useState<"all" | "actif" | "inactif">("all");
  const [specFlt,  setSpecFlt]  = useState("");

  const [selected,    setSelected]    = useState<AgentFull | null>(null);
  const [formOpen,    setFormOpen]    = useState(false);
  const [editAgent,   setEditAgent]   = useState<AgentFull | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentFull | null>(null);

  // ── Per-agent stats ────────────────────────────────────────────────────────
  const statsMap = useMemo(() => {
    const m: Record<number, AgentStats> = {};
    for (const a of agents) m[a.id] = computeStats(a, properties);
    return m;
  }, [agents, properties]);

  // ── Totals for header KPIs ─────────────────────────────────────────────────
  const totals = useMemo(() => ({
    total:      agents.length,
    actifs:     agents.filter(a => a.actif).length,
    annonces:   Object.values(statsMap).reduce((s, v) => s + v.annonces, 0),
    commission: agents.reduce((s, a) => s + a.commissionHistorique + (statsMap[a.id]?.commissionPeriode ?? 0), 0),
  }), [agents, statsMap]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return agents.filter(a => {
      if (q && !a.name.toLowerCase().includes(q) && !a.title.toLowerCase().includes(q)) return false;
      if (statusFlt === "actif"   && !a.actif)  return false;
      if (statusFlt === "inactif" &&  a.actif)  return false;
      if (specFlt && a.specialite !== specFlt)  return false;
      return true;
    });
  }, [agents, search, statusFlt, specFlt]);

  // ── Keep selected in sync ──────────────────────────────────────────────────
  const liveSelected = selected ? (agents.find(a => a.id === selected.id) ?? null) : null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFormSave = useCallback((form: FormState) => {
    if (editAgent) {
      updateAgent(editAgent.id, {
        name: form.name, title: form.title, specialite: form.specialite,
        zone: form.zone, phone: form.phone, whatsapp: form.whatsapp ?? editAgent.whatsapp,
        email: form.email, avatar: form.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase(),
        tauxCommission: parseFloat(form.tauxCommission), bio: form.bio, actif: form.actif,
      });
      toast.success(`${form.name} mis à jour`);
    } else {
      const initials = form.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
      addAgent({
        name: form.name, title: form.title, specialite: form.specialite,
        zone: form.zone, phone: form.phone, whatsapp: form.phone.replace(/\s+/g,"").replace("+",""),
        email: form.email, avatar: initials,
        tauxCommission: parseFloat(form.tauxCommission), bio: form.bio,
        actif: form.actif, dateEntree: new Date().toISOString().split("T")[0],
        rating: 4.5,
      });
      toast.success(`Agent "${form.name}" créé avec succès`);
    }
    setFormOpen(false); setEditAgent(null);
  }, [editAgent]);

  const handleToggle = useCallback((ag: AgentFull) => {
    toggleAgent(ag.id);
    toast.info(`${ag.name} ${ag.actif ? "désactivé" : "activé"}`);
  }, []);

  const handleDelete = useCallback((ag: AgentFull) => {
    deleteAgent(ag.id);
    setDeleteTarget(null);
    setSelected(null);
    toast.error(`Agent "${ag.name}" supprimé`);
  }, []);

  const openEdit = (ag: AgentFull) => { setEditAgent(ag); setFormOpen(true); setSelected(null); };
  const openAdd  = () => { setEditAgent(null); setFormOpen(true); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1C2E]" style={{ fontFamily: "'Playfair Display',serif" }}>Agents</h1>
          <p className="text-gray-500 text-sm mt-0.5">{totals.actifs} agent{totals.actifs !== 1 ? "s" : ""} actif{totals.actifs !== 1 ? "s" : ""} · {totals.total} au total</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-colors"
          style={{ background: GOLD }}>
          <Plus size={16}/>Nouvel agent
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total agents",    value: totals.total,                                   icon: <Users size={18}/>,      color: NAVY      },
          { label: "Agents actifs",   value: totals.actifs,                                  icon: <UserCheck size={18}/>,  color: "#16A34A" },
          { label: "Annonces gérées", value: totals.annonces,                                icon: <Building2 size={18}/>,  color: "#3B82F6" },
          { label: "Commissions",     value: `${fmt(Math.round(totals.commission / 1_000_000))} M FCFA`, icon: <TrendingUp size={18}/>, color: GOLD, text: true },
        ].map(({ label, value, icon, color, text }) => (
          <div key={label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: B }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}15`, color }}>
              {icon}
            </div>
            <div>
              <div className={`text-2xl font-bold ${text ? "text-xl" : ""}`}
                style={{ fontFamily: text ? "'Plus Jakarta Sans',sans-serif" : "'DM Mono',monospace", color, fontSize: text ? "1rem" : undefined }}>
                {value}
              </div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nom, titre…"
            className="pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none bg-white w-44"
            style={{ borderColor: B, color: NAVY }}/>
          {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={13}/></button>}
        </div>

        <select value={statusFlt} onChange={e => setStatusFlt(e.target.value as typeof statusFlt)}
          className="px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none bg-white"
          style={{ borderColor: statusFlt !== "all" ? GOLD : B, color: NAVY }}>
          <option value="all">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>

        <select value={specFlt} onChange={e => setSpecFlt(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none bg-white"
          style={{ borderColor: specFlt ? GOLD : B, color: NAVY }}>
          <option value="">Toutes spécialités</option>
          {SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {(search || statusFlt !== "all" || specFlt) && (
          <button onClick={() => { setSearch(""); setStatusFlt("all"); setSpecFlt(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
            style={{ borderColor: B, color: "#6B7280" }}>
            <RotateCcw size={11}/>Réinitialiser
          </button>
        )}

        <div className="flex gap-0.5 p-1 rounded-xl border bg-white ml-auto" style={{ borderColor: B }}>
          <button onClick={() => setView("grille")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: view === "grille" ? NAVY : "transparent", color: view === "grille" ? "#fff" : "#9CA3AF" }}>
            <LayoutGrid size={13}/>Grille
          </button>
          <button onClick={() => setView("liste")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: view === "liste" ? NAVY : "transparent", color: view === "liste" ? "#fff" : "#9CA3AF" }}>
            <List size={13}/>Liste
          </button>
        </div>
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border py-16 text-center" style={{ borderColor: B }}>
          <Users size={28} className="mx-auto mb-3 opacity-20"/>
          <p className="text-gray-400 text-sm">Aucun agent pour ces filtres</p>
        </div>
      )}

      {/* Grid view */}
      {view === "grille" && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ag => (
            <AgentCard
              key={ag.id}
              agent={ag}
              stats={statsMap[ag.id] ?? { annonces: 0, transactions: 0, commissionPeriode: 0 }}
              myProspects={ag.prospectIds.length}
              myVisits={ag.visitIds.length}
              onSelect={() => setSelected(ag)}
              onEdit={() => openEdit(ag)}
              onToggle={() => handleToggle(ag)}
              onDelete={() => setDeleteTarget(ag)}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {view === "liste" && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: B }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: B, background: "#F8F6F2" }}>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Spécialité</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Note</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Ann. · Pros. · Vis.</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Commission</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: B }}>
                {filtered.map(ag => (
                  <AgentRow
                    key={ag.id}
                    agent={ag}
                    stats={statsMap[ag.id] ?? { annonces: 0, transactions: 0, commissionPeriode: 0 }}
                    myProspects={ag.prospectIds.length}
                    myVisits={ag.visitIds.length}
                    onSelect={() => setSelected(ag)}
                    onEdit={() => openEdit(ag)}
                    onToggle={() => handleToggle(ag)}
                    onDelete={() => setDeleteTarget(ag)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: B, background: "#FAFAF9" }}>
            <p className="text-xs text-gray-400">{filtered.length} agent{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}</p>
            <p className="text-xs font-bold" style={{ color: GOLD }}>
              {totals.annonces} annonces au total
            </p>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {liveSelected && (
        <AgentDetail
          agent={liveSelected}
          properties={properties}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(liveSelected)}
          onToggle={() => handleToggle(liveSelected)}
          onDelete={() => { setSelected(null); setDeleteTarget(liveSelected); }}
        />
      )}

      {/* Form modal */}
      {formOpen && (
        <AgentForm
          title={editAgent ? `Modifier — ${editAgent.name}` : "Nouvel agent"}
          initial={editAgent ? agentToForm(editAgent) : BLANK_FORM}
          onSave={handleFormSave}
          onClose={() => { setFormOpen(false); setEditAgent(null); }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          agent={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
