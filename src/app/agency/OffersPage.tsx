import { useState, useMemo, useCallback } from "react";
import {
  Plus, Search, X, MoreHorizontal, Pencil, Trash2, Eye,
  CheckCircle, XCircle, Loader2, TrendingUp, Handshake,
  FileSignature, Ban, RotateCcw, ChevronRight, List,
  LayoutGrid, AlertTriangle, ArrowRight, MessageSquare,
  Clock, DollarSign, BarChart3, Percent, ChevronDown,
  ArrowUpRight, ArrowDownRight, Zap, Building2,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import { NAVY, GOLD, B, AGENTS, fmt } from "../data";
import { useProperties } from "./store";
import { pushNotif } from "./notificationsStore";
import {
  useOffers, addOffer, updateOffer, setOfferStatus, deleteOffer,
  OFFER_STATUS_CFG, OFFER_STATUS_ORDER,
  type Offer, type OfferStatus,
} from "./offersStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ACTIVE_STATUSES: OfferStatus[] = ["reçue", "négociation", "acceptée", "contrat"];

function shortDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-SN", { day: "numeric", month: "short" });
}
function fullDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-SN", { day: "numeric", month: "long", year: "numeric" });
}
function pct(a: number, b: number) { return b === 0 ? "—" : `${Math.round((a / b) * 100)} %`; }
function diff(montant: number, prix: number) { return montant - prix; }
function diffPct(montant: number, prix: number) {
  return prix === 0 ? 0 : ((montant - prix) / prix) * 100;
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, size = "sm" }: { status: OfferStatus; size?: "xs" | "sm" }) {
  const s = OFFER_STATUS_CFG[status];
  const sz = size === "xs" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2.5 py-1";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold ${sz} ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`}/>
      {s.label}
    </span>
  );
}

// ─── WorkflowBar ──────────────────────────────────────────────────────────────
function WorkflowBar({ statut }: { statut: OfferStatus }) {
  const steps: OfferStatus[] = ["reçue", "négociation", "acceptée", "contrat", "finalisée"];
  const cur = OFFER_STATUS_CFG[statut].step;
  const cancelled = statut === "annulée";
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((s, i) => {
        const cfg   = OFFER_STATUS_CFG[s];
        const done  = !cancelled && cur > i;
        const active = !cancelled && cur === i;
        return (
          <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className={`h-1 rounded-full transition-all ${done || active ? "" : "bg-gray-100"}`}
                style={{ background: done ? cfg.color : active ? cfg.color : undefined, opacity: active ? 0.5 : 1 }}/>
              <p className={`text-[8px] font-bold mt-1 truncate uppercase tracking-wide ${active ? "" : done ? "text-gray-400" : "text-gray-300"}`}
                style={{ color: active ? cfg.color : undefined }}>
                {cfg.label.split(" ")[0]}
              </p>
            </div>
            {i < steps.length - 1 && <div className="w-0.5 h-3 rounded-full bg-gray-100 shrink-0"/>}
          </div>
        );
      })}
      {cancelled && (
        <span className="text-[9px] font-bold text-red-400 ml-2 shrink-0">Annulée</span>
      )}
    </div>
  );
}

// ─── OfferForm ────────────────────────────────────────────────────────────────
interface FormState {
  propId: number; propTitle: string; propRef: string; propImg: string; propPrice: number; propTransaction: string;
  prospectName: string; prospectPhone: string;
  agentName: string;
  montant: string;
  commentaire: string;
}
const BLANK: FormState = {
  propId: 0, propTitle: "", propRef: "", propImg: "", propPrice: 0, propTransaction: "",
  prospectName: "", prospectPhone: "", agentName: "", montant: "", commentaire: "",
};
function offerToForm(o: Offer): FormState {
  return {
    propId: o.propId, propTitle: o.propTitle, propRef: o.propRef, propImg: o.propImg,
    propPrice: o.propPrice, propTransaction: o.propTransaction,
    prospectName: o.prospectName, prospectPhone: o.prospectPhone,
    agentName: o.agentName, montant: String(o.montant), commentaire: o.commentaire,
  };
}

function OfferForm({ title, initial, onSave, onClose }: {
  title: string; initial: FormState;
  onSave: (f: FormState) => void; onClose: () => void;
}) {
  const properties = useProperties();
  const [form, setForm]       = useState<FormState>(initial);
  const [errors, setErrors]   = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSub]  = useState(false);
  const [success, setSuccess] = useState(false);

  const upd = (p: Partial<FormState>) => setForm(f => ({ ...f, ...p }));
  const clr = (k: keyof FormState) => setErrors(e => ({ ...e, [k]: "" }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.propTitle)              e.propTitle     = "Sélectionnez un bien";
    if (!form.prospectName.trim())    e.prospectName  = "Nom du prospect requis";
    if (!form.prospectPhone.trim())   e.prospectPhone = "Téléphone requis";
    if (!form.agentName)              e.agentName     = "Sélectionnez un agent";
    const m = parseFloat(form.montant.replace(/\s/g, ""));
    if (!form.montant || isNaN(m) || m <= 0) e.montant = "Montant invalide";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSub(true);
    setTimeout(() => { setSuccess(true); setTimeout(() => onSave(form), 600); }, 500);
  };

  const proposedPrice = parseFloat(form.montant.replace(/\s/g, "")) || 0;
  const delta = form.propPrice > 0 ? diffPct(proposedPrice, form.propPrice) : 0;

  const ic  = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#C9963A]/30 transition-all bg-white";
  const sty = (k: keyof FormState) => errors[k]
    ? { borderColor: "#F87171", boxShadow: "0 0 0 3px rgba(248,113,113,0.18)", color: NAVY }
    : { borderColor: B, color: NAVY };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">

        {success && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-emerald-500"/>
            </div>
            <p className="font-bold text-[#0F1C2E] text-lg" style={{ fontFamily: "'Playfair Display',serif" }}>
              {title.includes("Modifier") ? "Offre mise à jour" : "Offre enregistrée !"}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor: B }}>
          <h3 className="font-bold text-[#0F1C2E] text-lg" style={{ fontFamily: "'Playfair Display',serif" }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100"><X size={16}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Bien */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Bien immobilier *</label>
            <select className={ic} style={sty("propTitle")}
              value={form.propId || ""}
              onChange={e => {
                const p = properties.find(x => x.id === Number(e.target.value));
                if (p) upd({ propId: p.id, propTitle: p.title, propRef: p.ref, propImg: p.img, propPrice: p.price, propTransaction: p.transaction });
                else   upd({ propId: 0, propTitle: "", propRef: "", propImg: "", propPrice: 0, propTransaction: "" });
                clr("propTitle");
              }}>
              <option value="">— Sélectionner un bien —</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.title} · {fmt(p.price)} FCFA</option>
              ))}
            </select>
            {errors.propTitle && <p className="text-xs text-red-500 mt-1">⚠ {errors.propTitle}</p>}
            {form.propPrice > 0 && (
              <p className="text-[11px] text-gray-400 mt-1">Prix demandé : <strong>{fmt(form.propPrice)} FCFA</strong></p>
            )}
          </div>

          {/* Montant proposé */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Montant proposé (FCFA) *</label>
            <input className={ic} style={sty("montant")} type="number" min="0" step="1000000"
              value={form.montant} placeholder="Ex: 185000000"
              onChange={e => { upd({ montant: e.target.value }); clr("montant"); }}/>
            {errors.montant && <p className="text-xs text-red-500 mt-1">⚠ {errors.montant}</p>}
            {proposedPrice > 0 && form.propPrice > 0 && (
              <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] font-bold`}>
                {delta < 0
                  ? <><ArrowDownRight size={12} className="text-red-500"/><span className="text-red-500">{Math.abs(delta).toFixed(1)} % sous le prix demandé ({fmt(Math.round(diff(proposedPrice, form.propPrice)))} FCFA)</span></>
                  : delta > 0
                  ? <><ArrowUpRight size={12} className="text-emerald-600"/><span className="text-emerald-600">{delta.toFixed(1)} % au-dessus du prix demandé</span></>
                  : <><CheckCircle size={12} className="text-gray-400"/><span className="text-gray-400">Correspond au prix demandé</span></>}
              </div>
            )}
          </div>

          {/* Prospect */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Prospect — Nom *</label>
              <input className={ic} style={sty("prospectName")} value={form.prospectName}
                placeholder="Prénom Nom"
                onChange={e => { upd({ prospectName: e.target.value }); clr("prospectName"); }}/>
              {errors.prospectName && <p className="text-xs text-red-500 mt-1">⚠ {errors.prospectName}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone *</label>
              <input className={ic} style={sty("prospectPhone")} value={form.prospectPhone}
                placeholder="+221 77 000 00 00"
                onChange={e => { upd({ prospectPhone: e.target.value }); clr("prospectPhone"); }}/>
              {errors.prospectPhone && <p className="text-xs text-red-500 mt-1">⚠ {errors.prospectPhone}</p>}
            </div>
          </div>

          {/* Agent */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Agent responsable *</label>
            <select className={ic} style={sty("agentName")}
              value={form.agentName}
              onChange={e => { upd({ agentName: e.target.value }); clr("agentName"); }}>
              <option value="">— Sélectionner un agent —</option>
              {AGENTS.map(a => <option key={a.name} value={a.name}>{a.name} · {a.title}</option>)}
            </select>
            {errors.agentName && <p className="text-xs text-red-500 mt-1">⚠ {errors.agentName}</p>}
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Commentaire (optionnel)</label>
            <textarea rows={3} className={`${ic} resize-none`} style={{ borderColor: B, color: NAVY }}
              value={form.commentaire} placeholder="Conditions, observations, attentes du prospect…"
              onChange={e => upd({ commentaire: e.target.value })}/>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: B }}>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm border hover:bg-gray-50"
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

// ─── NegotiationModal ─────────────────────────────────────────────────────────
function NegotiationModal({ offer, onConfirm, onClose }: {
  offer: Offer; onConfirm: (montant: number, note: string) => void; onClose: () => void;
}) {
  const [montant, setMontant] = useState(String(offer.montant));
  const [note,    setNote]    = useState("");
  const [err,     setErr]     = useState("");

  const m = parseFloat(montant.replace(/\s/g, ""));
  const delta = !isNaN(m) ? diffPct(m, offer.propPrice) : 0;

  const handleSave = () => {
    if (isNaN(m) || m <= 0) { setErr("Montant invalide"); return; }
    onConfirm(m, note);
  };

  const ic = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none bg-white focus:ring-2 focus:ring-[#C9963A]/30 transition-all";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: B }}>
          <h3 className="font-bold text-[#0F1C2E]" style={{ fontFamily: "'Playfair Display',serif" }}>Modifier l'offre / négociation</h3>
          <p className="text-xs text-gray-400 mt-0.5">{offer.propTitle} · {offer.prospectName}</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-3 text-xs p-3 rounded-xl" style={{ background: `${GOLD}08` }}>
            <div><p className="text-gray-400 mb-0.5">Montant actuel</p><p className="font-bold" style={{ color: NAVY }}>{fmt(offer.montant)} FCFA</p></div>
            <div className="w-px bg-gray-200"/>
            <div><p className="text-gray-400 mb-0.5">Prix demandé</p><p className="font-bold" style={{ color: GOLD }}>{fmt(offer.propPrice)} FCFA</p></div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nouveau montant (FCFA) *</label>
            <input type="number" min="0" className={ic}
              style={{ borderColor: err ? "#F87171" : B, color: NAVY }}
              value={montant} onChange={e => { setMontant(e.target.value); setErr(""); }}/>
            {err && <p className="text-xs text-red-500 mt-1">⚠ {err}</p>}
            {!isNaN(m) && m > 0 && (
              <p className={`text-[11px] font-bold mt-1 ${delta < 0 ? "text-red-500" : delta > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                {delta < 0 ? `${Math.abs(delta).toFixed(1)} % sous le prix demandé` : delta > 0 ? `${delta.toFixed(1)} % au-dessus` : "Correspond au prix demandé"}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Note de négociation</label>
            <textarea rows={2} className={`${ic} resize-none`} style={{ borderColor: B, color: NAVY }}
              value={note} placeholder="Contre-offre, conditions, justification…"
              onChange={e => setNote(e.target.value)}/>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm border"
            style={{ borderColor: B, color: NAVY }}>Annuler</button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: GOLD }}>Mettre en négociation</button>
        </div>
      </div>
    </div>
  );
}

// ─── ActionConfirmModal ────────────────────────────────────────────────────────
interface ActionCfg {
  title: string; desc: string; confirmLabel: string;
  confirmStyle: string; icon: React.ReactNode; noteLabel?: string;
}
const ACTION_CFGS: Partial<Record<OfferStatus, ActionCfg>> = {
  acceptée:  { title:"Accepter l'offre",       desc:"L'offre sera marquée acceptée. Cette action confirme l'accord de principe.",              confirmLabel:"Accepter",           confirmStyle:"bg-emerald-500 hover:bg-emerald-600",  icon:<CheckCircle size={22} className="text-emerald-500"/>,  noteLabel:"Note (optionnel)" },
  contrat:   { title:"Préparer le contrat",    desc:"L'offre passera en phase de rédaction contractuelle. Transmis au service juridique.",      confirmLabel:"Préparer le contrat",confirmStyle:"bg-purple-600 hover:bg-purple-700",     icon:<FileSignature size={22} className="text-purple-500"/>, noteLabel:"Notaire / référence (optionnel)" },
  finalisée: { title:"Finaliser la transaction",desc:"Cette action marque la transaction comme définitivement conclue. Irréversible.",           confirmLabel:"Finaliser",          confirmStyle:"text-white",                           icon:<Handshake size={22} style={{ color: GOLD }}/>,         noteLabel:"Observations finales" },
  annulée:   { title:"Annuler l'offre",         desc:"L'offre sera marquée comme annulée. Elle restera visible dans l'historique.",             confirmLabel:"Confirmer l'annulation", confirmStyle:"bg-red-500 hover:bg-red-600",      icon:<Ban size={22} className="text-red-500"/>,              noteLabel:"Raison de l'annulation" },
  reçue:     { title:"Réactiver l'offre",       desc:"L'offre sera réactivée et passera à l'état 'Offre reçue'. Elle pourra être retraitée.",    confirmLabel:"Réactiver",          confirmStyle:"bg-blue-500 hover:bg-blue-600",        icon:<RotateCcw size={22} className="text-blue-500"/>,       noteLabel:"Note de réactivation" },
};

function ActionConfirmModal({ target, offer, onConfirm, onClose }: {
  target: OfferStatus; offer: Offer;
  onConfirm: (note: string) => void; onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const cfg = ACTION_CFGS[target];
  if (!cfg) return null;

  const isFinalize = target === "finalisée";
  const btnStyle = isFinalize ? { background: GOLD } : undefined;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: isFinalize ? `${GOLD}15` : target === "annulée" ? "#FEF2F2" : target === "acceptée" ? "#F0FDF4" : target === "contrat" ? "#F5F3FF" : "#EFF6FF" }}>
            {cfg.icon}
          </div>
          <h3 className="font-bold text-[#0F1C2E] text-center text-lg mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>{cfg.title}</h3>
          <p className="text-sm text-gray-500 text-center mb-4">{cfg.desc}</p>
          <div className="p-3 rounded-xl border mb-4 text-xs" style={{ borderColor: B, background: "#FAFAF9" }}>
            <p className="font-semibold text-[#0F1C2E]">{offer.propTitle}</p>
            <p className="text-gray-500">{offer.prospectName} · {fmt(offer.montant)} FCFA</p>
          </div>
          {cfg.noteLabel && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{cfg.noteLabel}</label>
              <textarea rows={2} className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none bg-white"
                style={{ borderColor: B, color: NAVY }}
                value={note} onChange={e => setNote(e.target.value)}
                placeholder="Saisissez une note…"/>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm border"
            style={{ borderColor: B, color: NAVY }}>Annuler</button>
          <button onClick={() => onConfirm(note)}
            className={`flex-1 py-3 rounded-xl font-bold text-sm text-white transition-colors ${cfg.confirmStyle}`}
            style={btnStyle}>
            {cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OfferDetail ──────────────────────────────────────────────────────────────
function OfferDetail({ offer, onClose, onEdit, onDelete }: {
  offer: Offer; onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [actionTarget,   setActionTarget]   = useState<OfferStatus | null>(null);
  const [negoOpen,       setNegoOpen]       = useState(false);
  const [deleteConfirm,  setDeleteConfirm]  = useState(false);

  const { statut } = offer;
  const cfg        = OFFER_STATUS_CFG[statut];
  const deltaAmt   = diff(offer.montant, offer.propPrice);
  const deltaPct   = diffPct(offer.montant, offer.propPrice);

  const agent = AGENTS.find(a => a.name === offer.agentName);

  const doStatusChange = useCallback((target: OfferStatus, note: string) => {
    setOfferStatus(offer.id, target, offer.agentName, note || undefined);
    setActionTarget(null);
    const labels: Record<OfferStatus, string> = {
      reçue: "Offre réactivée", négociation: "Mise en négociation",
      acceptée: "Offre acceptée ✓", contrat: "Contrat en préparation",
      finalisée: "Transaction finalisée 🎉", annulée: "Offre annulée",
    };
    if (target === "finalisée") toast.success(labels[target]);
    else if (target === "annulée") toast.error(labels[target]);
    else toast.success(labels[target]);
  }, [offer]);

  const doNegotiate = useCallback((montant: number, note: string) => {
    updateOffer(offer.id, { montant }, note || undefined);
    setOfferStatus(offer.id, "négociation", offer.agentName, note || "Montant révisé en négociation");
    setNegoOpen(false);
    toast.success("Offre mise en négociation");
  }, [offer]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
        <div className="relative bg-white w-full sm:w-[440px] h-[92vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-5 py-5 border-b shrink-0" style={{ borderColor: B }}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <img src={offer.propImg} alt="" className="w-full h-full object-cover"/>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#0F1C2E] truncate" style={{ fontFamily: "'Playfair Display',serif" }}>
                    {offer.propTitle}
                  </p>
                  <p className="text-[11px] font-mono text-gray-400">{offer.propRef}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!deleteConfirm ? (
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
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-red-500 font-semibold">Supprimer ?</span>
                    <button onClick={onDelete} className="px-2 py-1 rounded-lg text-xs font-bold text-white bg-red-500">Oui</button>
                    <button onClick={() => setDeleteConfirm(false)} className="px-2 py-1 rounded-lg text-xs font-bold border" style={{ borderColor: B, color: NAVY }}>Non</button>
                  </div>
                )}
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 ml-1"><X size={16}/></button>
              </div>
            </div>

            {/* Status + workflow */}
            <div className="flex items-center justify-between mb-2">
              <StatusBadge status={statut}/>
              <span className="text-xs text-gray-400">{fullDate(offer.updatedAt)}</span>
            </div>
            <WorkflowBar statut={statut}/>
          </div>

          {/* Montant block */}
          <div className="px-5 py-4 border-b shrink-0" style={{ borderColor: B }}>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 p-3 rounded-2xl" style={{ background: `${GOLD}10` }}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Montant proposé</p>
                <p className="text-2xl font-bold" style={{ fontFamily: "'DM Mono',monospace", color: GOLD }}>
                  {fmt(offer.montant)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">FCFA</p>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl border" style={{ borderColor: B }}>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Prix demandé</p>
                  <p className="text-xs font-bold" style={{ color: NAVY }}>{fmt(offer.propPrice)}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${deltaPct < 0 ? "bg-red-50" : deltaPct > 0 ? "bg-emerald-50" : "bg-gray-50"}`}>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Écart</p>
                  <p className={`text-xs font-bold flex items-center gap-0.5 ${deltaPct < 0 ? "text-red-500" : deltaPct > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                    {deltaPct >= 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
                    {Math.abs(deltaPct).toFixed(1)} %
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">

            {/* Prospect + Agent */}
            <div className="px-5 py-4 border-b space-y-3" style={{ borderColor: B }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: NAVY }}>
                  {offer.prospectName.split(" ").map(w=>w[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-[#0F1C2E]">{offer.prospectName}</p>
                  <p className="text-xs text-gray-500">{offer.prospectPhone}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Prospect</span>
              </div>
              {agent && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: NAVY }}>
                    {agent.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-[#0F1C2E]">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.title}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${GOLD}15`, color: GOLD }}>Agent</span>
                </div>
              )}
            </div>

            {/* Commentaire */}
            {offer.commentaire && (
              <div className="px-5 py-4 border-b" style={{ borderColor: B }}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Commentaire</p>
                <p className="text-sm text-gray-600 leading-relaxed">{offer.commentaire}</p>
              </div>
            )}

            {/* Historique */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">Historique</p>
              <div className="space-y-3">
                {[...offer.history].reverse().map((ev, i) => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-2 h-2 rounded-full mt-1" style={{ background: i === 0 ? GOLD : "#E5E7EB" }}/>
                      {i < offer.history.length - 1 && <div className="flex-1 w-px bg-gray-100 mt-1"/>}
                    </div>
                    <div className="pb-3 min-w-0">
                      <p className="text-xs font-bold text-[#0F1C2E]">{ev.action}</p>
                      <p className="text-[11px] text-gray-400">{ev.by} · {fullDate(ev.date)}</p>
                      {ev.note && <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">"{ev.note}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-5 py-4 border-t space-y-2 shrink-0" style={{ borderColor: B }}>
            {statut === "reçue" && (
              <>
                <div className="flex gap-2">
                  <button onClick={() => setNegoOpen(true)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: B, color: NAVY }}>
                    <MessageSquare size={14}/>Négocier
                  </button>
                  <button onClick={() => setActionTarget("acceptée")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: "#16A34A" }}>
                    <CheckCircle size={14}/>Accepter
                  </button>
                </div>
                <button onClick={() => setActionTarget("annulée")}
                  className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  style={{ background: "#FEF2F2", color: "#EF4444" }}>
                  <Ban size={13}/>Refuser / Annuler
                </button>
              </>
            )}
            {statut === "négociation" && (
              <>
                <div className="flex gap-2">
                  <button onClick={() => setNegoOpen(true)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 hover:bg-gray-50"
                    style={{ borderColor: B, color: NAVY }}>
                    <Pencil size={13}/>Modifier l'offre
                  </button>
                  <button onClick={() => setActionTarget("acceptée")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: "#16A34A" }}>
                    <CheckCircle size={14}/>Accepter
                  </button>
                </div>
                <button onClick={() => setActionTarget("annulée")}
                  className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  style={{ background: "#FEF2F2", color: "#EF4444" }}>
                  <Ban size={13}/>Annuler
                </button>
              </>
            )}
            {statut === "acceptée" && (
              <>
                <button onClick={() => setActionTarget("contrat")}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "#7C3AED" }}>
                  <FileSignature size={15}/>Préparer le contrat
                </button>
                <button onClick={() => setActionTarget("annulée")}
                  className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  style={{ background: "#FEF2F2", color: "#EF4444" }}>
                  <Ban size={13}/>Annuler
                </button>
              </>
            )}
            {statut === "contrat" && (
              <>
                <button onClick={() => setActionTarget("finalisée")}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: GOLD }}>
                  <Handshake size={15}/>Finaliser la transaction
                </button>
                <button onClick={() => setActionTarget("annulée")}
                  className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  style={{ background: "#FEF2F2", color: "#EF4444" }}>
                  <Ban size={13}/>Annuler
                </button>
              </>
            )}
            {statut === "finalisée" && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-[#C9963A]">
                <Handshake size={15}/>Transaction finalisée avec succès
              </div>
            )}
            {statut === "annulée" && (
              <button onClick={() => setActionTarget("reçue")}
                className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: "#EFF6FF", color: "#3B82F6" }}>
                <RotateCcw size={14}/>Réactiver l'offre
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {negoOpen && (
        <NegotiationModal offer={offer} onConfirm={doNegotiate} onClose={() => setNegoOpen(false)}/>
      )}
      {actionTarget && ACTION_CFGS[actionTarget] && (
        <ActionConfirmModal
          target={actionTarget} offer={offer}
          onConfirm={(note) => doStatusChange(actionTarget, note)}
          onClose={() => setActionTarget(null)}/>
      )}
    </>
  );
}

// ─── KanbanCard ───────────────────────────────────────────────────────────────
function KanbanCard({ offer, onClick }: { offer: Offer; onClick: () => void }) {
  const agent = AGENTS.find(a => a.name === offer.agentName);
  const deltaPct = diffPct(offer.montant, offer.propPrice);

  return (
    <div onClick={onClick}
      className="bg-white rounded-2xl border p-3 cursor-pointer hover:shadow-md transition-all group"
      style={{ borderColor: B }}>
      {/* Property */}
      <div className="flex items-center gap-2 mb-3">
        <img src={offer.propImg} alt="" className="w-9 h-9 rounded-xl object-cover bg-gray-100 shrink-0"/>
        <div className="min-w-0">
          <p className="font-bold text-xs text-[#0F1C2E] truncate">{offer.propTitle}</p>
          <p className="text-[10px] font-mono text-gray-400">{offer.propRef}</p>
        </div>
      </div>
      {/* Montant */}
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-bold text-sm" style={{ fontFamily: "'DM Mono',monospace", color: GOLD }}>
          {fmt(offer.montant)}
        </span>
        <span className={`text-[9px] font-bold flex items-center gap-0.5 ${deltaPct < 0 ? "text-red-400" : deltaPct > 0 ? "text-emerald-500" : "text-gray-400"}`}>
          {deltaPct >= 0 ? <ArrowUpRight size={9}/> : <ArrowDownRight size={9}/>}
          {Math.abs(deltaPct).toFixed(1)} %
        </span>
      </div>
      <p className="text-[9px] text-gray-400 mb-3">Demandé: {fmt(offer.propPrice)} FCFA</p>
      {/* Prospect + Agent */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-gray-600 truncate max-w-[120px]">{offer.prospectName}</p>
        {agent && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
            style={{ background: NAVY }}>
            {agent.avatar}
          </div>
        )}
      </div>
      {/* Date */}
      <p className="text-[9px] text-gray-300 mt-2">{shortDate(offer.createdAt)}</p>
    </div>
  );
}

// ─── KanbanView ───────────────────────────────────────────────────────────────
function KanbanView({ offers, onSelect }: { offers: Offer[]; onSelect: (o: Offer) => void }) {
  const byStatus = useMemo(() => {
    const m: Partial<Record<OfferStatus, Offer[]>> = {};
    for (const s of OFFER_STATUS_ORDER) m[s] = [];
    for (const o of offers) m[o.statut]!.push(o);
    return m;
  }, [offers]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      {OFFER_STATUS_ORDER.map(status => {
        const sc   = OFFER_STATUS_CFG[status];
        const list = byStatus[status] ?? [];
        return (
          <div key={status} className="flex flex-col min-w-[220px] w-[220px] shrink-0">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`}/>
              <span className="text-xs font-bold text-gray-600 flex-1 truncate">{sc.label}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{list.length}</span>
            </div>
            {/* Cards */}
            <div className="space-y-2 flex-1">
              {list.map(o => (
                <KanbanCard key={o.id} offer={o} onClick={() => onSelect(o)}/>
              ))}
              {list.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed py-8 text-center" style={{ borderColor: `${sc.color}20` }}>
                  <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wide">Vide</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ListView ─────────────────────────────────────────────────────────────────
function ListView({ offers, onSelect, onStatusChange, onDelete }: {
  offers: Offer[]; onSelect: (o: Offer) => void;
  onStatusChange: (o: Offer, s: OfferStatus) => void;
  onDelete: (id: number) => void;
}) {
  if (!offers.length) return (
    <div className="bg-white rounded-2xl border py-16 text-center" style={{ borderColor: B }}>
      <BarChart3 size={28} className="mx-auto mb-3 opacity-20"/>
      <p className="text-gray-400 text-sm">Aucune offre pour ces filtres</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: B }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: B, background: "#F8F6F2" }}>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Bien</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Prospect</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Agent</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Montant</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Statut</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: B }}>
            {offers.map(o => {
              const agent = AGENTS.find(a => a.name === o.agentName);
              const dp    = diffPct(o.montant, o.propPrice);
              return (
                <tr key={o.id} className="hover:bg-[#F8F6F2] transition-colors cursor-pointer border-b" style={{ borderColor: B }}
                  onClick={() => onSelect(o)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={o.propImg} alt="" className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0"/>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[#0F1C2E] truncate max-w-[140px]">{o.propTitle}</p>
                        <p className="text-[10px] font-mono text-gray-400">{o.propRef}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <p className="font-semibold text-xs text-[#0F1C2E]">{o.prospectName}</p>
                    <p className="text-[10px] text-gray-400">{o.prospectPhone}</p>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    {agent ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: NAVY }}>{agent.avatar}</div>
                        <span className="text-xs text-gray-600 truncate max-w-[80px]">{agent.name}</span>
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-xs" style={{ fontFamily: "'DM Mono',monospace", color: GOLD }}>{fmt(o.montant)}</p>
                    <p className={`text-[10px] font-bold flex items-center gap-0.5 ${dp < 0 ? "text-red-400" : dp > 0 ? "text-emerald-500" : "text-gray-300"}`}>
                      {dp >= 0 ? <ArrowUpRight size={9}/> : <ArrowDownRight size={9}/>}
                      {Math.abs(dp).toFixed(1)} %
                    </p>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={o.statut} size="xs"/></td>
                  <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onSelect(o)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0F1C2E] hover:bg-gray-100 transition-colors">
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
                            className="bg-white rounded-2xl border shadow-xl z-50 min-w-[190px] py-1.5 overflow-hidden" style={{ borderColor: B }}>
                            {o.statut === "reçue" && <>
                              <DropdownMenu.Item onSelect={() => onStatusChange(o, "négociation")}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                                <MessageSquare size={13} className="text-amber-500"/>En négociation
                              </DropdownMenu.Item>
                              <DropdownMenu.Item onSelect={() => onStatusChange(o, "acceptée")}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                                <CheckCircle size={13} className="text-emerald-500"/>Accepter
                              </DropdownMenu.Item>
                            </>}
                            {o.statut === "négociation" && (
                              <DropdownMenu.Item onSelect={() => onStatusChange(o, "acceptée")}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                                <CheckCircle size={13} className="text-emerald-500"/>Accepter
                              </DropdownMenu.Item>
                            )}
                            {o.statut === "acceptée" && (
                              <DropdownMenu.Item onSelect={() => onStatusChange(o, "contrat")}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                                <FileSignature size={13} className="text-purple-500"/>Préparer contrat
                              </DropdownMenu.Item>
                            )}
                            {o.statut === "contrat" && (
                              <DropdownMenu.Item onSelect={() => onStatusChange(o, "finalisée")}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                                <Handshake size={13} style={{ color: GOLD }}/>Finaliser
                              </DropdownMenu.Item>
                            )}
                            {o.statut === "annulée" && (
                              <DropdownMenu.Item onSelect={() => onStatusChange(o, "reçue")}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                                <RotateCcw size={13} className="text-blue-500"/>Réactiver
                              </DropdownMenu.Item>
                            )}
                            {["reçue","négociation","acceptée","contrat"].includes(o.statut) && (
                              <DropdownMenu.Item onSelect={() => onStatusChange(o, "annulée")}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-red-500 outline-none">
                                <Ban size={13}/>Annuler
                              </DropdownMenu.Item>
                            )}
                            <DropdownMenu.Separator className="my-1 h-px bg-gray-100"/>
                            <DropdownMenu.Item onSelect={() => onDelete(o.id)}
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
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: B, background: "#FAFAF9" }}>
        <p className="text-xs text-gray-400">{offers.length} offre{offers.length !== 1 ? "s" : ""}</p>
        <p className="text-xs font-bold" style={{ color: GOLD }}>
          {fmt(offers.filter(o => o.statut === "finalisée").reduce((s,o) => s + o.montant, 0))} FCFA finalisés
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OffersPage() {
  const offers = useOffers();

  const [view,      setView]      = useState<"kanban" | "liste">("kanban");
  const [search,    setSearch]    = useState("");
  const [agentFlt,  setAgentFlt]  = useState("");
  const [statusFlt, setStatusFlt] = useState<OfferStatus | "all">("all");

  const [selected,    setSelected]    = useState<Offer | null>(null);
  const [formOpen,    setFormOpen]    = useState(false);
  const [editOffer,   setEditOffer]   = useState<Offer | null>(null);
  const [quickAction, setQuickAction] = useState<{ offer: Offer; target: OfferStatus } | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total      = offers.length;
    const actives    = offers.filter(o => ACTIVE_STATUSES.includes(o.statut)).length;
    const finalisées = offers.filter(o => o.statut === "finalisée");
    const valeurFinalisée  = finalisées.reduce((s, o) => s + o.montant, 0);
    const valeurEnCours    = offers.filter(o => ACTIVE_STATUSES.includes(o.statut)).reduce((s, o) => s + o.montant, 0);
    const nonAnnulées      = offers.filter(o => o.statut !== "annulée").length;
    const tauxConversion   = nonAnnulées === 0 ? 0 : Math.round((finalisées.length / nonAnnulées) * 100);
    return { total, actives, finalisées: finalisées.length, valeurFinalisée, valeurEnCours, tauxConversion };
  }, [offers]);

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return offers.filter(o => {
      if (q && !o.propTitle.toLowerCase().includes(q) && !o.prospectName.toLowerCase().includes(q) && !o.propRef.toLowerCase().includes(q)) return false;
      if (agentFlt && o.agentName !== agentFlt)       return false;
      if (statusFlt !== "all" && o.statut !== statusFlt) return false;
      return true;
    }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [offers, search, agentFlt, statusFlt]);

  // ── Live selected sync ─────────────────────────────────────────────────────
  const liveSelected = selected ? (offers.find(o => o.id === selected.id) ?? null) : null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFormSave = useCallback((form: FormState) => {
    if (editOffer) {
      updateOffer(editOffer.id, {
        montant: parseFloat(form.montant.replace(/\s/g, "")),
        commentaire: form.commentaire, agentName: form.agentName,
        prospectName: form.prospectName, prospectPhone: form.prospectPhone,
      }, "Offre modifiée");
      toast.success("Offre mise à jour");
    } else {
      addOffer({
        propId: form.propId, propTitle: form.propTitle, propRef: form.propRef,
        propImg: form.propImg, propPrice: form.propPrice, propTransaction: form.propTransaction,
        prospectName: form.prospectName, prospectPhone: form.prospectPhone,
        agentName: form.agentName,
        montant: parseFloat(form.montant.replace(/\s/g, "")),
        statut: "reçue", commentaire: form.commentaire,
      });
      pushNotif({
        type: "offre",
        title: "Nouvelle offre reçue",
        message: `${form.prospectName} propose ${new Intl.NumberFormat("fr-SN").format(parseFloat(form.montant.replace(/\s/g, "")))} FCFA pour ${form.propTitle}`,
        link: "/agence/offres",
      });
      toast.success(`Offre créée pour ${form.propTitle}`);
    }
    setFormOpen(false); setEditOffer(null);
  }, [editOffer]);

  const handleQuickAction = useCallback((target: OfferStatus, note: string) => {
    if (!quickAction) return;
    setOfferStatus(quickAction.offer.id, target, quickAction.offer.agentName, note || undefined);
    const o = quickAction.offer;
    if (target === "finalisée") {
      pushNotif({
        type: "transaction",
        title: "Transaction finalisée",
        message: `${o.propTitle} — ${o.propTransaction === "location" ? "bail signé" : "vente conclue"} pour ${o.prospectName}`,
        link: "/agence/offres",
      });
      toast.success("Transaction finalisée 🎉");
    } else if (target === "annulée") {
      toast.error("Offre annulée");
    } else {
      pushNotif({
        type: "statut",
        title: "Changement de statut",
        message: `Offre ${o.propTitle} — passage en ${OFFER_STATUS_CFG[target].label}`,
        link: "/agence/offres",
      });
      toast.success(OFFER_STATUS_CFG[target].label);
    }
    setQuickAction(null);
  }, [quickAction]);

  const handleDelete = useCallback((id: number) => {
    const o = offers.find(x => x.id === id);
    deleteOffer(id);
    setSelected(null);
    toast.error(`Offre "${o?.propTitle}" supprimée`);
  }, [offers]);

  const openEdit = (o: Offer) => { setEditOffer(o); setFormOpen(true); setSelected(null); };

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1C2E]" style={{ fontFamily: "'Playfair Display',serif" }}>Offres & Transactions</h1>
          <p className="text-gray-500 text-sm mt-0.5">{stats.actives} en cours · {stats.finalisées} finalisée{stats.finalisées !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setEditOffer(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-colors"
          style={{ background: GOLD }}>
          <Plus size={16}/>Nouvelle offre
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label:"Total offres",     value:stats.total,               icon:<BarChart3 size={18}/>,    color:NAVY      },
          { label:"En cours",         value:stats.actives,             icon:<Clock size={18}/>,         color:"#3B82F6" },
          { label:"Finalisées",       value:stats.finalisées,           icon:<Handshake size={18}/>,    color:"#16A34A" },
          { label:"Valeur finalisée", value:`${fmt(Math.round(stats.valeurFinalisée/1_000_000))} M`,   icon:<DollarSign size={18}/>, color:GOLD,      wide:true },
          { label:"Taux conversion",  value:`${stats.tauxConversion} %`,icon:<Percent size={18}/>,     color:"#7C3AED", wide:true },
        ].map(({ label, value, icon, color, wide }) => (
          <div key={label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: B }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}15`, color }}>
              {icon}
            </div>
            <div className="min-w-0">
              <div className={`font-bold truncate ${wide ? "text-base" : "text-2xl"}`}
                style={{ fontFamily: wide ? "'Plus Jakarta Sans',sans-serif" : "'DM Mono',monospace", color, fontSize: wide ? "1rem" : undefined }}>
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
            placeholder="Bien, prospect, référence…"
            className="pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none bg-white w-52"
            style={{ borderColor: B, color: NAVY }}/>
          {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={13}/></button>}
        </div>

        <select value={statusFlt} onChange={e => setStatusFlt(e.target.value as OfferStatus | "all")}
          className="px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none bg-white"
          style={{ borderColor: statusFlt !== "all" ? GOLD : B, color: NAVY }}>
          <option value="all">Tous les statuts</option>
          {OFFER_STATUS_ORDER.map(s => (
            <option key={s} value={s}>{OFFER_STATUS_CFG[s].label}</option>
          ))}
        </select>

        <select value={agentFlt} onChange={e => setAgentFlt(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none bg-white"
          style={{ borderColor: agentFlt ? GOLD : B, color: NAVY }}>
          <option value="">Tous les agents</option>
          {AGENTS.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
        </select>

        {(search || agentFlt || statusFlt !== "all") && (
          <button onClick={() => { setSearch(""); setAgentFlt(""); setStatusFlt("all"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
            style={{ borderColor: B, color: "#6B7280" }}>
            <RotateCcw size={11}/>Réinitialiser
          </button>
        )}

        <div className="flex gap-0.5 p-1 rounded-xl border bg-white ml-auto" style={{ borderColor: B }}>
          <button onClick={() => setView("kanban")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: view === "kanban" ? NAVY : "transparent", color: view === "kanban" ? "#fff" : "#9CA3AF" }}>
            <LayoutGrid size={13}/>Kanban
          </button>
          <button onClick={() => setView("liste")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: view === "liste" ? NAVY : "transparent", color: view === "liste" ? "#fff" : "#9CA3AF" }}>
            <List size={13}/>Liste
          </button>
        </div>
      </div>

      {/* Views */}
      {view === "kanban"
        ? <KanbanView offers={filtered} onSelect={setSelected}/>
        : <ListView
            offers={filtered}
            onSelect={setSelected}
            onStatusChange={(o, target) => {
              if (ACTION_CFGS[target]) setQuickAction({ offer: o, target });
              else { setOfferStatus(o.id, target, o.agentName); toast.success(OFFER_STATUS_CFG[target].label); }
            }}
            onDelete={handleDelete}
          />
      }

      {/* Detail panel */}
      {liveSelected && (
        <OfferDetail
          offer={liveSelected}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(liveSelected)}
          onDelete={() => handleDelete(liveSelected.id)}
        />
      )}

      {/* Form */}
      {formOpen && (
        <OfferForm
          title={editOffer ? `Modifier — ${editOffer.propTitle}` : "Nouvelle offre"}
          initial={editOffer ? offerToForm(editOffer) : BLANK}
          onSave={handleFormSave}
          onClose={() => { setFormOpen(false); setEditOffer(null); }}
        />
      )}

      {/* Quick action confirm (from list dropdown) */}
      {quickAction && ACTION_CFGS[quickAction.target] && (
        <ActionConfirmModal
          target={quickAction.target}
          offer={quickAction.offer}
          onConfirm={(note) => handleQuickAction(quickAction.target, note)}
          onClose={() => setQuickAction(null)}
        />
      )}
    </div>
  );
}
