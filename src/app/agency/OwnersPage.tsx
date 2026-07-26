import { useState, useMemo, useCallback } from "react";
import {
  Plus, Search, X, MoreHorizontal, Pencil, Trash2, Eye,
  Phone, Mail, MapPin, CheckCircle, XCircle, Loader2,
  Home, TrendingUp, FileText, LayoutGrid, List,
  AlertTriangle, RotateCcw, Building2, Download,
  Users, Wallet, BadgeCheck, ArrowRight, Upload,
  ChevronDown, File, FileBadge, UserCheck, UserX,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tabs from "@radix-ui/react-tabs";
import { toast } from "sonner";
import { NAVY, GOLD, B, fmt } from "../data";
import { useProperties, updateProperty } from "./store";
import type { StoreProp } from "./store";
import {
  useOwners, addOwner, updateOwner, deleteOwner, toggleOwner,
  assignProp, removeProp, addDocument, removeDocument,
  type Owner, type OwnerType, type OwnerDocument,
} from "./ownersStore";

// ─── Constants ────────────────────────────────────────────────────────────────
const OWNER_TYPES: OwnerType[] = ["Particulier", "Société", "Investisseur"];
const DOC_TYPES: OwnerDocument["type"][] = ["Titre foncier", "CNI", "Passeport", "NINEA", "Contrat de mandat", "Autre"];
const VILLES_LIST = ["Dakar", "Thiès", "Mbour", "Rufisque", "Saint-Louis", "Ziguinchor"];

const TYPE_CFG: Record<OwnerType, { bg: string; text: string; color: string }> = {
  Particulier:  { bg: "bg-blue-50",    text: "text-blue-700",    color: "#3B82F6" },
  Société:      { bg: "bg-purple-50",  text: "text-purple-700",  color: "#7C3AED" },
  Investisseur: { bg: "bg-amber-50",   text: "text-amber-700",   color: "#D97706" },
};

const DOC_ICON_CFG: Record<OwnerDocument["type"], { icon: string; color: string }> = {
  "Titre foncier":     { icon: "🏛️", color: "#7C3AED" },
  "CNI":               { icon: "🪪", color: "#0F1C2E" },
  "Passeport":         { icon: "📘", color: "#1D4ED8" },
  "NINEA":             { icon: "🏢", color: "#D97706" },
  "Contrat de mandat": { icon: "📄", color: "#16A34A" },
  "Autre":             { icon: "📎", color: "#6B7280" },
};

const AVATAR_PALETTE = [
  "#1E3A5F","#2D6A4F","#7B4F2E","#5A2D82","#1A5276","#7D6608","#922B21","#1B6F2A",
];
function avatarColor(id: number) { return AVATAR_PALETTE[id % AVATAR_PALETTE.length]; }

// ─── Stats per owner ──────────────────────────────────────────────────────────
interface OwnerStats {
  biens: number;
  actives: number;   // disponible | réservé
  transactions: number; // vendu | loué
  revenuPortefeuille: number; // sum of all property values
  revenuAnnuel: number; // estimated annual income from rented props
}
function computeOwnerStats(owner: Owner, properties: StoreProp[]): OwnerStats {
  const mine = properties.filter(p => owner.propIds.includes(p.id));
  let actives = 0; let transactions = 0;
  let revenuPortefeuille = 0; let revenuAnnuel = 0;
  for (const p of mine) {
    revenuPortefeuille += p.price;
    if (p.status === "disponible" || p.status === "réservé") actives++;
    if (p.status === "vendu" || p.status === "loué") transactions++;
    if (p.transaction === "location") revenuAnnuel += p.price * 12;
  }
  return { biens: mine.length, actives, transactions, revenuPortefeuille, revenuAnnuel };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shortDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-SN", { day: "numeric", month: "short", year: "numeric" });
}
function initials(name: string) { return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase(); }
function fileSizeRandom() {
  const kb = Math.floor(Math.random() * 1800 + 200);
  return kb < 1000 ? `${kb} Ko` : `${(kb / 1000).toFixed(1)} Mo`;
}

// ─── OwnerForm ────────────────────────────────────────────────────────────────
type FormState = {
  name: string; phone: string; email: string; ville: string;
  type: OwnerType; actif: boolean; notes: string;
};
const BLANK_FORM: FormState = { name:"", phone:"", email:"", ville:"Dakar", type:"Particulier", actif:true, notes:"" };
function ownerToForm(o: Owner): FormState {
  return { name: o.name, phone: o.phone, email: o.email, ville: o.ville, type: o.type, actif: o.actif, notes: o.notes };
}

function OwnerForm({ title, initial, onSave, onClose }: {
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
    if (!form.phone.trim()) e.phone = "Le téléphone est requis";
    if (!form.email.trim()) e.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email invalide";
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

  const tc = TYPE_CFG[form.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">

        {success && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-emerald-500"/>
            </div>
            <p className="font-bold text-[#0F1C2E] text-lg" style={{ fontFamily:"'Playfair Display',serif" }}>
              {title.includes("Modifier") ? "Propriétaire mis à jour" : "Propriétaire ajouté !"}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor: B }}>
          <h3 className="font-bold text-[#0F1C2E] text-lg" style={{ fontFamily:"'Playfair Display',serif" }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"><X size={16}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Avatar preview */}
          <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: `${avatarColor(0)}08` }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0"
              style={{ background: form.name ? avatarColor(form.name.charCodeAt(0)) : NAVY }}>
              {form.name ? initials(form.name) : "??"}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-[#0F1C2E]">{form.name || "Nom du propriétaire"}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${tc.bg} ${tc.text}`}>
                {form.type}
              </span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nom complet *</label>
            <input className={ic} style={sty("name")} value={form.name}
              placeholder={form.type === "Société" ? "Nom de la société" : "Prénom Nom"}
              onChange={e => { upd({ name: e.target.value }); clr("name"); }}/>
            {errors.name && <p className="text-xs text-red-500 mt-1">⚠ {errors.name}</p>}
          </div>

          {/* Type + Ville */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
              <div className="flex gap-1.5 flex-wrap">
                {OWNER_TYPES.map(t => {
                  const cfg = TYPE_CFG[t];
                  const active = form.type === t;
                  return (
                    <button key={t} type="button"
                      onClick={() => upd({ type: t })}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                      style={{
                        borderColor: active ? cfg.color : B,
                        background: active ? `${cfg.color}15` : "white",
                        color: active ? cfg.color : "#9CA3AF",
                      }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Ville</label>
              <select className={ic} style={{ borderColor: B, color: NAVY }}
                value={form.ville} onChange={e => upd({ ville: e.target.value })}>
                {VILLES_LIST.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone *</label>
              <input className={ic} style={sty("phone")} value={form.phone}
                placeholder="+221 77 000 00 00"
                onChange={e => { upd({ phone: e.target.value }); clr("phone"); }}/>
              {errors.phone && <p className="text-xs text-red-500 mt-1">⚠ {errors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email *</label>
              <input type="email" className={ic} style={sty("email")} value={form.email}
                placeholder="contact@exemple.sn"
                onChange={e => { upd({ email: e.target.value }); clr("email"); }}/>
              {errors.email && <p className="text-xs text-red-500 mt-1">⚠ {errors.email}</p>}
            </div>
          </div>

          {/* Actif toggle */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Statut</label>
            <button type="button" onClick={() => upd({ actif: !form.actif })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all"
              style={{
                borderColor: form.actif ? "#16A34A" : "#F87171",
                background:  form.actif ? "#F0FDF4"  : "#FEF2F2",
                color:       form.actif ? "#16A34A"  : "#EF4444",
              }}>
              {form.actif ? <><CheckCircle size={14}/>Actif</> : <><XCircle size={14}/>Inactif</>}
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Notes internes (optionnel)</label>
            <textarea rows={3} className={`${ic} resize-none`} style={{ borderColor: B, color: NAVY }}
              value={form.notes} placeholder="Observations, préférences, contraintes…"
              onChange={e => upd({ notes: e.target.value })}/>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: B }}>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm border hover:bg-gray-50 transition-colors"
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

// ─── PropertyPickerModal ──────────────────────────────────────────────────────
function PropertyPickerModal({ owner, properties, onConfirm, onClose }: {
  owner: Owner; properties: StoreProp[];
  onConfirm: (propId: number) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const available = useMemo(() => {
    const q = search.toLowerCase();
    // Only show properties not already owned by ANYONE (ownerName is undefined) or by this owner
    return properties.filter(p => {
      const notMine = !owner.propIds.includes(p.id);
      const free    = !p.ownerName || p.ownerName === owner.name;
      return notMine && free && (
        !q || p.title.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
      );
    });
  }, [properties, owner, search]);

  const STATUS_DOT: Record<string,string> = {
    disponible:"#16A34A", réservé:"#D97706", loué:"#3B82F6", vendu:"#9CA3AF",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b shrink-0" style={{ borderColor: B }}>
          <h3 className="font-bold text-[#0F1C2E]" style={{ fontFamily:"'Playfair Display',serif" }}>Associer un bien</h3>
          <p className="text-xs text-gray-400 mt-0.5">→ {owner.name}</p>
        </div>
        <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: B }}>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Titre, référence, localisation…"
              className="w-full pl-8 pr-4 py-2 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: B, color: NAVY }}/>
            {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={12}/></button>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {available.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              {search ? "Aucun résultat" : "Aucun bien disponible à associer"}
            </div>
          ) : available.map(p => {
            const sel = selected === p.id;
            return (
              <button key={p.id} onClick={() => setSelected(sel ? null : p.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b hover:bg-[#F8F6F2] transition-colors"
                style={{ borderColor: B, background: sel ? `${GOLD}10` : undefined }}>
                <img src={p.img} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 bg-gray-100"/>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#0F1C2E] truncate">{p.title}</p>
                  <p className="text-[11px] font-mono text-gray-400">{p.ref}</p>
                  <p className="text-[11px] text-gray-500">{p.location} · {fmt(p.price)} FCFA</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="flex items-center gap-1 text-[10px] font-bold capitalize"
                    style={{ color: STATUS_DOT[p.status] ?? "#6B7280" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_DOT[p.status] ?? "#6B7280" }}/>
                    {p.status}
                  </span>
                  {sel && <CheckCircle size={14} style={{ color: GOLD }}/>}
                </div>
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
            style={{ background: GOLD }}>Associer</button>
        </div>
      </div>
    </div>
  );
}

// ─── DocumentForm ─────────────────────────────────────────────────────────────
function DocumentForm({ onSave, onClose }: {
  onSave: (doc: Omit<OwnerDocument, "id">) => void; onClose: () => void;
}) {
  const [name, setName]   = useState("");
  const [type, setType]   = useState<OwnerDocument["type"]>("Titre foncier");
  const [date, setDate]   = useState(new Date().toISOString().split("T")[0]);
  const [err, setErr]     = useState("");

  const handleSave = () => {
    if (!name.trim()) { setErr("Le nom du document est requis"); return; }
    onSave({ name: name.trim(), type, date, size: fileSizeRandom() });
    onClose();
  };

  const ic = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none bg-white focus:ring-2 focus:ring-[#C9963A]/30 transition-all";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: B }}>
          <h3 className="font-bold text-[#0F1C2E]" style={{ fontFamily:"'Playfair Display',serif" }}>Ajouter un document</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100"><X size={14}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nom du document *</label>
            <input className={ic} style={{ borderColor: err ? "#F87171" : B, color: NAVY }}
              value={name} placeholder="Ex: Titre foncier — Villa Almadies n°4521"
              onChange={e => { setName(e.target.value); setErr(""); }}/>
            {err && <p className="text-xs text-red-500 mt-1">⚠ {err}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
            <select className={ic} style={{ borderColor: B, color: NAVY }}
              value={type} onChange={e => setType(e.target.value as OwnerDocument["type"])}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
            <input type="date" className={ic} style={{ borderColor: B, color: NAVY }}
              value={date} onChange={e => setDate(e.target.value)}/>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <Upload size={13} className="text-blue-400 shrink-0"/>
            <p className="text-xs text-blue-600">Cliquez sur Ajouter pour enregistrer le document (simulation).</p>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm border"
            style={{ borderColor: B, color: NAVY }}>Annuler</button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: GOLD }}>Ajouter</button>
        </div>
      </div>
    </div>
  );
}

// ─── DeleteConfirmModal ────────────────────────────────────────────────────────
function DeleteConfirmModal({ owner, onConfirm, onClose }: {
  owner: Owner; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-500"/>
          </div>
          <h3 className="font-bold text-[#0F1C2E] text-lg mb-2" style={{ fontFamily:"'Playfair Display',serif" }}>
            Supprimer le propriétaire
          </h3>
          <p className="text-sm text-gray-500">
            Êtes-vous sûr de vouloir supprimer <strong>{owner.name}</strong> ?
            Ses {owner.propIds.length} bien{owner.propIds.length !== 1 ? "s" : ""} associé{owner.propIds.length !== 1 ? "s" : ""} seront dissociés.
          </p>
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

// ─── OwnerDetail ──────────────────────────────────────────────────────────────
function OwnerDetail({ owner, properties, onClose, onEdit, onToggle, onDelete }: {
  owner: Owner; properties: StoreProp[];
  onClose: () => void; onEdit: () => void;
  onToggle: () => void; onDelete: () => void;
}) {
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [docFormOpen,  setDocFormOpen]  = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [removingDocId, setRemovingDocId] = useState<number | null>(null);

  const stats    = computeOwnerStats(owner, properties);
  const myProps  = properties.filter(p => owner.propIds.includes(p.id));
  const tc       = TYPE_CFG[owner.type];
  const color    = avatarColor(owner.id);

  const handleAssign = useCallback((propId: number) => {
    const prop = properties.find(p => p.id === propId);
    assignProp(owner.id, propId, { name: owner.name, phone: owner.phone, email: owner.email });
    toast.success(`"${prop?.title}" associé à ${owner.name}`);
  }, [owner, properties]);

  const handleRemoveProp = useCallback((propId: number) => {
    const prop = properties.find(p => p.id === propId);
    removeProp(owner.id, propId);
    toast.info(`"${prop?.title}" dissocié`);
  }, [owner, properties]);

  const handleAddDoc = useCallback((doc: Omit<OwnerDocument, "id">) => {
    addDocument(owner.id, doc);
    toast.success("Document ajouté");
  }, [owner.id]);

  const handleRemoveDoc = useCallback((docId: number) => {
    removeDocument(owner.id, docId);
    setRemovingDocId(null);
    toast.info("Document supprimé");
  }, [owner.id]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
        <div className="relative bg-white w-full sm:w-[440px] h-[92vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-5 py-5 border-b shrink-0" style={{ borderColor: B }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
                  style={{ background: color }}>
                  {initials(owner.name)}
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight text-[#0F1C2E]" style={{ fontFamily:"'Playfair Display',serif" }}>
                    {owner.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tc.bg} ${tc.text}`}>{owner.type}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${owner.actif ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-500"}`}>
                      {owner.actif ? "Actif" : "Inactif"}
                    </span>
                    <span className="text-[10px] text-gray-400">{owner.ville}</span>
                  </div>
                </div>
              </div>
              {/* Actions */}
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

            {/* KPI row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Biens",       value: stats.biens,        color: NAVY      },
                { label: "Actifs",      value: stats.actives,      color: "#16A34A" },
                { label: "Transactions",value: stats.transactions,  color: GOLD      },
                { label: "Documents",   value: owner.documents.length, color: "#7C3AED" },
              ].map(({ label, value, color: c }) => (
                <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: `${c}10` }}>
                  <div className="text-lg font-bold" style={{ fontFamily:"'DM Mono',monospace", color: c }}>{value}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wide text-gray-400">{label}</div>
                </div>
              ))}
            </div>

            {/* Revenue block */}
            <div className="mt-3 p-3 rounded-xl grid grid-cols-2 gap-3" style={{ background: `${GOLD}08` }}>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Valeur portefeuille</p>
                <p className="font-bold text-sm truncate" style={{ fontFamily:"'DM Mono',monospace", color: GOLD }}>
                  {fmt(Math.round(stats.revenuPortefeuille / 1_000_000))} M FCFA
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Revenus loc. annuels</p>
                <p className="font-bold text-sm truncate" style={{ fontFamily:"'DM Mono',monospace", color: "#16A34A" }}>
                  {fmt(stats.revenuAnnuel)} FCFA
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs.Root defaultValue="profil" className="flex-1 flex flex-col overflow-hidden">
            <style>{`
              [data-radix-tabs-trigger][data-state="active"]   { border-color: ${GOLD}; color: ${NAVY}; }
              [data-radix-tabs-trigger][data-state="inactive"] { border-color: transparent; color: #9CA3AF; }
              [data-radix-tabs-trigger][data-state="inactive"]:hover { color: ${NAVY}; }
            `}</style>
            <Tabs.List className="flex border-b shrink-0 px-2" style={{ borderColor: B }}>
              {[
                { val: "profil",    label: "Profil"                     },
                { val: "biens",     label: `Biens (${myProps.length})`  },
                { val: "documents", label: `Docs (${owner.documents.length})` },
              ].map(({ val, label }) => (
                <Tabs.Trigger key={val} value={val}
                  className="px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap outline-none">
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* Profil tab */}
            <Tabs.Content value="profil" className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoBlock label="Téléphone" value={owner.phone} icon={<Phone size={12}/>}
                  href={`tel:${owner.phone}`}/>
                <InfoBlock label="Email" value={owner.email} icon={<Mail size={12}/>}
                  href={`mailto:${owner.email}`} small/>
                <InfoBlock label="Ville" value={owner.ville} icon={<MapPin size={12}/>}/>
                <InfoBlock label="Membre depuis" value={shortDate(owner.dateAjout)} icon={<BadgeCheck size={12}/>}/>
              </div>
              {owner.notes && (
                <div className="p-4 rounded-xl border" style={{ borderColor: B, background: "#FAFAF9" }}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Notes internes</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{owner.notes}</p>
                </div>
              )}
              {/* Actif toggle */}
              <button onClick={onToggle}
                className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all"
                style={{
                  borderColor: owner.actif ? "#EF4444" : "#16A34A",
                  background:  owner.actif ? "#FEF2F2" : "#F0FDF4",
                  color:       owner.actif ? "#EF4444" : "#16A34A",
                }}>
                {owner.actif ? <><UserX size={15}/>Désactiver</> : <><UserCheck size={15}/>Activer</>}
              </button>
            </Tabs.Content>

            {/* Biens tab */}
            <Tabs.Content value="biens" className="flex-1 overflow-y-auto">
              <div className="p-4">
                <button onClick={() => setPickerOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border border-dashed transition-colors"
                  style={{ borderColor: `${GOLD}50`, color: GOLD }}>
                  <Plus size={14}/>Associer un bien
                </button>
              </div>
              {myProps.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  <Home size={24} className="mx-auto mb-2 opacity-20"/>Aucun bien associé
                </div>
              ) : myProps.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: B }}>
                  <img src={p.img} alt="" className="w-11 h-11 rounded-xl object-cover bg-gray-100 shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-[#0F1C2E] truncate">{p.title}</p>
                    <p className="text-[10px] font-mono text-gray-400">{p.ref}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_DOT[p.status] ?? "#9CA3AF" }}/>
                      <span className="text-[10px] capitalize text-gray-500">{p.status} · {fmt(p.price)} FCFA</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveProp(p.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0">
                    <X size={12}/>
                  </button>
                </div>
              ))}
            </Tabs.Content>

            {/* Documents tab */}
            <Tabs.Content value="documents" className="flex-1 overflow-y-auto">
              <div className="p-4">
                <button onClick={() => setDocFormOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border border-dashed transition-colors"
                  style={{ borderColor: `${GOLD}50`, color: GOLD }}>
                  <Plus size={14}/>Ajouter un document
                </button>
              </div>
              {owner.documents.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  <FileText size={24} className="mx-auto mb-2 opacity-20"/>Aucun document
                </div>
              ) : owner.documents.map(doc => {
                const dcfg = DOC_ICON_CFG[doc.type];
                const isRemoving = removingDocId === doc.id;
                return (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3 border-b group" style={{ borderColor: B }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: `${dcfg.color}12` }}>
                      {dcfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-[#0F1C2E] truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: `${dcfg.color}12`, color: dcfg.color }}>
                          {doc.type}
                        </span>
                        <span className="text-[10px] text-gray-400">{shortDate(doc.date)} · {doc.size}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toast.info(`Téléchargement simulé : ${doc.name}`)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0F1C2E] hover:bg-gray-100 transition-colors">
                        <Download size={12}/>
                      </button>
                      {isRemoving ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleRemoveDoc(doc.id)}
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white bg-red-500">Oui</button>
                          <button onClick={() => setRemovingDocId(null)}
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-bold border" style={{ borderColor: B, color: NAVY }}>Non</button>
                        </div>
                      ) : (
                        <button onClick={() => setRemovingDocId(doc.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                          <Trash2 size={12}/>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>

      {pickerOpen && (
        <PropertyPickerModal owner={owner} properties={properties}
          onConfirm={handleAssign} onClose={() => setPickerOpen(false)}/>
      )}
      {docFormOpen && (
        <DocumentForm onSave={handleAddDoc} onClose={() => setDocFormOpen(false)}/>
      )}
    </>
  );
}

function InfoBlock({ label, value, icon, href, small }: {
  label: string; value: string; icon?: React.ReactNode; href?: string; small?: boolean;
}) {
  const inner = (
    <div className="p-3 rounded-xl border w-full text-left" style={{ borderColor: B, background: "#FAFAF9" }}>
      <div className="flex items-center gap-1 text-gray-400 mb-1">{icon}<span className="text-[9px] font-bold uppercase tracking-wide">{label}</span></div>
      <p className={`font-semibold text-[#0F1C2E] truncate ${small ? "text-[11px]" : "text-xs"}`}>{value}</p>
    </div>
  );
  return href ? <a href={href} className="hover:opacity-80 transition-opacity">{inner}</a> : <div>{inner}</div>;
}

// ─── Shared status dot colors ─────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  disponible: "#16A34A", réservé: "#D97706", loué: "#3B82F6", vendu: "#9CA3AF",
};

// ─── OwnerCard ────────────────────────────────────────────────────────────────
function OwnerCard({ owner, stats, onSelect, onEdit, onToggle, onDelete }: {
  owner: Owner; stats: OwnerStats;
  onSelect: () => void; onEdit: () => void;
  onToggle: () => void; onDelete: () => void;
}) {
  const color = avatarColor(owner.id);
  const tc    = TYPE_CFG[owner.type];

  return (
    <div className="bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all group" style={{ borderColor: B }}>
      <div className="h-1.5" style={{ background: owner.actif ? `linear-gradient(90deg,${color},${GOLD})` : "#E5E7EB" }}/>
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shrink-0"
              style={{ background: color }}>
              {initials(owner.name)}
            </div>
            <div>
              <p className="font-bold text-sm text-[#0F1C2E] leading-tight">{owner.name}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tc.bg} ${tc.text}`}>{owner.type}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${owner.actif ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-500"}`}>
                  {owner.actif ? "● Actif" : "○ Inactif"}
                </span>
              </div>
            </div>
          </div>
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
                    <Eye size={13} style={{ color: GOLD }}/>Consulter
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={onEdit}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                    <Pencil size={13}/>Modifier
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={onToggle}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] outline-none"
                    style={{ color: owner.actif ? "#F97316" : "#16A34A" }}>
                    {owner.actif ? <><UserX size={13}/>Désactiver</> : <><UserCheck size={13}/>Activer</>}
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

        {/* Contact */}
        <div className="space-y-1.5 mb-4">
          <a href={`tel:${owner.phone}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#0F1C2E] transition-colors">
            <Phone size={11} className="text-gray-400 shrink-0"/>{owner.phone}
          </a>
          <a href={`mailto:${owner.email}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#0F1C2E] transition-colors truncate">
            <Mail size={11} className="text-gray-400 shrink-0"/>{owner.email}
          </a>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={11} className="text-gray-400 shrink-0"/>{owner.ville}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {[
            { label: "Biens",  value: stats.biens,        c: NAVY      },
            { label: "Actifs", value: stats.actives,      c: "#16A34A" },
            { label: "Trans.", value: stats.transactions,  c: GOLD      },
            { label: "Docs",   value: owner.documents.length, c: "#7C3AED" },
          ].map(({ label, value, c }) => (
            <div key={label} className="rounded-xl p-2 text-center" style={{ background: `${c}08` }}>
              <div className="text-sm font-bold" style={{ fontFamily:"'DM Mono',monospace", color: c }}>{value}</div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-none mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Revenue */}
        <div className="flex items-center justify-between p-3 rounded-xl mb-4" style={{ background: `${GOLD}08` }}>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Portefeuille</span>
          <span className="font-bold text-sm" style={{ fontFamily:"'DM Mono',monospace", color: GOLD }}>
            {fmt(Math.round(stats.revenuPortefeuille / 1_000_000))} M FCFA
          </span>
        </div>

        <button onClick={onSelect}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:bg-[#F8F6F2]"
          style={{ borderColor: B, color: NAVY }}>
          Voir le dossier<ArrowRight size={13}/>
        </button>
      </div>
    </div>
  );
}

// ─── OwnerRow ─────────────────────────────────────────────────────────────────
function OwnerRow({ owner, stats, onSelect, onEdit, onToggle, onDelete }: {
  owner: Owner; stats: OwnerStats;
  onSelect: () => void; onEdit: () => void;
  onToggle: () => void; onDelete: () => void;
}) {
  const tc    = TYPE_CFG[owner.type];
  const color = avatarColor(owner.id);

  return (
    <tr className="hover:bg-[#F8F6F2] transition-colors cursor-pointer border-b" style={{ borderColor: B }} onClick={onSelect}>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: color }}>{initials(owner.name)}</div>
          <div>
            <p className="font-bold text-sm text-[#0F1C2E]">{owner.name}</p>
            <p className="text-[11px] text-gray-400">{owner.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 hidden md:table-cell">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${tc.bg} ${tc.text}`}>{owner.type}</span>
      </td>
      <td className="px-4 py-4 hidden lg:table-cell">
        <p className="text-xs text-gray-700">{owner.phone}</p>
        <p className="text-[11px] text-gray-400">{owner.ville}</p>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-bold" style={{ color: NAVY }}>{stats.biens}</span>
          <span className="text-gray-300">·</span>
          <span className="font-bold" style={{ color: GOLD }}>{stats.transactions}</span>
        </div>
        <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Biens · Trans.</p>
      </td>
      <td className="px-4 py-4 hidden xl:table-cell">
        <span className="font-bold text-xs" style={{ fontFamily:"'DM Mono',monospace", color: GOLD }}>
          {fmt(Math.round(stats.revenuPortefeuille / 1_000_000))} M FCFA
        </span>
      </td>
      <td className="px-4 py-4">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${owner.actif ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-500"}`}>
          {owner.actif ? "Actif" : "Inactif"}
        </span>
      </td>
      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <button onClick={onSelect}
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
                className="bg-white rounded-2xl border shadow-xl z-50 min-w-[160px] py-1.5 overflow-hidden" style={{ borderColor: B }}>
                <DropdownMenu.Item onSelect={onEdit}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] text-gray-700 outline-none">
                  <Pencil size={13}/>Modifier
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={onToggle}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F8F6F2] outline-none"
                  style={{ color: owner.actif ? "#F97316" : "#16A34A" }}>
                  {owner.actif ? <><UserX size={13}/>Désactiver</> : <><UserCheck size={13}/>Activer</>}
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OwnersPage() {
  const owners     = useOwners();
  const properties = useProperties();

  const [view,       setView]       = useState<"grille" | "liste">("grille");
  const [search,     setSearch]     = useState("");
  const [typeFlt,    setTypeFlt]    = useState<OwnerType | "all">("all");
  const [statusFlt,  setStatusFlt]  = useState<"all" | "actif" | "inactif">("all");

  const [selected,    setSelected]    = useState<Owner | null>(null);
  const [formOpen,    setFormOpen]    = useState(false);
  const [editOwner,   setEditOwner]   = useState<Owner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Owner | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const statsMap = useMemo(() => {
    const m: Record<number, OwnerStats> = {};
    for (const o of owners) m[o.id] = computeOwnerStats(o, properties);
    return m;
  }, [owners, properties]);

  // ── Global KPIs ────────────────────────────────────────────────────────────
  const totals = useMemo(() => ({
    total:      owners.length,
    actifs:     owners.filter(o => o.actif).length,
    biens:      owners.reduce((s, o) => s + o.propIds.length, 0),
    portefeuille: owners.reduce((s, o) => s + (statsMap[o.id]?.revenuPortefeuille ?? 0), 0),
  }), [owners, statsMap]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return owners.filter(o => {
      if (q && !o.name.toLowerCase().includes(q) && !o.email.toLowerCase().includes(q) && !o.phone.includes(q)) return false;
      if (typeFlt !== "all" && o.type !== typeFlt)          return false;
      if (statusFlt === "actif"   && !o.actif)              return false;
      if (statusFlt === "inactif" &&  o.actif)              return false;
      return true;
    });
  }, [owners, search, typeFlt, statusFlt]);

  // ── Live selected in sync ──────────────────────────────────────────────────
  const liveSelected = selected ? (owners.find(o => o.id === selected.id) ?? null) : null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFormSave = useCallback((form: FormState) => {
    if (editOwner) {
      updateOwner(editOwner.id, {
        name: form.name, phone: form.phone, email: form.email,
        ville: form.ville, type: form.type, actif: form.actif, notes: form.notes,
      });
      // Keep property owner info in sync
      for (const propId of editOwner.propIds) {
        updateProperty(propId, { ownerName: form.name, ownerPhone: form.phone, ownerEmail: form.email });
      }
      toast.success(`${form.name} mis à jour`);
    } else {
      addOwner({ name: form.name, phone: form.phone, email: form.email, ville: form.ville, type: form.type, actif: form.actif, notes: form.notes });
      toast.success(`Propriétaire "${form.name}" ajouté`);
    }
    setFormOpen(false); setEditOwner(null);
  }, [editOwner]);

  const handleToggle = useCallback((o: Owner) => {
    toggleOwner(o.id);
    toast.info(`${o.name} ${o.actif ? "désactivé" : "activé"}`);
  }, []);

  const handleDelete = useCallback((o: Owner) => {
    // Remove property associations
    for (const propId of o.propIds) {
      updateProperty(propId, { ownerName: undefined, ownerPhone: undefined, ownerEmail: undefined });
    }
    deleteOwner(o.id);
    setDeleteTarget(null);
    setSelected(null);
    toast.error(`"${o.name}" supprimé`);
  }, []);

  const openEdit = (o: Owner) => { setEditOwner(o); setFormOpen(true); setSelected(null); };
  const openAdd  = () => { setEditOwner(null); setFormOpen(true); };

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1C2E]" style={{ fontFamily:"'Playfair Display',serif" }}>Propriétaires</h1>
          <p className="text-gray-500 text-sm mt-0.5">{totals.actifs} actif{totals.actifs !== 1 ? "s" : ""} · {totals.total} au total</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-colors"
          style={{ background: GOLD }}>
          <Plus size={16}/>Nouveau propriétaire
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total propriétaires", value: totals.total,   icon: <Users size={18}/>,     color: NAVY      },
          { label: "Actifs",              value: totals.actifs,  icon: <UserCheck size={18}/>, color: "#16A34A" },
          { label: "Biens associés",      value: totals.biens,   icon: <Building2 size={18}/>, color: "#3B82F6" },
          {
            label: "Valeur portefeuille",
            value: `${fmt(Math.round(totals.portefeuille / 1_000_000))} M FCFA`,
            icon: <Wallet size={18}/>, color: GOLD, wide: true,
          },
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nom, email, téléphone…"
            className="pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none bg-white w-52"
            style={{ borderColor: B, color: NAVY }}/>
          {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={13}/></button>}
        </div>

        <select value={typeFlt} onChange={e => setTypeFlt(e.target.value as typeof typeFlt)}
          className="px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none bg-white"
          style={{ borderColor: typeFlt !== "all" ? GOLD : B, color: NAVY }}>
          <option value="all">Tous les types</option>
          {OWNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={statusFlt} onChange={e => setStatusFlt(e.target.value as typeof statusFlt)}
          className="px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none bg-white"
          style={{ borderColor: statusFlt !== "all" ? GOLD : B, color: NAVY }}>
          <option value="all">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>

        {(search || typeFlt !== "all" || statusFlt !== "all") && (
          <button onClick={() => { setSearch(""); setTypeFlt("all"); setStatusFlt("all"); }}
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

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border py-16 text-center" style={{ borderColor: B }}>
          <Users size={28} className="mx-auto mb-3 opacity-20"/>
          <p className="text-gray-400 text-sm">Aucun propriétaire pour ces filtres</p>
        </div>
      )}

      {/* Grid */}
      {view === "grille" && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(o => (
            <OwnerCard key={o.id} owner={o}
              stats={statsMap[o.id] ?? { biens:0, actives:0, transactions:0, revenuPortefeuille:0, revenuAnnuel:0 }}
              onSelect={() => setSelected(o)}
              onEdit={() => openEdit(o)}
              onToggle={() => handleToggle(o)}
              onDelete={() => setDeleteTarget(o)}/>
          ))}
        </div>
      )}

      {/* List */}
      {view === "liste" && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: B }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: B, background: "#F8F6F2" }}>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Propriétaire</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Biens · Trans.</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Portefeuille</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: B }}>
                {filtered.map(o => (
                  <OwnerRow key={o.id} owner={o}
                    stats={statsMap[o.id] ?? { biens:0, actives:0, transactions:0, revenuPortefeuille:0, revenuAnnuel:0 }}
                    onSelect={() => setSelected(o)}
                    onEdit={() => openEdit(o)}
                    onToggle={() => handleToggle(o)}
                    onDelete={() => setDeleteTarget(o)}/>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: B, background: "#FAFAF9" }}>
            <p className="text-xs text-gray-400">{filtered.length} propriétaire{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}</p>
            <p className="text-xs font-bold" style={{ color: GOLD }}>{totals.biens} biens associés</p>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {liveSelected && (
        <OwnerDetail
          owner={liveSelected}
          properties={properties}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(liveSelected)}
          onToggle={() => handleToggle(liveSelected)}
          onDelete={() => { setSelected(null); setDeleteTarget(liveSelected); }}/>
      )}

      {/* Form modal */}
      {formOpen && (
        <OwnerForm
          title={editOwner ? `Modifier — ${editOwner.name}` : "Nouveau propriétaire"}
          initial={editOwner ? ownerToForm(editOwner) : BLANK_FORM}
          onSave={handleFormSave}
          onClose={() => { setFormOpen(false); setEditOwner(null); }}/>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          owner={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}/>
      )}
    </div>
  );
}
