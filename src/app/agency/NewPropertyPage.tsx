import { useState, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router";
import {
  ArrowLeft, CheckCircle, Upload, X, Image as ImageIcon,
  Plus, Video, User, Briefcase, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  NAVY, GOLD, B, CREAM, VILLES, QUARTIERS, PROP_TYPES, EQUIPEMENTS_LIST,
  AGENTS, type Transaction, type PropType, type Status, type AgentInfo,
} from "../data";
import {
  useProperties, addProperty, updateProperty, type StoreProp,
} from "./store";

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = ["Informations", "Localisation", "Détails", "Médias", "Équipements", "Publication"];

// ─── Form state types ─────────────────────────────────────────────────────────
interface FormImage { url: string; name: string; isLocal: boolean }

interface FormState {
  title: string;
  transaction: string;
  propertyType: string;
  description: string;
  ville: string;
  quartier: string;
  adresse: string;
  price: string;
  surface: string;
  surfaceTerrain: string;
  beds: string;
  baths: string;
  status: string;
  tag: string;
  images: FormImage[];
  videoUrl: string;
  equipements: string[];
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  agentName: string;
}

const DEFAULT_FORM: FormState = {
  title: "", transaction: "vente", propertyType: "Villa",
  description: "",
  ville: "", quartier: "", adresse: "",
  price: "", surface: "", surfaceTerrain: "",
  beds: "3", baths: "2",
  status: "disponible", tag: "",
  images: [], videoUrl: "",
  equipements: [],
  ownerName: "", ownerPhone: "", ownerEmail: "",
  agentName: "",
};

// ─── Converters ───────────────────────────────────────────────────────────────
function propToForm(p: StoreProp): FormState {
  return {
    title:         p.title,
    transaction:   p.transaction,
    propertyType:  p.propertyType,
    description:   p.description ?? "",
    ville:         p.ville,
    quartier:      p.quartier,
    adresse:       "",
    price:         String(p.price),
    surface:       String(p.surface),
    surfaceTerrain:String(p.surfaceTerrain ?? ""),
    beds:          String(p.beds),
    baths:         String(p.baths),
    status:        p.status,
    tag:           p.tag ?? "",
    images: [
      ...(p.img   ? [{ url: p.img,   name: "principale", isLocal: false }] : []),
      ...(p.photos ?? []).map(url => ({ url, name: "photo", isLocal: false })),
    ],
    videoUrl:  p.videoUrl  ?? "",
    equipements: [...(p.equipements ?? [])],
    ownerName: p.ownerName ?? "",
    ownerPhone:p.ownerPhone ?? "",
    ownerEmail:p.ownerEmail ?? "",
    agentName: p.agent?.name ?? "",
  };
}

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=580&fit=crop&auto=format";

function formToStoreProp(form: FormState): Omit<StoreProp, "id" | "ref" | "createdAt"> {
  const agentInfo = AGENTS.find(a => a.name === form.agentName);
  const mainImg = form.images[0]?.url ?? PLACEHOLDER_IMG;
  const extraPhotos = form.images.slice(1).map(i => i.url);
  return {
    title:          form.title.trim(),
    subtitle:       [form.propertyType, form.quartier || form.ville].filter(Boolean).join(" · "),
    transaction:    form.transaction as Transaction,
    propertyType:   form.propertyType as PropType,
    description:    form.description,
    location:       [form.quartier, form.ville].filter(Boolean).join(", ") || "Sénégal",
    ville:          form.ville || "Dakar",
    quartier:       form.quartier,
    price:          Number(form.price) || 0,
    surface:        Number(form.surface) || 0,
    surfaceTerrain: form.surfaceTerrain ? Number(form.surfaceTerrain) : undefined,
    beds:           Number(form.beds)   || 0,
    baths:          Number(form.baths)  || 0,
    status:         form.status as Status,
    tag:            form.tag || null,
    img:            mainImg,
    photos:         extraPhotos,
    equipements:    form.equipements,
    views:          0,
    agent:          agentInfo,
    videoUrl:       form.videoUrl || undefined,
    ownerName:      form.ownerName || undefined,
    ownerPhone:     form.ownerPhone || undefined,
    ownerEmail:     form.ownerEmail || undefined,
  };
}

// ─── Shared field styles ──────────────────────────────────────────────────────
const inputCls = "w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#C9963A]/30 transition-all bg-white";
const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

function ErrInput({ hasErr }: { hasErr: boolean }) {
  return hasErr
    ? { borderColor: "#F87171", boxShadow: "0 0 0 3px rgba(248,113,113,0.2)" }
    : { borderColor: B, color: NAVY };
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────
function ImageZone({
  images, onAdd, onRemove, onReorder,
}: {
  images: FormImage[];
  onAdd: (files: FileList) => void;
  onRemove: (idx: number) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all select-none ${drag ? "border-[#C9963A] bg-[#FDF6E7]" : "border-gray-200 hover:border-[#C9963A]/50 hover:bg-[#FDF6E7]/40"}`}>
        <Upload size={24} className="mx-auto mb-3" style={{ color: drag ? GOLD : "#9CA3AF" }} />
        <p className="text-sm font-semibold text-gray-600">
          {drag ? "Déposez ici" : "Glissez vos photos ou cliquez pour sélectionner"}
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — multiple fichiers acceptés</p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => e.target.files && onAdd(e.target.files)} />
      </div>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border"
              style={{ borderColor: i === 0 ? GOLD : B }}>
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              {/* Principal badge */}
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ background: GOLD }}>
                  Principale
                </span>
              )}
              {/* Remove */}
              <button
                onClick={e => { e.stopPropagation(); onRemove(i); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                <X size={11} className="text-white" />
              </button>
              {/* Move left (set as principal) */}
              {i > 0 && (
                <button
                  onClick={e => { e.stopPropagation(); onReorder(i, 0); }}
                  className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  title="Définir comme principale">
                  ★
                </button>
              )}
              {/* File name */}
              <p className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[9px] text-white bg-black/50 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {img.name}
              </p>
            </div>
          ))}

          {/* Add more */}
          <button
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-[#C9963A]/50 hover:bg-[#FDF6E7]/40 transition-all text-gray-400">
            <Plus size={20} />
            <span className="text-[10px] font-semibold">Ajouter</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Agent Card Selector ──────────────────────────────────────────────────────
function AgentSelector({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* No agent option */}
      <label
        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${!value ? "border-[#C9963A] bg-[#FDF6E7]" : "border-transparent hover:bg-gray-50"}`}
        style={{ borderColor: !value ? GOLD : B }}>
        <input type="radio" className="sr-only" checked={!value} onChange={() => onChange("")} />
        <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
          <User size={16} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-600">Non assigné</p>
          <p className="text-[10px] text-gray-400">Aucun agent</p>
        </div>
        {!value && <CheckCircle size={14} className="ml-auto shrink-0" style={{ color: GOLD }} />}
      </label>

      {AGENTS.map(agent => {
        const selected = value === agent.name;
        return (
          <label key={agent.name}
            className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all"
            style={{ borderColor: selected ? GOLD : B, background: selected ? `${GOLD}08` : "white" }}>
            <input type="radio" className="sr-only" checked={selected} onChange={() => onChange(agent.name)} />
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: NAVY }}>
              {agent.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#0F1C2E] truncate">{agent.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{agent.title}</p>
            </div>
            {selected && <CheckCircle size={14} className="shrink-0" style={{ color: GOLD }} />}
          </label>
        );
      })}
    </div>
  );
}

// ─── Summary table ────────────────────────────────────────────────────────────
function SummaryTable({ form, isEdit }: { form: FormState; isEdit: boolean }) {
  const rows = [
    { label: "Titre",         value: form.title || "—" },
    { label: "Transaction",   value: `${form.propertyType} — ${form.transaction}` },
    { label: "Localisation",  value: [form.quartier, form.ville, form.adresse].filter(Boolean).join(", ") || "—" },
    { label: "Prix",          value: form.price ? `${Number(form.price).toLocaleString("fr-SN")} FCFA` : "—" },
    { label: "Surface",       value: form.surface ? `${form.surface} m²` : "—" },
    { label: "Chambres",      value: form.beds   ? `${form.beds} ch.`   : "—", hide: form.transaction === "terrain" },
    { label: "Équipements",   value: form.equipements.length ? `${form.equipements.length} sélectionné(s)` : "Aucun" },
    { label: "Photos",        value: form.images.length ? `${form.images.length} image(s)` : "Aucune" },
    { label: "Agent",         value: form.agentName || "Non assigné" },
    { label: "Propriétaire",  value: form.ownerName || "Non renseigné" },
  ];

  return (
    <div className="rounded-xl border divide-y overflow-hidden" style={{ borderColor: B }}>
      {rows.filter(r => !r.hide).map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between px-4 py-3 hover:bg-[#F8F6F2] transition-colors">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</span>
          <span className="text-sm font-semibold text-[#0F1C2E] max-w-[60%] text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NewPropertyPage() {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();
  const properties = useProperties();

  const isEdit  = !!id && id !== "nouveau";
  const propId  = isEdit ? Number(id) : null;
  const existing = propId ? properties.find(p => p.id === propId) as StoreProp | undefined : undefined;

  // ── Form state (initialized once from existing or defaults) ──────────────
  const [step,      setStep]      = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [dragOver,  setDragOver]  = useState(false);

  const [form, setForm] = useState<FormState>(() =>
    existing ? propToForm(existing) : { ...DEFAULT_FORM }
  );

  const upd = useCallback((patch: Partial<FormState>) => setForm(f => ({ ...f, ...patch })), []);

  const quartiers = form.ville ? (QUARTIERS[form.ville] ?? []) : [];

  // ── Image handlers ────────────────────────────────────────────────────────
  const handleAddFiles = (files: FileList) => {
    const newImgs = Array.from(files).map(f => ({
      url:     URL.createObjectURL(f),
      name:    f.name,
      isLocal: true,
    }));
    upd({ images: [...form.images, ...newImgs] });
  };

  const handleRemoveImage = (idx: number) => {
    const img = form.images[idx];
    if (img.isLocal) URL.revokeObjectURL(img.url);
    upd({ images: form.images.filter((_, i) => i !== idx) });
  };

  const handleReorderImage = (from: number, to: number) => {
    const imgs = [...form.images];
    const [moved] = imgs.splice(from, 1);
    imgs.splice(to, 0, moved);
    upd({ images: imgs });
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.title.trim())   e.title = "Le titre du bien est requis";
    }
    if (s === 1) {
      if (!form.ville)          e.ville = "Veuillez sélectionner une ville";
    }
    if (s === 2) {
      if (!form.price || Number(form.price) <= 0) e.price   = "Le prix est requis (valeur > 0)";
      if (!form.surface || Number(form.surface) <= 0) e.surface = "La superficie est requise (valeur > 0)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validate(step)) return;
    setErrors({});
    setStep(s => s + 1);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const data = formToStoreProp(form);
    if (isEdit && propId) {
      updateProperty(propId, data);
      toast.success("Modifications enregistrées !");
    } else {
      const np = addProperty(data);
      toast.success(`Bien publié avec succès — ${np.ref}`);
    }
    setSubmitted(true);
    setTimeout(() => navigate("/agence/biens"), 3000);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${GOLD}20, ${GOLD}10)`, border: `2px solid ${GOLD}30` }}>
          <CheckCircle size={36} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#0F1C2E] mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
          {isEdit ? "Modifications enregistrées !" : "Bien publié avec succès !"}
        </h2>
        <p className="text-gray-500 text-sm mb-6">Redirection automatique vers la liste des biens…</p>
        <div className="flex items-center gap-3">
          <Link to="/agence/biens"
            className="px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:bg-gray-50"
            style={{ borderColor: B, color: NAVY }}>
            Voir la liste
          </Link>
          {!isEdit && (
            <Link to="/agence/biens/nouveau"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors hover:opacity-90"
              style={{ background: GOLD }}>
              Nouveau bien
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── Form ──────────────────────────────────────────────────────────────────
  const sty = (err?: string) =>
    err
      ? { borderColor: "#F87171", boxShadow: "0 0 0 3px rgba(248,113,113,0.2)", color: NAVY }
      : { borderColor: B, color: NAVY };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate("/agence/biens")}
          className="w-9 h-9 rounded-xl flex items-center justify-center border transition-colors hover:bg-white"
          style={{ borderColor: B }}>
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#0F1C2E]" style={{ fontFamily: "'Playfair Display',serif" }}>
            {isEdit ? `Modifier le bien${existing ? ` — ${existing.ref}` : ""}` : "Nouveau bien"}
          </h1>
          <p className="text-gray-400 text-xs">Étape {step + 1} sur {STEPS.length} — {STEPS[step]}</p>
        </div>
      </div>

      {/* ── Progress ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i < step && setStep(i)}
            className={`flex-1 group ${i < step ? "cursor-pointer" : "cursor-default"}`}>
            <div className="h-1.5 rounded-full transition-all"
              style={{ background: i < step ? `${GOLD}` : i === step ? `${GOLD}90` : B }} />
            <div className="text-[10px] font-bold mt-1 transition-colors hidden sm:block"
              style={{ color: i === step ? GOLD : i < step ? `${GOLD}80` : "#9CA3AF" }}>
              {s}
            </div>
          </button>
        ))}
      </div>

      {/* ── Step content ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border p-6 space-y-5" style={{ borderColor: B }}>

        {/* ── STEP 0: Informations ──────────────────────────────────────── */}
        {step === 0 && (
          <>
            <Field label="Titre du bien *" error={errors.title}>
              <input
                className={inputCls}
                style={sty(errors.title)}
                value={form.title}
                onChange={e => { upd({ title: e.target.value }); setErrors(er => ({ ...er, title: "" })); }}
                placeholder="Ex: Villa Contemporaine avec Piscine aux Almadies" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Type de transaction">
                <select className={inputCls} style={{ borderColor: B, color: NAVY }}
                  value={form.transaction} onChange={e => upd({ transaction: e.target.value })}>
                  <option value="vente">Vente</option>
                  <option value="location">Location</option>
                  <option value="terrain">Terrain</option>
                </select>
              </Field>
              <Field label="Type de bien">
                <select className={inputCls} style={{ borderColor: B, color: NAVY }}
                  value={form.propertyType} onChange={e => upd({ propertyType: e.target.value })}>
                  {PROP_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Description">
              <textarea rows={5}
                className={`${inputCls} resize-none`}
                style={{ borderColor: B, color: NAVY }}
                value={form.description}
                onChange={e => upd({ description: e.target.value })}
                placeholder="Décrivez le bien : atouts, aménagements, environnement, luminosité…" />
              <p className="text-[11px] text-gray-400 mt-1 text-right">{form.description.length} caractères</p>
            </Field>
          </>
        )}

        {/* ── STEP 1: Localisation ──────────────────────────────────────── */}
        {step === 1 && (
          <>
            <Field label="Ville *" error={errors.ville}>
              <select className={inputCls} style={sty(errors.ville)}
                value={form.ville}
                onChange={e => { upd({ ville: e.target.value, quartier: "" }); setErrors(er => ({ ...er, ville: "" })); }}>
                <option value="">— Choisir une ville —</option>
                {VILLES.map(v => <option key={v}>{v}</option>)}
              </select>
            </Field>

            {quartiers.length > 0 && (
              <Field label="Quartier">
                <select className={inputCls} style={{ borderColor: B, color: NAVY }}
                  value={form.quartier} onChange={e => upd({ quartier: e.target.value })}>
                  <option value="">— Choisir un quartier —</option>
                  {quartiers.map(q => <option key={q}>{q}</option>)}
                </select>
              </Field>
            )}

            <Field label="Adresse complète">
              <input className={inputCls} style={{ borderColor: B, color: NAVY }}
                value={form.adresse}
                onChange={e => upd({ adresse: e.target.value })}
                placeholder="Numéro, nom de la rue, résidence, immeuble…" />
            </Field>

            {form.ville && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs"
                style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}30` }}>
                <span style={{ color: GOLD }}>📍</span>
                <span className="text-gray-600">
                  Localisation sélectionnée :&nbsp;
                  <strong style={{ color: NAVY }}>{[form.quartier, form.ville].filter(Boolean).join(", ")}</strong>
                </span>
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: Détails ───────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prix (FCFA) *" error={errors.price}>
                <input type="number" min={0}
                  className={inputCls}
                  style={sty(errors.price)}
                  value={form.price}
                  onChange={e => { upd({ price: e.target.value }); setErrors(er => ({ ...er, price: "" })); }}
                  placeholder="185000000" />
                {form.price && Number(form.price) > 0 && (
                  <p className="text-[11px] mt-1" style={{ color: GOLD }}>
                    {Number(form.price).toLocaleString("fr-SN")} FCFA
                  </p>
                )}
              </Field>

              <Field label="Surface habitable (m²) *" error={errors.surface}>
                <input type="number" min={0}
                  className={inputCls}
                  style={sty(errors.surface)}
                  value={form.surface}
                  onChange={e => { upd({ surface: e.target.value }); setErrors(er => ({ ...er, surface: "" })); }}
                  placeholder="420" />
              </Field>
            </div>

            {form.transaction !== "terrain" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Chambres">
                  <input type="number" min={0}
                    className={inputCls} style={{ borderColor: B, color: NAVY }}
                    value={form.beds} onChange={e => upd({ beds: e.target.value })}
                    placeholder="4" />
                </Field>
                <Field label="Salles de bain">
                  <input type="number" min={0}
                    className={inputCls} style={{ borderColor: B, color: NAVY }}
                    value={form.baths} onChange={e => upd({ baths: e.target.value })}
                    placeholder="3" />
                </Field>
              </div>
            )}

            {(form.propertyType === "Villa" || form.transaction === "terrain") && (
              <Field label="Surface terrain (m²)">
                <input type="number" min={0}
                  className={inputCls} style={{ borderColor: B, color: NAVY }}
                  value={form.surfaceTerrain} onChange={e => upd({ surfaceTerrain: e.target.value })}
                  placeholder="800" />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Statut">
                <select className={inputCls} style={{ borderColor: B, color: NAVY }}
                  value={form.status} onChange={e => upd({ status: e.target.value })}>
                  <option value="disponible">Disponible</option>
                  <option value="réservé">Réservé</option>
                  <option value="loué">Loué</option>
                  <option value="vendu">Vendu / Archivé</option>
                </select>
              </Field>
              <Field label="Badge mis en avant">
                <select className={inputCls} style={{ borderColor: B, color: NAVY }}
                  value={form.tag} onChange={e => upd({ tag: e.target.value })}>
                  <option value="">Aucun badge</option>
                  <option>Nouveau</option>
                  <option>Coup de cœur</option>
                  <option>Exclusivité</option>
                  <option>Premium</option>
                </select>
              </Field>
            </div>
          </>
        )}

        {/* ── STEP 3: Médias ────────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <div>
              <label className={labelCls}>
                Photos du bien
                <span className="ml-2 text-gray-400 normal-case font-normal">
                  ({form.images.length} image{form.images.length !== 1 ? "s" : ""})
                </span>
              </label>
              <ImageZone
                images={form.images}
                onAdd={handleAddFiles}
                onRemove={handleRemoveImage}
                onReorder={handleReorderImage}
              />
            </div>

            <div className="pt-2 border-t" style={{ borderColor: B }}>
              <Field label="URL Vidéo (YouTube / Vimeo)">
                <div className="relative">
                  <Video size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className={`${inputCls} pl-9`} style={{ borderColor: B, color: NAVY }}
                    type="url" value={form.videoUrl}
                    onChange={e => upd({ videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=…" />
                </div>
                {form.videoUrl && (
                  <p className="text-xs mt-1 text-emerald-600 flex items-center gap-1">
                    <CheckCircle size={11} />URL vidéo enregistrée
                  </p>
                )}
              </Field>
            </div>
          </>
        )}

        {/* ── STEP 4: Équipements ───────────────────────────────────────── */}
        {step === 4 && (
          <>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Équipements & prestations</label>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${GOLD}15`, color: GOLD }}>
                {form.equipements.length} sélectionné(s)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPEMENTS_LIST.map(eq => {
                const active = form.equipements.includes(eq);
                return (
                  <label key={eq}
                    className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none"
                    style={{ borderColor: active ? GOLD : B, background: active ? `${GOLD}08` : "white" }}>
                    <input type="checkbox" className="sr-only" checked={active}
                      onChange={e => {
                        const list = e.target.checked
                          ? [...form.equipements, eq]
                          : form.equipements.filter(x => x !== eq);
                        upd({ equipements: list });
                      }} />
                    <div className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                      style={{
                        background:   active ? GOLD : "transparent",
                        borderColor:  active ? GOLD : B,
                      }}>
                      {active && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{eq}</span>
                  </label>
                );
              })}
            </div>
          </>
        )}

        {/* ── STEP 5: Publication ───────────────────────────────────────── */}
        {step === 5 && (
          <>
            {/* Owner info */}
            <div>
              <label className={`${labelCls} flex items-center gap-2`}>
                <User size={13} />Propriétaire
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Nom complet">
                  <input className={inputCls} style={{ borderColor: B, color: NAVY }}
                    value={form.ownerName} onChange={e => upd({ ownerName: e.target.value })}
                    placeholder="Prénom Nom" />
                </Field>
                <Field label="Téléphone">
                  <input className={inputCls} style={{ borderColor: B, color: NAVY }}
                    value={form.ownerPhone} onChange={e => upd({ ownerPhone: e.target.value })}
                    placeholder="+221 77 000 00 00" />
                </Field>
                <Field label="E-mail">
                  <input type="email" className={inputCls} style={{ borderColor: B, color: NAVY }}
                    value={form.ownerEmail} onChange={e => upd({ ownerEmail: e.target.value })}
                    placeholder="email@exemple.sn" />
                </Field>
              </div>
            </div>

            {/* Agent */}
            <div className="pt-1 border-t" style={{ borderColor: B }}>
              <label className={`${labelCls} flex items-center gap-2 mb-3`}>
                <Briefcase size={13} />Agent assigné
              </label>
              <AgentSelector value={form.agentName} onChange={n => upd({ agentName: n })} />
            </div>

            {/* Summary */}
            <div className="pt-1 border-t" style={{ borderColor: B }}>
              <label className={`${labelCls} mb-3`}>Récapitulatif</label>
              <SummaryTable form={form} isEdit={isEdit} />
            </div>

            {/* Validation warning if missing required fields */}
            {(!form.title || !form.price || !form.surface) && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-amber-500 text-sm mt-0.5">⚠</span>
                <div className="text-xs text-amber-700">
                  <strong>Champs manquants :</strong>{" "}
                  {[!form.title && "titre", !form.price && "prix", !form.surface && "superficie"].filter(Boolean).join(", ")}.{" "}
                  Revenez aux étapes précédentes pour compléter.
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm border transition-colors hover:bg-white"
            style={{ borderColor: B, color: NAVY }}>
            Précédent
          </button>
        )}

        {step < STEPS.length - 1 ? (
          <button onClick={goNext}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors hover:opacity-90"
            style={{ background: GOLD }}>
            Suivant <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!form.title || !form.price || !form.surface}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: GOLD }}>
            {isEdit ? "Enregistrer les modifications" : "Publier le bien"}
          </button>
        )}
      </div>

      {/* Step jump shortcuts */}
      {step < STEPS.length - 1 && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Cliquez sur les étapes complétées pour y revenir directement.
        </p>
      )}
    </div>
  );
}
