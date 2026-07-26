import { useState, useMemo, useCallback } from "react";
import {
  Plus, ChevronLeft, ChevronRight, List, Calendar, Search, X,
  Clock, CheckCircle, XCircle, RotateCcw, Eye, Pencil, Trash2,
  Phone, MapPin, User, Home, Loader2, MessageSquare, Star,
  ArrowRight, MoreHorizontal, AlertTriangle,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import { NAVY, GOLD, B, AGENTS } from "../data";
import { useProperties, type StoreProp } from "./store";
import { pushNotif } from "./notificationsStore";

// ─── Types ────────────────────────────────────────────────────────────────────
export type VisitStatus = "planifiée" | "confirmée" | "effectuée" | "annulée" | "reportée";

export interface Visit {
  id: number;
  propId: number; propTitle: string; propRef: string; propImg: string;
  prospectName: string; prospectPhone: string;
  agentName: string;
  date: string; // "YYYY-MM-DD"
  heure: string; // "HH:MM"
  statut: VisitStatus;
  notes: string;
  feedback: string;
  createdAt: string;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<VisitStatus, { label:string; bg:string; text:string; dot:string; color:string }> = {
  planifiée: { label:"Planifiée", bg:"bg-blue-50",    text:"text-blue-700",    dot:"bg-blue-400",    color:"#3B82F6" },
  confirmée: { label:"Confirmée", bg:"bg-emerald-50", text:"text-emerald-700", dot:"bg-emerald-500", color:"#16A34A" },
  effectuée: { label:"Effectuée", bg:"bg-[#FDF6E7]",  text:"text-[#C9963A]",  dot:"bg-[#C9963A]",   color:GOLD      },
  annulée:   { label:"Annulée",   bg:"bg-red-50",     text:"text-red-600",     dot:"bg-red-400",     color:"#EF4444" },
  reportée:  { label:"Reportée",  bg:"bg-orange-50",  text:"text-orange-700",  dot:"bg-orange-400",  color:"#F97316" },
};

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR   = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

// ─── Mock data ────────────────────────────────────────────────────────────────
let _nextId = 20;
const nid = () => _nextId++;

const INIT_VISITS: Visit[] = [
  {
    id:1, propId:7, propTitle:"Villa Balnéaire Saly", propRef:"IS-2025-007",
    propImg:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=80&h=80&fit=crop",
    prospectName:"Oumar Sarr", prospectPhone:"+221 77 789 01 23",
    agentName:"Amadou Ba", date:"2026-07-18", heure:"15:00", statut:"effectuée",
    notes:"Client VIP — accueil soigné. A demandé des délais de réponse rapides.",
    feedback:"Client très enthousiaste. Souhaite formuler une offre. À relancer mardi matin.",
    createdAt:"2026-07-10",
  },
  {
    id:2, propId:3, propTitle:"Appartement Plateau Modern", propRef:"IS-2025-003",
    propImg:"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=80&h=80&fit=crop",
    prospectName:"Fatou Ndiaye", prospectPhone:"+221 76 456 78 90",
    agentName:"Fatou Diallo", date:"2026-07-17", heure:"10:00", statut:"annulée",
    notes:"Cliente indisponible en dernière minute.", feedback:"",
    createdAt:"2026-07-12",
  },
  {
    id:3, propId:9, propTitle:"Appartement Le Plateau", propRef:"IS-2025-009",
    propImg:"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=80&fit=crop",
    prospectName:"Cheikh Mbaye", prospectPhone:"+221 77 567 89 01",
    agentName:"Fatou Diallo", date:"2026-07-19", heure:"09:30", statut:"reportée",
    notes:"Demande de report — client en déplacement à Thiès.", feedback:"",
    createdAt:"2026-07-10",
  },
  {
    id:4, propId:1, propTitle:"Villa Contemporaine d'Exception", propRef:"IS-2025-001",
    propImg:"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=80&h=80&fit=crop",
    prospectName:"Moussa Diallo", prospectPhone:"+221 77 123 45 67",
    agentName:"Amadou Ba", date:"2026-07-20", heure:"10:00", statut:"confirmée",
    notes:"Visite avec son épouse. Prévoir 1h30. Accès piscine souhaité.",
    feedback:"",
    createdAt:"2026-07-15",
  },
  {
    id:5, propId:2, propTitle:"Duplex Prestige Vue Mer", propRef:"IS-2025-002",
    propImg:"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=80&fit=crop",
    prospectName:"Rokhaya Diop", prospectPhone:"+221 78 678 90 12",
    agentName:"Ousmane Ndiaye", date:"2026-07-20", heure:"14:30", statut:"planifiée",
    notes:"Intéressée par la vue mer. Demande de photos supplémentaires envoyées.", feedback:"",
    createdAt:"2026-07-16",
  },
  {
    id:6, propId:4, propTitle:"Villa Moderne Yoff", propRef:"IS-2025-004",
    propImg:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=80&h=80&fit=crop",
    prospectName:"Ibrahima Fall", prospectPhone:"+221 77 345 67 89",
    agentName:"Amadou Ba", date:"2026-07-22", heure:"09:00", statut:"planifiée",
    notes:"Investisseur — focus sur le rendement locatif et le standing.", feedback:"",
    createdAt:"2026-07-16",
  },
  {
    id:7, propId:10, propTitle:"Appartement Vue Yoff", propRef:"IS-2025-010",
    propImg:"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=80&h=80&fit=crop",
    prospectName:"Aminata Sow", prospectPhone:"+221 78 234 56 78",
    agentName:"Fatou Diallo", date:"2026-07-24", heure:"11:00", statut:"confirmée",
    notes:"Recherche location longue durée, bail 12 mois minimum.", feedback:"",
    createdAt:"2026-07-17",
  },
  {
    id:8, propId:16, propTitle:"Terrain Mbour Bord de Mer", propRef:"IS-2025-016",
    propImg:"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=80&h=80&fit=crop",
    prospectName:"Ndéye Diallo", prospectPhone:"+221 76 890 12 34",
    agentName:"Ousmane Ndiaye", date:"2026-07-26", heure:"16:00", statut:"planifiée",
    notes:"Projet de construction d'une résidence balnéaire.", feedback:"",
    createdAt:"2026-07-18",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pad2(n: number) { return String(n).padStart(2, "0"); }
function dateStr(y: number, m: number, d: number) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }
function formatDate(s: string) {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("fr-SN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
}
function shortDate(s: string) {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("fr-SN", { day:"numeric", month:"short" });
}
function buildCells(year: number, month: number): (number | null)[] {
  const first   = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const days    = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
const todayISO = new Date().toISOString().split("T")[0];

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: VisitStatus }) {
  const s = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
    </span>
  );
}

// ─── VisitForm ────────────────────────────────────────────────────────────────
interface FormState {
  propId: number; propTitle: string; propRef: string; propImg: string;
  prospectName: string; prospectPhone: string;
  agentName: string; date: string; heure: string; notes: string;
}
const BLANK: FormState = {
  propId:0, propTitle:"", propRef:"", propImg:"",
  prospectName:"", prospectPhone:"", agentName:"", date:"", heure:"", notes:"",
};

function visitToForm(v: Visit): FormState {
  return { propId:v.propId, propTitle:v.propTitle, propRef:v.propRef, propImg:v.propImg,
    prospectName:v.prospectName, prospectPhone:v.prospectPhone,
    agentName:v.agentName, date:v.date, heure:v.heure, notes:v.notes };
}

function VisitForm({ title, initial, properties, onSave, onClose }: {
  title:string; initial:FormState; properties:StoreProp[];
  onSave:(f:FormState)=>void; onClose:()=>void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const upd = (p: Partial<FormState>) => setForm(f => ({ ...f, ...p }));
  const clrErr = (k: keyof FormState) => setErrors(e => ({ ...e, [k]:"" }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.propTitle)     e.propTitle     = "Sélectionnez un bien";
    if (!form.prospectName.trim()) e.prospectName = "Le nom du prospect est requis";
    if (!form.prospectPhone.trim()) e.prospectPhone = "Le téléphone est requis";
    if (!form.agentName)     e.agentName     = "Sélectionnez un agent";
    if (!form.date)          e.date          = "La date est requise";
    if (!form.heure)         e.heure         = "L'heure est requise";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => { setSuccess(true); setTimeout(() => onSave(form), 600); }, 500);
  };

  const ic  = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#C9963A]/30 transition-all bg-white";
  const sty = (k: keyof FormState) => errors[k]
    ? { borderColor:"#F87171", boxShadow:"0 0 0 3px rgba(248,113,113,0.2)", color:NAVY }
    : { borderColor:B, color:NAVY };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {success && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <p className="font-bold text-[#0F1C2E]" style={{ fontFamily:"'Playfair Display',serif" }}>
              {title.includes("Modifier") ? "Visite mise à jour" : "Visite planifiée !"}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor:B }}>
          <h3 className="font-bold text-[#0F1C2E] text-lg" style={{ fontFamily:"'Playfair Display',serif" }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"><X size={16}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Bien */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Bien immobilier *</label>
            <select className={ic} style={sty("propTitle")}
              value={form.propId || ""}
              onChange={e => {
                const p = properties.find(x => x.id === Number(e.target.value));
                if (p) upd({ propId:p.id, propTitle:p.title, propRef:p.ref, propImg:p.img });
                else   upd({ propId:0, propTitle:"", propRef:"", propImg:"" });
                clrErr("propTitle");
              }}>
              <option value="">— Choisir un bien —</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.title} · {p.ref}</option>
              ))}
            </select>
            {errors.propTitle && <p className="text-xs text-red-500 mt-1">⚠ {errors.propTitle}</p>}
          </div>

          {/* Prospect */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Prospect — Nom *</label>
              <input className={ic} style={sty("prospectName")}
                value={form.prospectName} placeholder="Prénom Nom"
                onChange={e => { upd({prospectName:e.target.value}); clrErr("prospectName"); }} />
              {errors.prospectName && <p className="text-xs text-red-500 mt-1">⚠ {errors.prospectName}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone *</label>
              <input className={ic} style={sty("prospectPhone")}
                value={form.prospectPhone} placeholder="+221 77 000 00 00"
                onChange={e => { upd({prospectPhone:e.target.value}); clrErr("prospectPhone"); }} />
              {errors.prospectPhone && <p className="text-xs text-red-500 mt-1">⚠ {errors.prospectPhone}</p>}
            </div>
          </div>

          {/* Agent */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Agent responsable *</label>
            <select className={ic} style={sty("agentName")}
              value={form.agentName}
              onChange={e => { upd({agentName:e.target.value}); clrErr("agentName"); }}>
              <option value="">— Sélectionner un agent —</option>
              {AGENTS.map(a => <option key={a.name} value={a.name}>{a.name} · {a.title}</option>)}
            </select>
            {errors.agentName && <p className="text-xs text-red-500 mt-1">⚠ {errors.agentName}</p>}
          </div>

          {/* Date + Heure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date *</label>
              <input type="date" className={ic} style={sty("date")}
                value={form.date}
                onChange={e => { upd({date:e.target.value}); clrErr("date"); }} />
              {errors.date && <p className="text-xs text-red-500 mt-1">⚠ {errors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Heure *</label>
              <input type="time" className={ic} style={sty("heure")}
                value={form.heure}
                onChange={e => { upd({heure:e.target.value}); clrErr("heure"); }} />
              {errors.heure && <p className="text-xs text-red-500 mt-1">⚠ {errors.heure}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Notes (optionnel)</label>
            <textarea rows={3} className={`${ic} resize-none`} style={{ borderColor:B, color:NAVY }}
              value={form.notes} placeholder="Informations particulières, accès, demandes du prospect…"
              onChange={e => upd({notes:e.target.value})} />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor:B }}>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-gray-50"
            style={{ borderColor:B, color:NAVY }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={submitting || success}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background:GOLD }}>
            {submitting ? <><Loader2 size={14} className="animate-spin" />Enregistrement…</> : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RescheduleModal ──────────────────────────────────────────────────────────
function RescheduleModal({ visit, onConfirm, onClose }: {
  visit: Visit; onConfirm:(date:string, heure:string, note:string)=>void; onClose:()=>void;
}) {
  const [date,  setDate]  = useState("");
  const [heure, setHeure] = useState(visit.heure);
  const [note,  setNote]  = useState("");
  const [errors, setErrors] = useState<{date?:string; heure?:string}>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!date)  e.date  = "La date est requise";
    if (!heure) e.heure = "L'heure est requise";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const ic = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#C9963A]/30 transition-all bg-white";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor:B }}>
          <h3 className="font-bold text-[#0F1C2E]" style={{ fontFamily:"'Playfair Display',serif" }}>Reporter la visite</h3>
          <p className="text-xs text-gray-400 mt-1">
            Date actuelle : <strong>{shortDate(visit.date)}</strong> à <strong>{visit.heure}</strong>
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">La visite actuelle sera marquée <strong>Reportée</strong> et replanifiée à la nouvelle date.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nouvelle date *</label>
              <input type="date" className={ic}
                style={errors.date ? { borderColor:"#F87171", color:NAVY } : { borderColor:B, color:NAVY }}
                value={date} onChange={e => { setDate(e.target.value); setErrors(er=>({...er,date:""})); }} />
              {errors.date && <p className="text-xs text-red-500 mt-1">⚠ {errors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Heure *</label>
              <input type="time" className={ic}
                style={errors.heure ? { borderColor:"#F87171", color:NAVY } : { borderColor:B, color:NAVY }}
                value={heure} onChange={e => { setHeure(e.target.value); setErrors(er=>({...er,heure:""})); }} />
              {errors.heure && <p className="text-xs text-red-500 mt-1">⚠ {errors.heure}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Motif du report (optionnel)</label>
            <input className={ic} style={{ borderColor:B, color:NAVY }}
              value={note} placeholder="Ex: Client indisponible, retard de livraison…"
              onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm border"
            style={{ borderColor:B, color:NAVY }}>Annuler</button>
          <button onClick={() => { if (validate()) onConfirm(date, heure, note); }}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background:GOLD }}>Confirmer le report</button>
        </div>
      </div>
    </div>
  );
}

// ─── VisitDetail ──────────────────────────────────────────────────────────────
function VisitDetail({ visit, onClose, onEdit, onStatusChange, onReschedule, onFeedback, onDelete }: {
  visit: Visit; onClose:()=>void; onEdit:()=>void;
  onStatusChange:(status:VisitStatus)=>void;
  onReschedule:()=>void;
  onFeedback:(text:string)=>void;
  onDelete:()=>void;
}) {
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [feedbackMode,  setFeedbackMode]  = useState(false);
  const [feedbackText,  setFeedbackText]  = useState(visit.feedback);
  const [fbSubmitting,  setFbSubmitting]  = useState(false);

  const agent = AGENTS.find(a => a.name === visit.agentName);
  const st    = STATUS_CFG[visit.statut];

  const submitFeedback = () => {
    if (!feedbackText.trim()) return;
    setFbSubmitting(true);
    setTimeout(() => {
      onFeedback(feedbackText.trim());
      setFeedbackMode(false);
      setFbSubmitting(false);
      toast.success("Feedback enregistré");
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:w-[420px] h-[90vh] sm:h-[92vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b shrink-0" style={{ borderColor:B }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                <img src={visit.propImg} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#0F1C2E] leading-tight">{visit.propTitle}</p>
                <p className="text-[11px] font-mono text-gray-400">{visit.propRef}</p>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              {!deleteConfirm && !cancelConfirm && (
                <>
                  <button onClick={onEdit}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#C9963A] hover:bg-[#FDF6E7] transition-colors" title="Modifier">
                    <Pencil size={14}/>
                  </button>
                  <button onClick={() => setDeleteConfirm(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Supprimer">
                    <Trash2 size={14}/>
                  </button>
                </>
              )}
              {deleteConfirm && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-red-500 font-semibold">Supprimer ?</span>
                  <button onClick={() => { onDelete(); }} className="px-2 py-1 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600">Oui</button>
                  <button onClick={() => setDeleteConfirm(false)} className="px-2 py-1 rounded-lg text-xs font-bold border" style={{ borderColor:B, color:NAVY }}>Non</button>
                </div>
              )}
              <button onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X size={16}/>
              </button>
            </div>
          </div>

          {/* Date/time + status */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#0F1C2E]">
                <Calendar size={14} style={{ color:GOLD }} />
                {shortDate(visit.date)}
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                <Clock size={13} className="text-gray-400" />
                {visit.heure}
              </div>
            </div>
            <StatusBadge status={visit.statut} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Prospect */}
          <div className="rounded-xl border p-4 space-y-2" style={{ borderColor:B }}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Prospect</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background:NAVY }}>
                  {visit.prospectName.split(" ").map(w=>w[0]).join("")}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#0F1C2E]">{visit.prospectName}</p>
                  <p className="text-xs text-gray-500">{visit.prospectPhone}</p>
                </div>
              </div>
              <a href={`tel:${visit.prospectPhone}`}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background:`${GOLD}15`, color:GOLD }}>
                <Phone size={14}/>
              </a>
            </div>
          </div>

          {/* Agent */}
          {agent && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl border" style={{ borderColor:B }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background:NAVY }}>
                {agent.avatar}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-[#0F1C2E]">{agent.name}</p>
                <p className="text-[11px] text-gray-400">{agent.title}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${GOLD}15`, color:GOLD }}>Agent</span>
            </div>
          )}

          {/* Notes */}
          {visit.notes && (
            <div className="p-3.5 rounded-xl border" style={{ borderColor:B, background:"#FAFAF9" }}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{visit.notes}</p>
            </div>
          )}

          {/* Feedback section */}
          {visit.statut === "effectuée" && (
            <div className="p-3.5 rounded-xl border" style={{ borderColor:`${GOLD}30`, background:`${GOLD}06` }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color:GOLD }}>
                Compte-rendu de visite
              </p>
              {visit.feedback && !feedbackMode ? (
                <>
                  <p className="text-sm text-gray-700 leading-relaxed">"{visit.feedback}"</p>
                  <button onClick={() => setFeedbackMode(true)}
                    className="text-xs font-bold mt-2" style={{ color:GOLD }}>
                    Modifier le feedback
                  </button>
                </>
              ) : feedbackMode ? (
                <div className="space-y-2">
                  <textarea rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none bg-white"
                    style={{ borderColor:B, color:NAVY }}
                    value={feedbackText}
                    placeholder="Compte-rendu, impressions, prochaines étapes…"
                    onChange={e => setFeedbackText(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={() => { setFeedbackMode(false); setFeedbackText(visit.feedback); }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border" style={{ borderColor:B, color:NAVY }}>
                      Annuler
                    </button>
                    <button onClick={submitFeedback} disabled={!feedbackText.trim() || fbSubmitting}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 flex items-center justify-center gap-1"
                      style={{ background:GOLD }}>
                      {fbSubmitting ? <Loader2 size={11} className="animate-spin"/> : null}Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setFeedbackMode(true)}
                  className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-dashed transition-colors"
                  style={{ borderColor:`${GOLD}40`, color:GOLD }}>
                  <Plus size={12}/>Ajouter un compte-rendu
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-5 py-4 border-t space-y-2 shrink-0" style={{ borderColor:B }}>

          {/* Cancel confirm inline */}
          {cancelConfirm ? (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-700 flex-1">Confirmer l'annulation de cette visite ?</p>
              <button onClick={() => { onStatusChange("annulée"); setCancelConfirm(false); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
                Confirmer
              </button>
              <button onClick={() => setCancelConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={{ borderColor:B, color:NAVY }}>
                Non
              </button>
            </div>
          ) : (
            <>
              {visit.statut === "planifiée" && (
                <div className="flex gap-2">
                  <button onClick={() => onStatusChange("confirmée")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                    style={{ background:"#16A34A" }}>
                    <CheckCircle size={15}/>Confirmer
                  </button>
                  <button onClick={() => setCancelConfirm(true)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    style={{ background:"#FEE2E2", color:"#EF4444" }}>
                    <XCircle size={15}/>Annuler
                  </button>
                </div>
              )}

              {visit.statut === "confirmée" && (
                <div className="space-y-2">
                  <button onClick={() => onStatusChange("effectuée")}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                    style={{ background:GOLD }}>
                    <CheckCircle size={15}/>Marquer comme effectuée
                  </button>
                  <div className="flex gap-2">
                    <button onClick={onReschedule}
                      className="flex-1 py-2 rounded-xl text-sm font-bold border flex items-center justify-center gap-1.5"
                      style={{ borderColor:B, color:NAVY }}>
                      <RotateCcw size={14}/>Reporter
                    </button>
                    <button onClick={() => setCancelConfirm(true)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
                      style={{ background:"#FEE2E2", color:"#EF4444" }}>
                      <XCircle size={14}/>Annuler
                    </button>
                  </div>
                </div>
              )}

              {visit.statut === "reportée" && (
                <button onClick={onReschedule}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background:NAVY }}>
                  <RotateCcw size={15}/>Replanifier la visite
                </button>
              )}

              {visit.statut === "annulée" && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400">
                  <XCircle size={14}/>Cette visite a été annulée
                </div>
              )}

              {visit.statut === "effectuée" && !feedbackMode && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-emerald-600 font-semibold">
                  <CheckCircle size={14}/>Visite effectuée avec succès
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CalendarView ─────────────────────────────────────────────────────────────
function CalendarView({ visits, year, month, onPrev, onNext, onSelect, onAddDate }: {
  visits:Visit[]; year:number; month:number;
  onPrev:()=>void; onNext:()=>void;
  onSelect:(v:Visit)=>void; onAddDate:(d:string)=>void;
}) {
  const cells = buildCells(year, month);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor:B }}>
      {/* Month nav */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:B }}>
        <button onClick={onPrev} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ChevronLeft size={16}/>
        </button>
        <h2 className="font-bold text-[#0F1C2E]" style={{ fontFamily:"'Playfair Display',serif" }}>
          {MONTHS_FR[month]} {year}
        </h2>
        <button onClick={onNext} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ChevronRight size={16}/>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor:B }}>
        {DAYS_FR.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 divide-x divide-y" style={{ borderColor:B }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="min-h-[90px] bg-gray-50/50" />;

          const ds  = dateStr(year, month, day);
          const dvs = visits.filter(v => v.date === ds);
          const isToday = ds === todayISO;
          const isPast  = ds < todayISO;

          return (
            <div key={i}
              className="min-h-[90px] p-1.5 cursor-pointer hover:bg-[#FDF6E7]/40 transition-colors group"
              style={{ background: isPast && !isToday ? "#FAFAF9" : undefined }}
              onClick={() => !dvs.length && onAddDate(ds)}>
              {/* Day number */}
              <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "text-white" : isPast ? "text-gray-400" : "text-[#0F1C2E]"}`}
                style={{ background: isToday ? GOLD : undefined }}>
                {day}
              </div>
              {/* Visit chips */}
              <div className="space-y-0.5">
                {dvs.slice(0, 2).map(v => (
                  <button key={v.id}
                    onClick={e => { e.stopPropagation(); onSelect(v); }}
                    className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-semibold truncate leading-tight transition-opacity hover:opacity-80"
                    style={{ background:`${STATUS_CFG[v.statut].color}20`, color:STATUS_CFG[v.statut].color }}>
                    {v.heure} {v.prospectName.split(" ")[0]}
                  </button>
                ))}
                {dvs.length > 2 && (
                  <button
                    onClick={e => { e.stopPropagation(); onSelect(dvs[2]); }}
                    className="w-full text-left px-1.5 text-[9px] text-gray-400 font-semibold">
                    +{dvs.length - 2} de plus
                  </button>
                )}
                {dvs.length === 0 && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-full text-center py-0.5 text-[9px] text-gray-300 border border-dashed border-gray-200 rounded">
                      + Ajouter
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ListView ─────────────────────────────────────────────────────────────────
function ListView({ visits, onSelect, onStatusChange, onReschedule, onDelete }: {
  visits:Visit[]; onSelect:(v:Visit)=>void;
  onStatusChange:(id:number, s:VisitStatus)=>void;
  onReschedule:(v:Visit)=>void;
  onDelete:(id:number)=>void;
}) {
  if (!visits.length) return (
    <div className="bg-white rounded-2xl border py-16 text-center" style={{ borderColor:B }}>
      <Calendar size={28} className="mx-auto mb-3 opacity-20" />
      <p className="text-gray-400 text-sm">Aucune visite pour ces filtres</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor:B }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor:B, background:"#F8F6F2" }}>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Bien</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Prospect</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Agent</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Date & Heure</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Statut</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor:B }}>
            {visits.map(v => {
              const agent = AGENTS.find(a => a.name === v.agentName);
              return (
                <tr key={v.id} className="hover:bg-[#F8F6F2] transition-colors cursor-pointer" onClick={() => onSelect(v)}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={v.propImg} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 bg-gray-100" />
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F1C2E] truncate max-w-[150px]">{v.propTitle}</p>
                        <p className="text-[10px] font-mono text-gray-400">{v.propRef}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <p className="font-semibold text-sm text-[#0F1C2E]">{v.prospectName}</p>
                    <p className="text-xs text-gray-400">{v.prospectPhone}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    {agent ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background:NAVY }}>
                          {agent.avatar}
                        </div>
                        <span className="text-xs text-gray-600 truncate max-w-[90px]">{agent.name}</span>
                      </div>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-sm text-[#0F1C2E]">{shortDate(v.date)}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10}/>{v.heure}</p>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={v.statut}/></td>
                  <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => onSelect(v)}
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
                            className="bg-white rounded-2xl border shadow-xl z-50 min-w-[180px] py-1.5 overflow-hidden" style={{ borderColor:B }}>
                            {v.statut === "planifiée" && (
                              <DropdownMenu.Item onSelect={() => onStatusChange(v.id, "confirmée")}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                                <CheckCircle size={13} className="text-emerald-500"/>Confirmer
                              </DropdownMenu.Item>
                            )}
                            {(v.statut === "planifiée" || v.statut === "confirmée") && (
                              <DropdownMenu.Item onSelect={() => onStatusChange(v.id, "effectuée")}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                                <Star size={13} style={{ color:GOLD }}/>Marquer effectuée
                              </DropdownMenu.Item>
                            )}
                            {(v.statut === "planifiée" || v.statut === "confirmée" || v.statut === "reportée") && (
                              <DropdownMenu.Item onSelect={() => onReschedule(v)}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                                <RotateCcw size={13} className="text-orange-500"/>Reporter
                              </DropdownMenu.Item>
                            )}
                            {(v.statut === "planifiée" || v.statut === "confirmée") && (
                              <DropdownMenu.Item onSelect={() => onStatusChange(v.id, "annulée")}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-red-50 text-red-500 outline-none">
                                <XCircle size={13}/>Annuler
                              </DropdownMenu.Item>
                            )}
                            <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
                            <DropdownMenu.Item onSelect={() => onDelete(v.id)}
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
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VisitesPage() {
  const properties = useProperties();

  const [visits,    setVisits]    = useState<Visit[]>(INIT_VISITS);
  const [view,      setView]      = useState<"calendrier"|"liste">("calendrier");
  const [calMonth,  setCalMonth]  = useState(new Date().getMonth());
  const [calYear,   setCalYear]   = useState(new Date().getFullYear());
  const [search,    setSearch]    = useState("");
  const [statusFlt, setStatusFlt] = useState<VisitStatus|"all">("all");
  const [agentFlt,  setAgentFlt]  = useState("");

  const [selected,  setSelected]  = useState<Visit | null>(null);
  const [formOpen,  setFormOpen]  = useState(false);
  const [editVisit, setEditVisit] = useState<Visit | null>(null);
  const [rescheduleV, setRescheduleV] = useState<Visit | null>(null);
  const [defaultDate, setDefaultDate] = useState("");

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = visits;
    if (search.trim()) r = r.filter(v =>
      v.propTitle.toLowerCase().includes(search.toLowerCase()) ||
      v.prospectName.toLowerCase().includes(search.toLowerCase()) ||
      v.propRef.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFlt !== "all") r = r.filter(v => v.statut === statusFlt);
    if (agentFlt)            r = r.filter(v => v.agentName === agentFlt);
    return r.sort((a, b) => a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure));
  }, [visits, search, statusFlt, agentFlt]);

  const thisMonthStr = `${calYear}-${pad2(calMonth + 1)}`;
  const stats = useMemo(() => ({
    total:     visits.filter(v => v.date.startsWith(thisMonthStr)).length,
    avenir:    visits.filter(v => (v.statut === "planifiée" || v.statut === "confirmée") && v.date >= todayISO).length,
    effectuée: visits.filter(v => v.statut === "effectuée").length,
    annulée:   visits.filter(v => v.statut === "annulée").length,
  }), [visits, thisMonthStr]);

  // ── State helpers ──────────────────────────────────────────────────────────
  const patchVisit = useCallback((id: number, patch: Partial<Visit>) => {
    setVisits(vs => vs.map(v => v.id === id ? { ...v, ...patch } : v));
    setSelected(prev => prev?.id === id ? { ...prev, ...patch } : prev);
  }, []);

  const handleStatusChange = useCallback((id: number, statut: VisitStatus) => {
    patchVisit(id, { statut });
    const labels: Record<VisitStatus, string> = {
      confirmée:"Visite confirmée ✓", effectuée:"Visite marquée effectuée",
      annulée:"Visite annulée", reportée:"Visite reportée", planifiée:"Visite replanifiée",
    };
    if (statut === "confirmée") {
      const v = visits.find(x => x.id === id);
      if (v) pushNotif({
        type: "visite_confirmée",
        title: "Visite confirmée",
        message: `La visite de ${v.prospectName} pour ${v.propTitle} est confirmée le ${v.date}`,
        link: "/agence/visites",
      });
    }
    if (statut === "annulée") toast.error(labels[statut]);
    else toast.success(labels[statut]);
  }, [patchVisit, visits]);

  const handleReschedule = useCallback((id: number, date: string, heure: string, note: string) => {
    const src = visits.find(v => v.id === id);
    const addNote = note ? `\nReport du ${src ? shortDate(src.date) : ""} au ${shortDate(date)} — ${note}` : "";
    patchVisit(id, {
      date, heure, statut: "planifiée",
      notes: (src?.notes ?? "") + addNote,
    });
    setRescheduleV(null);
    toast.success(`Visite replanifiée au ${shortDate(date)} à ${heure}`);
  }, [visits, patchVisit]);

  const handleFeedback = useCallback((id: number, text: string) => {
    patchVisit(id, { feedback: text });
  }, [patchVisit]);

  const handleDelete = useCallback((id: number) => {
    const name = visits.find(v => v.id === id)?.prospectName ?? "";
    setVisits(vs => vs.filter(v => v.id !== id));
    setSelected(null);
    toast.error(`Visite de "${name}" supprimée`);
  }, [visits]);

  const handleFormSave = useCallback((form: FormState) => {
    if (!editVisit) {
      pushNotif({
        type: "visite_demande",
        title: "Nouvelle demande de visite",
        message: `${form.prospectName} souhaite visiter ${form.propTitle} le ${form.date} à ${form.heure}`,
        link: "/agence/visites",
      });
    }
    if (editVisit) {
      patchVisit(editVisit.id, {
        propId:form.propId, propTitle:form.propTitle, propRef:form.propRef, propImg:form.propImg,
        prospectName:form.prospectName, prospectPhone:form.prospectPhone,
        agentName:form.agentName, date:form.date, heure:form.heure, notes:form.notes,
      });
      setFormOpen(false); setEditVisit(null);
    } else {
      const nv: Visit = {
        id:nid(), propId:form.propId, propTitle:form.propTitle, propRef:form.propRef, propImg:form.propImg,
        prospectName:form.prospectName, prospectPhone:form.prospectPhone,
        agentName:form.agentName, date:form.date, heure:form.heure,
        statut:"planifiée", notes:form.notes, feedback:"",
        createdAt:todayISO,
      };
      setVisits(vs => [...vs, nv]);
      // Navigate calendar to the new visit's month
      const d = new Date(form.date + "T00:00:00");
      setCalMonth(d.getMonth()); setCalYear(d.getFullYear());
      setFormOpen(false);
      toast.success(`Visite planifiée — ${form.propTitle} · ${shortDate(form.date)} à ${form.heure}`);
    }
  }, [editVisit, patchVisit]);

  const openEdit = () => {
    if (!selected) return;
    setEditVisit(selected);
    setFormOpen(true);
    setSelected(null);
  };

  const openAdd = (date = "") => {
    setEditVisit(null);
    setDefaultDate(date);
    setFormOpen(true);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1C2E]" style={{ fontFamily:"'Playfair Display',serif" }}>Visites</h1>
          <p className="text-gray-500 text-sm mt-0.5">{stats.avenir} visite{stats.avenir!==1?"s":""} à venir · {stats.total} ce mois</p>
        </div>
        <button onClick={() => openAdd()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-colors"
          style={{ background:GOLD }}>
          <Plus size={16}/>Nouvelle visite
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label:"Ce mois",   value:stats.total,    color:NAVY,      icon:<Calendar size={18}/> },
          { label:"À venir",   value:stats.avenir,   color:"#3B82F6", icon:<Clock size={18}/> },
          { label:"Effectuées",value:stats.effectuée,color:GOLD,      icon:<CheckCircle size={18}/> },
          { label:"Annulées",  value:stats.annulée,  color:"#EF4444", icon:<XCircle size={18}/> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor:B }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background:`${color}15`, color }}>
              {icon}
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ fontFamily:"'DM Mono',monospace", color }}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Bien, prospect, référence…"
            className="pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none bg-white w-52"
            style={{ borderColor:B, color:NAVY }}/>
          {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={13}/></button>}
        </div>

        {/* Status filter */}
        <select value={statusFlt} onChange={e => setStatusFlt(e.target.value as VisitStatus|"all")}
          className="px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none bg-white"
          style={{ borderColor: statusFlt !== "all" ? GOLD : B, color:NAVY }}>
          <option value="all">Tous les statuts</option>
          {(Object.keys(STATUS_CFG) as VisitStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CFG[s].label}</option>
          ))}
        </select>

        {/* Agent filter */}
        <select value={agentFlt} onChange={e => setAgentFlt(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none bg-white"
          style={{ borderColor: agentFlt ? GOLD : B, color:NAVY }}>
          <option value="">Tous les agents</option>
          {AGENTS.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
        </select>

        {/* Reset */}
        {(search || statusFlt !== "all" || agentFlt) && (
          <button onClick={() => { setSearch(""); setStatusFlt("all"); setAgentFlt(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-500"
            style={{ borderColor:B, color:"#6B7280" }}>
            <RotateCcw size={11}/>Réinitialiser
          </button>
        )}

        {/* View toggle */}
        <div className="flex gap-0.5 p-1 rounded-xl border bg-white ml-auto" style={{ borderColor:B }}>
          <button onClick={() => setView("calendrier")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background:view==="calendrier"?NAVY:"transparent", color:view==="calendrier"?"#fff":"#9CA3AF" }}>
            <Calendar size={13}/>Calendrier
          </button>
          <button onClick={() => setView("liste")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background:view==="liste"?NAVY:"transparent", color:view==="liste"?"#fff":"#9CA3AF" }}>
            <List size={13}/>Liste
          </button>
        </div>
      </div>

      {/* Views */}
      {view === "calendrier" ? (
        <CalendarView
          visits={filtered}
          year={calYear} month={calMonth}
          onPrev={prevMonth} onNext={nextMonth}
          onSelect={v => setSelected(v)}
          onAddDate={ds => openAdd(ds)}
        />
      ) : (
        <ListView
          visits={filtered}
          onSelect={v => setSelected(v)}
          onStatusChange={handleStatusChange}
          onReschedule={v => setRescheduleV(v)}
          onDelete={handleDelete}
        />
      )}

      {/* Detail panel */}
      {selected && (() => {
        const live = visits.find(v => v.id === selected.id);
        if (!live) return null;
        return (
          <VisitDetail
            visit={live}
            onClose={() => setSelected(null)}
            onEdit={openEdit}
            onStatusChange={(s) => handleStatusChange(live.id, s)}
            onReschedule={() => setRescheduleV(live)}
            onFeedback={(t) => handleFeedback(live.id, t)}
            onDelete={() => handleDelete(live.id)}
          />
        );
      })()}

      {/* Form modal */}
      {formOpen && (
        <VisitForm
          title={editVisit ? "Modifier la visite" : "Nouvelle visite"}
          initial={editVisit ? visitToForm(editVisit) : { ...BLANK, date:defaultDate }}
          properties={properties}
          onSave={handleFormSave}
          onClose={() => { setFormOpen(false); setEditVisit(null); }}
        />
      )}

      {/* Reschedule modal */}
      {rescheduleV && (
        <RescheduleModal
          visit={rescheduleV}
          onConfirm={(d, h, n) => handleReschedule(rescheduleV.id, d, h, n)}
          onClose={() => setRescheduleV(null)}
        />
      )}
    </div>
  );
}
