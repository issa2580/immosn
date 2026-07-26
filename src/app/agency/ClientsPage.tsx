import { useState, useMemo, useRef, useCallback } from "react";
import {
  Search, Phone, Mail, Calendar, X, Star, Plus, LayoutGrid, List,
  ChevronRight, ChevronLeft, Loader2, Clock, CheckCircle, MessageSquare,
  User, Trash2, Pencil, History, StickyNote, MapPin, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { NAVY, GOLD, B, AGENTS } from "../data";
import { pushNotif } from "./notificationsStore";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Stage = "nouveau" | "contacté" | "qualifié" | "visite" | "offre" | "gagné" | "perdu";
type PType = "Acheteur" | "Locataire" | "Investisseur";
type PStatus = "actif" | "prospect" | "inactif";

interface Note { id: number; text: string; date: string; author: string }
interface HistEvent { id: number; event: string; date: string; by?: string; type?: string }

interface Prospect {
  id: number; name: string; phone: string; email: string;
  type: PType; status: PStatus; stage: Stage;
  date: string; note: number; biens: number;
  agentName: string; budget: string;
  notes: Note[]; history: HistEvent[];
}

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGES: { key: Stage; label: string; color: string; bg: string; dot: string; border: string }[] = [
  { key:"nouveau",   label:"Nouveau",          color:"#6B7280", bg:"bg-gray-50",    dot:"bg-gray-400",    border:"#6B728030" },
  { key:"contacté",  label:"Contacté",          color:"#3B82F6", bg:"bg-blue-50",    dot:"bg-blue-500",    border:"#3B82F630" },
  { key:"qualifié",  label:"Qualifié",          color:"#8B5CF6", bg:"bg-purple-50",  dot:"bg-purple-500",  border:"#8B5CF630" },
  { key:"visite",    label:"Visite planifiée",   color:GOLD,      bg:"bg-[#FDF6E7]", dot:"bg-[#C9963A]",   border:`${GOLD}40` },
  { key:"offre",     label:"Offre",             color:"#F97316", bg:"bg-orange-50",  dot:"bg-orange-500",  border:"#F9731630" },
  { key:"gagné",     label:"Gagné ✓",           color:"#16A34A", bg:"bg-emerald-50", dot:"bg-emerald-500", border:"#16A34A40" },
  { key:"perdu",     label:"Perdu",             color:"#EF4444", bg:"bg-red-50",     dot:"bg-red-400",     border:"#EF444430" },
];
const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s])) as Record<Stage, typeof STAGES[0]>;
const PIPELINE_STAGES = STAGES.filter(s => s.key !== "gagné" && s.key !== "perdu");

const STATUS_CFG: Record<PStatus, { label:string; bg:string; text:string }> = {
  actif:    { label:"Actif",    bg:"bg-emerald-50", text:"text-emerald-700" },
  prospect: { label:"Prospect", bg:"bg-amber-50",   text:"text-amber-700"   },
  inactif:  { label:"Inactif",  bg:"bg-gray-100",   text:"text-gray-500"    },
};
const TYPE_CFG: Record<PType, { bg:string; text:string }> = {
  Acheteur:     { bg:"bg-blue-50",   text:"text-blue-700"   },
  Locataire:    { bg:"bg-purple-50", text:"text-purple-700"  },
  Investisseur: { bg:"bg-[#FDF6E7]", text:"text-[#C9963A]"   },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
let _nextNoteId = 20;
function nid() { return _nextNoteId++; }

const INIT: Prospect[] = [
  {
    id:1, name:"Moussa Diallo", phone:"+221 77 123 45 67", email:"m.diallo@email.com",
    type:"Acheteur", status:"actif", stage:"qualifié",
    date:"10 juin 2025", note:5, biens:2, agentName:"Amadou Ba", budget:"80 – 120 M FCFA",
    notes:[{ id:nid(), text:"Très intéressé par les villas aux Almadies avec piscine. Budget confirmé.", date:"12 juin 2025", author:"Amadou Ba" }],
    history:[
      { id:nid(), event:"Prospect créé",                 date:"10 juin 2025", by:"Amadou Ba",  type:"create"   },
      { id:nid(), event:"Premier contact téléphonique",  date:"11 juin 2025", by:"Amadou Ba",  type:"contact"  },
      { id:nid(), event:"Passage en Qualifié",           date:"12 juin 2025", by:"Amadou Ba",  type:"stage"    },
    ],
  },
  {
    id:2, name:"Aminata Sow", phone:"+221 78 234 56 78", email:"a.sow@email.com",
    type:"Locataire", status:"actif", stage:"visite",
    date:"5 juin 2025", note:5, biens:1, agentName:"Fatou Diallo", budget:"350 000 – 500 000 FCFA/mois",
    notes:[],
    history:[
      { id:nid(), event:"Prospect créé",                date:"5 juin 2025",  by:"Fatou Diallo", type:"create"  },
      { id:nid(), event:"Appel de qualification",        date:"7 juin 2025",  by:"Fatou Diallo", type:"contact" },
      { id:nid(), event:"Passage en Qualifié",           date:"9 juin 2025",  by:"Fatou Diallo", type:"stage"   },
      { id:nid(), event:"Visite planifiée — Appt. Plateau", date:"11 juin 2025",by:"Fatou Diallo",type:"stage" },
    ],
  },
  {
    id:3, name:"Ibrahima Fall", phone:"+221 77 345 67 89", email:"i.fall@email.com",
    type:"Investisseur", status:"actif", stage:"offre",
    date:"1 juin 2025", note:4, biens:4, agentName:"Amadou Ba", budget:"200 – 400 M FCFA",
    notes:[{ id:nid(), text:"Cherche terrain balnéaire pour projet hôtelier. Dossier juridique en cours.", date:"8 juin 2025", author:"Amadou Ba" }],
    history:[
      { id:nid(), event:"Prospect créé",           date:"1 juin 2025",  by:"Amadou Ba", type:"create"  },
      { id:nid(), event:"Qualification investisseur", date:"3 juin 2025",  by:"Amadou Ba", type:"contact" },
      { id:nid(), event:"Visite terrain Saly",      date:"7 juin 2025",  by:"Amadou Ba", type:"stage"   },
      { id:nid(), event:"Offre transmise",          date:"10 juin 2025", by:"Amadou Ba", type:"stage"   },
    ],
  },
  {
    id:4, name:"Fatou Ndiaye", phone:"+221 76 456 78 90", email:"f.ndiaye@email.com",
    type:"Acheteur", status:"prospect", stage:"nouveau",
    date:"28 mai 2025", note:0, biens:0, agentName:"", budget:"",
    notes:[], history:[{ id:nid(), event:"Prospect créé via formulaire web", date:"28 mai 2025", type:"create" }],
  },
  {
    id:5, name:"Cheikh Mbaye", phone:"+221 77 567 89 01", email:"c.mbaye@email.com",
    type:"Locataire", status:"inactif", stage:"contacté",
    date:"20 mai 2025", note:4, biens:1, agentName:"Fatou Diallo", budget:"200 000 FCFA/mois",
    notes:[{ id:nid(), text:"Cherche studio meublé à Mermoz. Disponible à partir de juillet.", date:"22 mai 2025", author:"Fatou Diallo" }],
    history:[
      { id:nid(), event:"Prospect créé",    date:"20 mai 2025", by:"Fatou Diallo", type:"create"  },
      { id:nid(), event:"Prise de contact", date:"22 mai 2025", by:"Fatou Diallo", type:"contact" },
    ],
  },
  {
    id:6, name:"Rokhaya Diop", phone:"+221 78 678 90 12", email:"r.diop@email.com",
    type:"Acheteur", status:"actif", stage:"qualifié",
    date:"15 mai 2025", note:5, biens:1, agentName:"Ousmane Ndiaye", budget:"60 – 100 M FCFA",
    notes:[{ id:nid(), text:"Souhaite duplex avec vue mer à Ngor ou Almadies.", date:"18 mai 2025", author:"Ousmane Ndiaye" }],
    history:[
      { id:nid(), event:"Prospect créé",        date:"15 mai 2025", by:"Ousmane Ndiaye", type:"create"  },
      { id:nid(), event:"Entretien en agence",   date:"17 mai 2025", by:"Ousmane Ndiaye", type:"contact" },
      { id:nid(), event:"Passage en Qualifié",   date:"18 mai 2025", by:"Ousmane Ndiaye", type:"stage"   },
    ],
  },
  {
    id:7, name:"Oumar Sarr", phone:"+221 77 789 01 23", email:"o.sarr@email.com",
    type:"Investisseur", status:"actif", stage:"gagné",
    date:"10 mai 2025", note:5, biens:3, agentName:"Amadou Ba", budget:"500 M+ FCFA",
    notes:[
      { id:nid(), text:"Acquisition villa IS-2025-001 finalisée. Client très satisfait.", date:"25 mai 2025", author:"Amadou Ba" },
      { id:nid(), text:"Intéressé pour un second investissement en 2026.", date:"2 juin 2025", author:"Amadou Ba" },
    ],
    history:[
      { id:nid(), event:"Prospect créé",         date:"10 mai 2025", by:"Amadou Ba", type:"create"  },
      { id:nid(), event:"Qualification",          date:"12 mai 2025", by:"Amadou Ba", type:"contact" },
      { id:nid(), event:"Visite villa Almadies",  date:"18 mai 2025", by:"Amadou Ba", type:"stage"   },
      { id:nid(), event:"Offre acceptée",         date:"22 mai 2025", by:"Amadou Ba", type:"stage"   },
      { id:nid(), event:"Transaction conclue 🎉", date:"25 mai 2025", by:"Amadou Ba", type:"won"     },
    ],
  },
  {
    id:8, name:"Ndéye Diallo", phone:"+221 76 890 12 34", email:"n.diallo@email.com",
    type:"Locataire", status:"prospect", stage:"nouveau",
    date:"5 mai 2025", note:0, biens:0, agentName:"", budget:"",
    notes:[], history:[{ id:nid(), event:"Prospect créé via site web", date:"5 mai 2025", type:"create" }],
  },
];

let _nextId = INIT.length + 1;
function today() {
  return new Date().toLocaleDateString("fr-SN", { day:"numeric", month:"long", year:"numeric" });
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
interface FormState {
  name:string; phone:string; email:string; type:PType;
  stage:Stage; budget:string; agentName:string; note:number;
}
const BLANK_FORM: FormState = {
  name:"", phone:"", email:"", type:"Acheteur",
  stage:"nouveau", budget:"", agentName:"", note:0,
};

// ─── Star rating ──────────────────────────────────────────────────────────────
function Stars({ value, onChange }: { value:number; onChange?(n:number):void }) {
  const [hov, setHov] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          className="transition-transform hover:scale-110"
          onMouseEnter={() => onChange && setHov(i)}
          onMouseLeave={() => onChange && setHov(0)}
          onClick={() => onChange?.(i)}>
          <Star size={16}
            fill={i <= (hov || value) ? GOLD : "none"}
            style={{ color: i <= (hov || value) ? GOLD : "#D1D5DB" }} />
        </button>
      ))}
    </div>
  );
}

// ─── Stage Badge ──────────────────────────────────────────────────────────────
function StageBadge({ stage }: { stage:Stage }) {
  const s = STAGE_MAP[stage];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background:`${s.color}18`, color:s.color }}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
    </span>
  );
}

// ─── History icon ─────────────────────────────────────────────────────────────
function HistIcon({ type }:{ type?:string }) {
  if (type === "create")  return <Plus size={12} />;
  if (type === "contact") return <Phone size={12} />;
  if (type === "won")     return <CheckCircle size={12} className="text-emerald-500" />;
  if (type === "note")    return <StickyNote size={12} />;
  return <ChevronRight size={12} />;
}

// ─── Prospect Form Modal ──────────────────────────────────────────────────────
function ProspectForm({ initial, onSave, onClose, title }: {
  initial: FormState; onSave:(f:FormState)=>void;
  onClose:()=>void; title:string;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const upd = (p: Partial<FormState>) => setForm(f => ({ ...f, ...p }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Le nom est requis (min. 2 caractères)";
    if (!form.phone.trim()) e.phone = "Le téléphone est requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => { onSave(form); }, 700);
    }, 600);
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#C9963A]/30 transition-all bg-white";
  const sty = (err?:string) => err
    ? { borderColor:"#F87171", boxShadow:"0 0 0 3px rgba(248,113,113,0.2)", color:NAVY }
    : { borderColor:B, color:NAVY };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor:B }}>
          <h3 className="font-bold text-[#0F1C2E] text-lg" style={{ fontFamily:"'Playfair Display',serif" }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Success overlay */}
        {success && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <p className="font-bold text-[#0F1C2E]" style={{ fontFamily:"'Playfair Display',serif" }}>
              {title.includes("Modifier") ? "Modifications enregistrées" : "Prospect ajouté"}
            </p>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Nom + Téléphone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nom complet *</label>
              <input className={inputCls} style={sty(errors.name)}
                value={form.name} onChange={e => { upd({name:e.target.value}); setErrors(er=>({...er,name:""})); }}
                placeholder="Prénom Nom" />
              {errors.name && <p className="text-xs text-red-500 mt-1">⚠ {errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone *</label>
              <input className={inputCls} style={sty(errors.phone)}
                value={form.phone} onChange={e => { upd({phone:e.target.value}); setErrors(er=>({...er,phone:""})); }}
                placeholder="+221 77 000 00 00" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">⚠ {errors.phone}</p>}
            </div>
          </div>

          {/* Email + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">E-mail</label>
              <input type="email" className={inputCls} style={{ borderColor:B, color:NAVY }}
                value={form.email} onChange={e => upd({email:e.target.value})}
                placeholder="email@exemple.sn" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
              <select className={inputCls} style={{ borderColor:B, color:NAVY }}
                value={form.type} onChange={e => upd({type:e.target.value as PType})}>
                <option>Acheteur</option>
                <option>Locataire</option>
                <option>Investisseur</option>
              </select>
            </div>
          </div>

          {/* Stage + Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Étape pipeline</label>
              <select className={inputCls} style={{ borderColor:B, color:NAVY }}
                value={form.stage} onChange={e => upd({stage:e.target.value as Stage})}>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Budget</label>
              <input className={inputCls} style={{ borderColor:B, color:NAVY }}
                value={form.budget} onChange={e => upd({budget:e.target.value})}
                placeholder="Ex: 80 – 120 M FCFA" />
            </div>
          </div>

          {/* Agent */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Agent assigné</label>
            <select className={inputCls} style={{ borderColor:B, color:NAVY }}
              value={form.agentName} onChange={e => upd({agentName:e.target.value})}>
              <option value="">— Non assigné —</option>
              {AGENTS.map(a => <option key={a.name} value={a.name}>{a.name} · {a.title}</option>)}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Note qualité</label>
            <Stars value={form.note} onChange={n => upd({note:n})} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor:B }}>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-gray-50"
            style={{ borderColor:B, color:NAVY }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting || success}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            style={{ background:GOLD }}>
            {submitting ? <><Loader2 size={15} className="animate-spin" />Enregistrement…</> : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function ProspectDetail({ prospect, prospects, onClose, onEdit, onDelete, onStageChange, onAddNote }: {
  prospect: Prospect; prospects: Prospect[];
  onClose:()=>void; onEdit:()=>void; onDelete:()=>void;
  onStageChange:(stage:Stage)=>void; onAddNote:(text:string)=>void;
}) {
  const [tab, setTab] = useState<"profil"|"notes"|"historique">("profil");
  const [noteText, setNoteText] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const curStageIdx = STAGES.findIndex(s => s.key === prospect.stage);

  const submitNote = () => {
    if (!noteText.trim()) return;
    setNoteSubmitting(true);
    setTimeout(() => {
      onAddNote(noteText.trim());
      setNoteText("");
      setNoteSubmitting(false);
      toast.success("Note ajoutée");
    }, 500);
  };

  const p = prospect;
  const agentInfo = AGENTS.find(a => a.name === p.agentName);
  const tc = TYPE_CFG[p.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:w-[420px] h-full sm:h-auto sm:max-h-[92vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b shrink-0" style={{ borderColor:B }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0"
              style={{ background:NAVY }}>
              {p.name.split(" ").map(w=>w[0]).join("")}
            </div>
            <div>
              <h3 className="font-bold text-[#0F1C2E] leading-tight" style={{ fontFamily:"'Playfair Display',serif" }}>
                {p.name}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${tc.bg} ${tc.text}`}>
                {p.type}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onEdit}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#C9963A] hover:bg-[#FDF6E7] transition-colors"
              title="Modifier">
              <Pencil size={14} />
            </button>
            {deleteConfirm ? (
              <>
                <button onClick={() => { onDelete(); setDeleteConfirm(false); }}
                  className="px-2 py-1 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
                  Confirmer
                </button>
                <button onClick={() => setDeleteConfirm(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                  <X size={14} />
                </button>
              </>
            ) : (
              <button onClick={() => setDeleteConfirm(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Supprimer">
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Stage pipeline */}
        <div className="px-5 py-3 border-b shrink-0" style={{ borderColor:B, background:"#FAFAF9" }}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Pipeline</p>
          <div className="flex items-center gap-1">
            {PIPELINE_STAGES.map((s, i) => {
              const active = s.key === p.stage;
              const past   = i < curStageIdx && curStageIdx < PIPELINE_STAGES.length;
              return (
                <button key={s.key}
                  onClick={() => onStageChange(s.key)}
                  title={`Déplacer vers ${s.label}`}
                  className="flex-1 flex flex-col items-center gap-0.5 group">
                  <div className={`h-1.5 w-full rounded-full transition-all ${active ? "" : past ? "opacity-70" : "opacity-20"}`}
                    style={{ background: active || past ? s.color : "#E5E7EB" }} />
                  <span className="text-[9px] font-bold hidden sm:block truncate w-full text-center transition-colors"
                    style={{ color: active ? s.color : "#9CA3AF" }}>
                    {s.label.split(" ")[0]}
                  </span>
                </button>
              );
            })}
            {/* Terminal buttons */}
            <button onClick={() => onStageChange("gagné")}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${p.stage === "gagné" ? "text-white" : "text-emerald-600 hover:bg-emerald-50"}`}
              style={{ background: p.stage === "gagné" ? "#16A34A" : undefined }}>
              ✓
            </button>
            <button onClick={() => onStageChange("perdu")}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${p.stage === "perdu" ? "text-white" : "text-red-400 hover:bg-red-50"}`}
              style={{ background: p.stage === "perdu" ? "#EF4444" : undefined }}>
              ✗
            </button>
          </div>
          <div className="mt-1.5 text-center">
            <StageBadge stage={p.stage} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0" style={{ borderColor:B }}>
          {(["profil","notes","historique"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-bold capitalize transition-colors"
              style={{
                color: tab === t ? GOLD : "#9CA3AF",
                borderBottom: tab === t ? `2px solid ${GOLD}` : "2px solid transparent",
              }}>
              {t === "notes" ? `Notes (${p.notes.length})` : t === "historique" ? `Historique (${p.history.length})` : "Profil"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── PROFIL ── */}
          {tab === "profil" && (
            <div className="p-5 space-y-4">
              {p.note > 0 && (
                <div className="flex items-center gap-2">
                  <Stars value={p.note} />
                  <span className="text-xs text-gray-400">{p.note}/5</span>
                </div>
              )}

              <a href={`tel:${p.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                style={{ border:`1px solid ${B}` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background:`${GOLD}15`, color:GOLD }}>
                  <Phone size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F1C2E]">{p.phone}</p>
                  <p className="text-[10px] text-gray-400">Téléphone</p>
                </div>
              </a>

              {p.email && (
                <a href={`mailto:${p.email}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  style={{ border:`1px solid ${B}` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background:`${NAVY}10`, color:NAVY }}>
                    <Mail size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F1C2E]">{p.email}</p>
                    <p className="text-[10px] text-gray-400">Email</p>
                  </div>
                </a>
              )}

              {p.budget && (
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ border:`1px solid ${B}`, background:`${GOLD}08` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background:`${GOLD}15`, color:GOLD }}>
                    <TrendingUp size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:GOLD, fontFamily:"'DM Mono',monospace" }}>{p.budget}</p>
                    <p className="text-[10px] text-gray-400">Budget</p>
                  </div>
                </div>
              )}

              {agentInfo && (
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ border:`1px solid ${B}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background:NAVY }}>
                    {agentInfo.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F1C2E]">{agentInfo.name}</p>
                    <p className="text-[10px] text-gray-400">{agentInfo.title}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl text-center" style={{ background:`${GOLD}10` }}>
                  <div className="font-bold text-xl" style={{ color:GOLD, fontFamily:"'DM Mono',monospace" }}>{p.biens}</div>
                  <div className="text-xs text-gray-500">Biens suivis</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background:`${NAVY}08` }}>
                  <div className="text-sm font-bold" style={{ color:NAVY }}>{p.date}</div>
                  <div className="text-xs text-gray-500">Créé le</div>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTES ── */}
          {tab === "notes" && (
            <div className="p-5 space-y-3">
              {/* Add note */}
              <div className="rounded-xl border p-3 space-y-2" style={{ borderColor:B }}>
                <textarea rows={3}
                  className="w-full text-sm outline-none resize-none bg-transparent"
                  style={{ color:NAVY }}
                  placeholder="Ajouter une note sur ce prospect…"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)} />
                <div className="flex justify-end">
                  <button
                    onClick={submitNote}
                    disabled={!noteText.trim() || noteSubmitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-colors"
                    style={{ background:GOLD }}>
                    {noteSubmitting ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Notes list */}
              {p.notes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <StickyNote size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Aucune note pour ce prospect</p>
                </div>
              ) : [...p.notes].reverse().map(n => (
                <div key={n.id} className="p-3.5 rounded-xl border" style={{ borderColor:B, background:"#FAFAF9" }}>
                  <p className="text-sm text-gray-700 leading-relaxed">"{n.text}"</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] font-bold" style={{ color:GOLD }}>{n.author}</span>
                    <span className="text-[10px] text-gray-400">{n.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── HISTORIQUE ── */}
          {tab === "historique" && (
            <div className="p-5">
              {p.history.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <History size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Aucun historique</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-100" />
                  <div className="space-y-4">
                    {[...p.history].reverse().map((h, i) => (
                      <div key={h.id} className="flex items-start gap-3 relative">
                        <div className="w-9 h-9 rounded-full border-2 border-white bg-white shadow-sm flex items-center justify-center shrink-0 z-10"
                          style={{ background: h.type === "won" ? "#DCFCE7" : `${GOLD}15`, color: h.type === "won" ? "#16A34A" : GOLD }}>
                          <HistIcon type={h.type} />
                        </div>
                        <div className="flex-1 pt-1.5">
                          <p className="text-sm font-semibold text-[#0F1C2E]">{h.event}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {h.by && <span className="text-[11px] text-gray-400">{h.by}</span>}
                            <span className="text-[10px] text-gray-300">•</span>
                            <span className="text-[11px] text-gray-400">{h.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contact actions footer */}
        <div className="px-5 py-3 border-t flex gap-2 shrink-0" style={{ borderColor:B }}>
          <a href={`tel:${p.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-colors"
            style={{ background:`${GOLD}15`, color:GOLD }}>
            <Phone size={14} />Appeler
          </a>
          {p.email && (
            <a href={`mailto:${p.email}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-colors"
              style={{ background:`${NAVY}08`, color:NAVY }}>
              <Mail size={14} />Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────
function KanbanCard({ prospect, onSelect, onMoveNext, onMovePrev, isLast, isFirst }: {
  prospect:Prospect; onSelect:()=>void;
  onMoveNext:()=>void; onMovePrev:()=>void;
  isLast:boolean; isFirst:boolean;
}) {
  const tc  = TYPE_CFG[prospect.type];
  const agt = AGENTS.find(a => a.name === prospect.agentName);

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData("prospectId", String(prospect.id))}
      onClick={onSelect}
      className="bg-white rounded-xl border p-3.5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 group select-none"
      style={{ borderColor:B }}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tc.bg} ${tc.text} shrink-0`}>
          {prospect.type}
        </span>
        {prospect.note > 0 && (
          <div className="flex gap-0.5 shrink-0">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={9} fill={i <= prospect.note ? GOLD : "none"} style={{ color:GOLD }} />
            ))}
          </div>
        )}
      </div>

      {/* Name */}
      <p className="font-bold text-sm text-[#0F1C2E] mb-1 leading-tight">{prospect.name}</p>

      {/* Budget */}
      {prospect.budget && (
        <p className="text-[11px] font-bold mb-2" style={{ color:GOLD, fontFamily:"'DM Mono',monospace" }}>
          {prospect.budget}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor:B }}>
        <div className="flex items-center gap-1.5">
          {agt ? (
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
              style={{ background:NAVY }}>
              {agt.avatar}
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-dashed border-gray-300 flex items-center justify-center shrink-0">
              <User size={9} className="text-gray-400" />
            </div>
          )}
          <span className="text-[10px] text-gray-400">{prospect.date.split(" ").slice(-2).join(" ")}</span>
        </div>
        {/* Move arrows */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          {!isFirst && (
            <button onClick={onMovePrev}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
              title="Étape précédente">
              <ChevronLeft size={11} className="text-gray-400" />
            </button>
          )}
          {!isLast && (
            <button onClick={onMoveNext}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
              title="Étape suivante">
              <ChevronRight size={11} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Notes indicator */}
      {prospect.notes.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5">
          <StickyNote size={9} className="text-gray-300" />
          <span className="text-[9px] text-gray-300">{prospect.notes.length} note{prospect.notes.length>1?"s":""}</span>
        </div>
      )}
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({ stage, prospects, onSelect, onMove, onAddInStage, dragOver, onDragOver, onDragLeave, onDrop }: {
  stage: typeof STAGES[0]; prospects:Prospect[];
  onSelect:(p:Prospect)=>void; onMove:(id:number, stage:Stage)=>void;
  onAddInStage:()=>void; dragOver:boolean;
  onDragOver:(e:React.DragEvent)=>void;
  onDragLeave:(e:React.DragEvent)=>void;
  onDrop:(e:React.DragEvent)=>void;
}) {
  const stageIdx = STAGES.findIndex(s => s.key === stage.key);

  return (
    <div
      className="flex flex-col rounded-2xl border transition-all duration-200"
      style={{
        minWidth:"240px", maxWidth:"260px",
        borderColor: dragOver ? stage.color : B,
        background: dragOver ? `${stage.color}06` : "transparent",
        borderStyle: dragOver ? "dashed" : "solid",
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}>

      {/* Column header */}
      <div className="flex items-center justify-between px-3.5 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
          <span className="text-sm font-bold text-[#0F1C2E]">{stage.label}</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: prospects.length > 0 ? stage.color : "#D1D5DB" }}>
            {prospects.length}
          </span>
        </div>
        <button onClick={onAddInStage}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#C9963A] hover:bg-[#FDF6E7] transition-colors"
          title={`Ajouter dans ${stage.label}`}>
          <Plus size={13} />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 px-2.5 pb-2.5 space-y-2.5 overflow-y-auto" style={{ minHeight:"80px", maxHeight:"calc(100vh - 340px)" }}>
        {prospects.length === 0 && (
          <div className="flex items-center justify-center py-6 text-gray-300 text-xs text-center">
            <div>
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center mx-auto mb-2">
                <Plus size={14} className="text-gray-300" />
              </div>
              Déposer ici
            </div>
          </div>
        )}
        {prospects.map(p => {
          const nextStage = STAGES[stageIdx + 1];
          const prevStage = STAGES[stageIdx - 1];
          return (
            <KanbanCard key={p.id}
              prospect={p}
              onSelect={() => onSelect(p)}
              onMoveNext={() => nextStage && onMove(p.id, nextStage.key)}
              onMovePrev={() => prevStage && onMove(p.id, prevStage.key)}
              isFirst={stageIdx === 0}
              isLast={stageIdx === STAGES.length - 1}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [prospects,   setProspects]   = useState<Prospect[]>(INIT);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState<PType | "">("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [view,        setView]        = useState<"liste"|"kanban">("liste");
  const [selected,    setSelected]    = useState<Prospect | null>(null);
  const [formMode,    setFormMode]    = useState<"add"|"edit"|null>(null);
  const [deleteId,    setDeleteId]    = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Stage | null>(null);
  const [defaultStage, setDefaultStage] = useState<Stage>("nouveau");

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = prospects;
    if (search.trim()) r = r.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
    );
    if (typeFilter)        r = r.filter(p => p.type === typeFilter);
    if (stageFilter !== "all") r = r.filter(p => p.stage === stageFilter);
    return r;
  }, [prospects, search, typeFilter, stageFilter]);

  const stats = useMemo(() => ({
    actif:    prospects.filter(p => p.status === "actif").length,
    prospect: prospects.filter(p => p.status === "prospect").length,
    inactif:  prospects.filter(p => p.status === "inactif").length,
    total:    prospects.length,
  }), [prospects]);

  // ── CRUD helpers ──────────────────────────────────────────────────────────
  const addProspect = useCallback((form: FormState) => {
    const id = _nextId++;
    const np: Prospect = {
      id, name:form.name, phone:form.phone, email:form.email,
      type:form.type, status:"prospect", stage:form.stage,
      date:today(), note:form.note, biens:0,
      agentName:form.agentName, budget:form.budget,
      notes:[], history:[{ id:nid(), event:"Prospect créé", date:today(), type:"create" }],
    };
    if (form.agentName) np.history.push({ id:nid(), event:`Agent assigné : ${form.agentName}`, date:today(), type:"contact" });
    setProspects(ps => [...ps, np]);
    pushNotif({
      type: "prospect",
      title: "Nouveau prospect",
      message: `${np.name} a été ajouté au pipeline${np.budget ? ` — budget ${np.budget}` : ""}`,
      link: "/agence/clients",
    });
    toast.success(`${np.name} ajouté au pipeline`);
  }, []);

  const updateProspect = useCallback((id:number, form: FormState) => {
    setProspects(ps => ps.map(p => {
      if (p.id !== id) return p;
      const hist = [...p.history];
      if (form.stage !== p.stage) hist.push({ id:nid(), event:`Déplacé vers ${STAGE_MAP[form.stage].label}`, date:today(), type:"stage" });
      if (form.agentName !== p.agentName && form.agentName) hist.push({ id:nid(), event:`Agent : ${form.agentName}`, date:today(), type:"contact" });
      return { ...p, name:form.name, phone:form.phone, email:form.email, type:form.type,
        stage:form.stage, budget:form.budget, agentName:form.agentName, note:form.note, history:hist };
    }));
    setSelected(prev => prev?.id === id ? { ...prev, ...form, status:prev.status, date:prev.date, biens:prev.biens, notes:prev.notes, history:prev.history } : prev);
    toast.success("Prospect mis à jour");
  }, []);

  const deleteProspect = useCallback((id:number) => {
    const name = prospects.find(p => p.id === id)?.name ?? "";
    setProspects(ps => ps.filter(p => p.id !== id));
    setSelected(null);
    setDeleteId(null);
    toast.error(`"${name}" supprimé`);
  }, [prospects]);

  const moveProspect = useCallback((id:number, stage:Stage) => {
    setProspects(ps => ps.map(p => {
      if (p.id !== id) return p;
      const hist = [...p.history, { id:nid(), event:`Déplacé vers ${STAGE_MAP[stage].label}`, date:today(), type:"stage" }];
      return { ...p, stage, history:hist };
    }));
    // Update selected panel if it's the same prospect
    setSelected(prev => prev?.id === id ? { ...prev, stage, history:[...prev.history, { id:nid(), event:`Déplacé vers ${STAGE_MAP[stage].label}`, date:today(), type:"stage" }] } : prev);
    toast.success(`Déplacé vers ${STAGE_MAP[stage].label}`);
  }, []);

  const addNote = useCallback((prospectId:number, text:string) => {
    const note: Note = { id:nid(), text, date:today(), author:"Moi" };
    const histEv: HistEvent = { id:nid(), event:"Note ajoutée", date:today(), by:"Moi", type:"note" };
    setProspects(ps => ps.map(p =>
      p.id === prospectId
        ? { ...p, notes:[...p.notes, note], history:[...p.history, histEv] }
        : p
    ));
    setSelected(prev => prev?.id === prospectId
      ? { ...prev, notes:[...prev.notes, note], history:[...prev.history, histEv] }
      : prev);
  }, []);

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent, stage:Stage) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("prospectId"));
    if (id) moveProspect(id, stage);
    setDragOverCol(null);
  };

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAdd = (stage: Stage = "nouveau") => {
    setDefaultStage(stage);
    setFormMode("add");
  };

  const openEdit = () => setFormMode("edit");

  const formInitial: FormState = formMode === "edit" && selected
    ? { name:selected.name, phone:selected.phone, email:selected.email, type:selected.type,
        stage:selected.stage, budget:selected.budget, agentName:selected.agentName, note:selected.note }
    : { ...BLANK_FORM, stage:defaultStage };

  const handleFormSave = (form: FormState) => {
    if (formMode === "edit" && selected) updateProspect(selected.id, form);
    else addProspect(form);
    setFormMode(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1C2E]" style={{ fontFamily:"'Playfair Display',serif" }}>
            Clients & Prospects
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{stats.total} contact{stats.total!==1?"s":""} dans le CRM</p>
        </div>
        <button onClick={() => openAdd()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors hover:opacity-90"
          style={{ background:GOLD }}>
          <Plus size={16} />Nouveau prospect
        </button>
      </div>

      {/* ── STATS ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:"Actifs",    value:stats.actif,    color:"#16A34A" },
          { label:"Prospects", value:stats.prospect, color:GOLD       },
          { label:"Inactifs",  value:stats.inactif,  color:"#9CA3AF" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-4" style={{ borderColor:B }}>
            <div className="text-2xl font-bold" style={{ fontFamily:"'DM Mono',monospace", color }}>{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* ── FILTERS ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none bg-white w-52"
            style={{ borderColor:B, color:NAVY }} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={13}/></button>
          )}
        </div>

        {/* Type filter */}
        <div className="flex gap-1 p-1 rounded-xl border bg-white" style={{ borderColor:B }}>
          {(["", "Acheteur", "Locataire", "Investisseur"] as const).map(t => (
            <button key={t || "all"} onClick={() => setTypeFilter(t as PType|"")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: typeFilter === t ? NAVY : "transparent",
                color:      typeFilter === t ? "#fff" : "#6B7280",
              }}>
              {t || "Tous"}
            </button>
          ))}
        </div>

        {/* Stage filter */}
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value as Stage|"all")}
          className="px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none bg-white"
          style={{ borderColor: stageFilter !== "all" ? GOLD : B, color:NAVY }}>
          <option value="all">Toutes les étapes</option>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>

        {/* View toggle */}
        <div className="flex gap-0.5 p-1 rounded-xl border bg-white ml-auto" style={{ borderColor:B }}>
          <button onClick={() => setView("liste")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background:view==="liste"?NAVY:"transparent", color:view==="liste"?"#fff":"#9CA3AF" }}>
            <List size={13} />Liste
          </button>
          <button onClick={() => setView("kanban")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background:view==="kanban"?NAVY:"transparent", color:view==="kanban"?"#fff":"#9CA3AF" }}>
            <LayoutGrid size={13} />Kanban
          </button>
        </div>
      </div>

      {/* ── LIST VIEW ───────────────────────────────────────────────────── */}
      {view === "liste" && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor:B }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor:B, background:"#F8F6F2" }}>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Contact</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Coordonnées</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Étape</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Agent</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor:B }}>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                    <Search size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Aucun prospect trouvé</p>
                    {(search || typeFilter || stageFilter !== "all") && (
                      <button onClick={() => { setSearch(""); setTypeFilter(""); setStageFilter("all"); }}
                        className="text-xs font-bold mt-2" style={{ color:GOLD }}>
                        Effacer les filtres
                      </button>
                    )}
                  </td></tr>
                ) : filtered.map(c => {
                  const st = STATUS_CFG[c.status];
                  const tp = TYPE_CFG[c.type];
                  const agt = AGENTS.find(a => a.name === c.agentName);
                  return (
                    <tr key={c.id}
                      className="hover:bg-[#F8F6F2] transition-colors cursor-pointer"
                      onClick={() => setSelected(c)}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                            style={{ background:NAVY }}>
                            {c.name.split(" ").map(w=>w[0]).join("")}
                          </div>
                          <div>
                            <div className="font-semibold text-[#0F1C2E]">{c.name}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar size={10}/>{c.date}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="text-xs text-gray-500">{c.phone}</div>
                        <div className="text-xs text-gray-400">{c.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${tp.bg} ${tp.text}`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><StageBadge stage={c.stage} /></td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {agt ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ background:NAVY }}>{agt.avatar}</div>
                            <span className="text-xs text-gray-500 truncate max-w-[100px]">{agt.name}</span>
                          </div>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5" onClick={e=>e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <a href={`tel:${c.phone}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color:GOLD, background:`${GOLD}15` }}>
                            <Phone size={14}/>
                          </a>
                          {c.email && (
                            <a href={`mailto:${c.email}`}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                              style={{ color:NAVY, background:`${NAVY}10` }}>
                              <Mail size={14}/>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t text-xs text-gray-400 flex items-center justify-between" style={{ borderColor:B, background:"#FAFAF9" }}>
              <span>{filtered.length} sur {stats.total} contact{stats.total!==1?"s":""}</span>
              <span>{prospects.filter(p=>p.stage==="gagné").length} gagnés · {prospects.filter(p=>p.stage==="perdu").length} perdus</span>
            </div>
          )}
        </div>
      )}

      {/* ── KANBAN VIEW ─────────────────────────────────────────────────── */}
      {view === "kanban" && (
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="flex gap-3 pb-4" style={{ minWidth: `${STAGES.length * 265}px` }}>
            {STAGES.map(stage => {
              const stageProspects = filtered.filter(p => p.stage === stage.key);
              return (
                <KanbanColumn key={stage.key}
                  stage={stage}
                  prospects={stageProspects}
                  onSelect={setSelected}
                  onMove={moveProspect}
                  onAddInStage={() => openAdd(stage.key)}
                  dragOver={dragOverCol === stage.key}
                  onDragOver={e => { e.preventDefault(); setDragOverCol(stage.key); }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null); }}
                  onDrop={e => handleDrop(e, stage.key)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── DETAIL PANEL ────────────────────────────────────────────────── */}
      {selected && (() => {
        // Always show the latest version of the prospect from state
        const live = prospects.find(p => p.id === selected.id);
        if (!live) return null;
        return (
          <ProspectDetail
            prospect={live}
            prospects={prospects}
            onClose={() => setSelected(null)}
            onEdit={openEdit}
            onDelete={() => { deleteProspect(live.id); }}
            onStageChange={(stage) => moveProspect(live.id, stage)}
            onAddNote={(text) => addNote(live.id, text)}
          />
        );
      })()}

      {/* ── FORM MODAL ──────────────────────────────────────────────────── */}
      {formMode !== null && (
        <ProspectForm
          title={formMode === "edit" ? "Modifier le prospect" : "Nouveau prospect"}
          initial={formInitial}
          onSave={handleFormSave}
          onClose={() => setFormMode(null)}
        />
      )}
    </div>
  );
}
