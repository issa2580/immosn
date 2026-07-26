import { useState, useEffect } from "react";
import {
  User, Bell, Sliders, Building2, Save, RotateCcw, Loader2,
  CheckCircle, Camera, Palette, Phone, Mail, Globe, MapPin,
  Lock, Eye, EyeOff, Shield, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { NAVY, GOLD, B } from "../data";
import {
  useProfile,
  updateProfile, updateNotifPrefs, updateAppPrefs, updateAgence,
  resetProfile, resetNotifPrefs, resetAppPrefs, resetAgence,
  getInitials, INITIAL_STATE,
  type UserProfile, type NotifPrefs, type AppPrefs, type AgenceInfo,
} from "./profileStore";

// ─── Design tokens ────────────────────────────────────────────────────────────
const ic = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#C9963A]/30 transition-all bg-white";
const errIc = "w-full px-4 py-2.5 rounded-xl border border-red-300 text-sm outline-none focus:ring-2 focus:ring-red-200 transition-all bg-white";

const AVATAR_COLORS = [
  "#C9963A", "#0F1C2E", "#16A34A", "#3B82F6",
  "#7C3AED", "#EF4444", "#D97706", "#0891B2",
  "#DB2777", "#059669", "#6366F1", "#64748B",
];

// ─── Shared UI components ─────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className="relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer"
      style={{ background: checked ? GOLD : "#E5E7EB" }}
    >
      <span
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200"
        style={{ left: checked ? "calc(100% - 20px)" : "4px" }}
      />
    </button>
  );
}

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
      style={{
        background: selected ? GOLD : "white",
        color: selected ? "white" : "#6B7280",
        borderColor: selected ? GOLD : B,
      }}
    >
      {label}
    </button>
  );
}

function Field({ label, error, children, required, hint }: {
  label: string; error?: string; children: React.ReactNode; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: NAVY }}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1">{error}</p>}
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-5"
      style={{ background: "#F0FDF4", borderColor: "#BBF7D0", animation: "fadeIn 0.3s ease" }}
    >
      <CheckCircle size={16} className="text-emerald-500 shrink-0" />
      <span className="text-sm font-semibold text-emerald-700">{message}</span>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: B }}>
      {(title || subtitle) && (
        <div className="mb-5 pb-4 border-b" style={{ borderColor: B }}>
          <h3 className="font-bold text-base" style={{ color: NAVY, fontFamily: "'Playfair Display',serif" }}>{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function SaveBar({ isDirty, saving, onSave, onReset }: {
  isDirty: boolean; saving: boolean; onSave: () => void; onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-4 mt-2 border-t" style={{ borderColor: B }}>
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
        style={{ borderColor: B, color: "#6B7280" }}
      >
        <RotateCcw size={14} />Réinitialiser
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!isDirty || saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
        style={{ background: isDirty && !saving ? GOLD : "#9CA3AF" }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {saving ? "Enregistrement…" : isDirty ? "Enregistrer les modifications" : "Aucune modification"}
      </button>
    </div>
  );
}

// ─── Color picker modal ───────────────────────────────────────────────────────
function ColorPicker({ current, onSelect, onClose }: {
  current: string; onSelect: (c: string) => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 shadow-2xl"
        style={{ width: 320 }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-bold mb-4 text-base" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>
          Couleur de l'avatar
        </h3>
        <div className="grid grid-cols-4 gap-3 mb-5">
          {AVATAR_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onSelect(c)}
              className="w-14 h-14 rounded-xl transition-transform hover:scale-110 relative flex items-center justify-center"
              style={{ background: c }}
            >
              {current === c && (
                <CheckCircle size={18} className="text-white" />
              )}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
          style={{ borderColor: B, color: "#6B7280" }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Profil ──────────────────────────────────────────────────────────────
function ProfilTab() {
  const state = useProfile();
  const [form, setForm] = useState<UserProfile>({ ...state.profile });
  const [errors, setErrors] = useState<Partial<Record<keyof UserProfile, string>>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(state.profile);

  const upd = (p: Partial<UserProfile>) => {
    setForm(f => ({ ...f, ...p }));
    setErrors(e => {
      const copy = { ...e };
      (Object.keys(p) as (keyof UserProfile)[]).forEach(k => { delete copy[k]; });
      return copy;
    });
  };

  const validate = () => {
    const e: Partial<Record<keyof UserProfile, string>> = {};
    if (!form.prenom.trim())   e.prenom = "Le prénom est requis";
    if (!form.nom.trim())      e.nom = "Le nom est requis";
    if (!form.title.trim())    e.title = "Le titre est requis";
    if (!form.email.trim())    e.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Format email invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      updateProfile(form);
      setSaving(false);
      setSuccess(true);
      toast.success("Profil mis à jour avec succès");
      setTimeout(() => setSuccess(false), 4000);
    }, 650);
  };

  const handleReset = () => {
    setForm({ ...INITIAL_STATE.profile });
    resetProfile();
    setErrors({});
    toast.info("Profil réinitialisé");
  };

  const handlePwSave = () => {
    if (!pw.current) { toast.error("Saisissez votre mot de passe actuel"); return; }
    if (pw.next.length < 8) { toast.error("Le mot de passe doit faire au moins 8 caractères"); return; }
    if (pw.next !== pw.confirm) { toast.error("Les mots de passe ne correspondent pas"); return; }
    setTimeout(() => {
      setPw({ current: "", next: "", confirm: "" });
      setShowPwForm(false);
      toast.success("Mot de passe modifié avec succès");
    }, 700);
  };

  const initials = `${form.prenom[0] ?? "?"}${form.nom[0] ?? "?"}`.toUpperCase();

  return (
    <div className="space-y-5">
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
      {success && <SuccessBanner message="Profil enregistré. Les changements sont visibles dans la barre latérale." />}

      {/* Avatar card */}
      <SectionCard title="Identité visuelle" subtitle="Votre avatar est affiché dans la topbar et le menu latéral.">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold select-none"
              style={{ background: form.accentColor, fontFamily: "'Playfair Display',serif" }}
            >
              {initials}
            </div>
            <button
              onClick={() => setColorOpen(true)}
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-white border shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
              style={{ borderColor: B }}
              title="Changer la couleur"
            >
              <Palette size={14} style={{ color: GOLD }} />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg leading-tight truncate" style={{ color: NAVY, fontFamily: "'Playfair Display',serif" }}>
              {form.prenom || "Prénom"} {form.nom || "Nom"}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">{form.title || "Titre"}</div>
            <div className="text-xs text-gray-400 mt-1">{form.email}</div>
            <button
              onClick={() => setColorOpen(true)}
              className="text-xs font-semibold mt-2 flex items-center gap-1 hover:underline"
              style={{ color: GOLD }}
            >
              <Palette size={11} />Changer la couleur de l'avatar
            </button>
          </div>
        </div>
        {colorOpen && (
          <ColorPicker
            current={form.accentColor}
            onSelect={c => { upd({ accentColor: c }); setColorOpen(false); }}
            onClose={() => setColorOpen(false)}
          />
        )}
      </SectionCard>

      {/* Personal info */}
      <SectionCard title="Informations personnelles">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Prénom" required error={errors.prenom}>
            <input
              className={errors.prenom ? errIc : ic}
              value={form.prenom}
              onChange={e => upd({ prenom: e.target.value })}
              placeholder="Amadou"
              style={{ borderColor: errors.prenom ? undefined : B }}
            />
          </Field>
          <Field label="Nom" required error={errors.nom}>
            <input
              className={errors.nom ? errIc : ic}
              value={form.nom}
              onChange={e => upd({ nom: e.target.value })}
              placeholder="Ba"
              style={{ borderColor: errors.nom ? undefined : B }}
            />
          </Field>
          <Field label="Titre / Poste" required error={errors.title}>
            <input
              className={errors.title ? errIc : ic}
              value={form.title}
              onChange={e => upd({ title: e.target.value })}
              placeholder="Directeur Commercial"
              style={{ borderColor: errors.title ? undefined : B }}
            />
          </Field>
          <Field label="Téléphone" hint="Format : +221 77 XXX XX XX">
            <div className="relative">
              <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={ic + " pl-9"}
                value={form.phone}
                onChange={e => upd({ phone: e.target.value })}
                placeholder="+221 77 123 45 67"
                style={{ borderColor: B }}
              />
            </div>
          </Field>
          <Field label="Email professionnel" required error={errors.email} className="sm:col-span-2">
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={(errors.email ? errIc : ic) + " pl-9"}
                type="email"
                value={form.email}
                onChange={e => upd({ email: e.target.value })}
                placeholder="amadou.ba@immosenegal.sn"
                style={{ borderColor: errors.email ? undefined : B }}
              />
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Biographie" hint="Visible sur votre profil interne.">
              <textarea
                className={ic + " resize-none"}
                rows={3}
                value={form.bio}
                onChange={e => upd({ bio: e.target.value })}
                placeholder="Décrivez votre expertise et votre rôle dans l'agence…"
                style={{ borderColor: B }}
              />
            </Field>
          </div>
        </div>
        <SaveBar isDirty={isDirty} saving={saving} onSave={handleSave} onReset={handleReset} />
      </SectionCard>

      {/* Security */}
      <SectionCard title="Sécurité" subtitle="Gérez votre mot de passe de connexion.">
        {!showPwForm ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}15`, color: GOLD }}>
                <Lock size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: NAVY }}>Mot de passe</div>
                <div className="text-xs text-gray-400">Dernière modification il y a 3 mois</div>
              </div>
            </div>
            <button
              onClick={() => setShowPwForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors hover:bg-gray-50"
              style={{ borderColor: B, color: NAVY }}
            >
              <Shield size={14} />Modifier
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Mot de passe actuel" required>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? "text" : "password"}
                  className={ic + " pl-9 pr-9"}
                  value={pw.current}
                  onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                  placeholder="Votre mot de passe actuel"
                  style={{ borderColor: B }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nouveau mot de passe" hint="8 caractères minimum">
                <input
                  type="password"
                  className={ic}
                  value={pw.next}
                  onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                  placeholder="••••••••"
                  style={{ borderColor: B }}
                />
              </Field>
              <Field label="Confirmer">
                <input
                  type="password"
                  className={ic}
                  value={pw.confirm}
                  onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="••••••••"
                  style={{ borderColor: B }}
                />
              </Field>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => { setShowPwForm(false); setPw({ current:"", next:"", confirm:"" }); }}
                className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
                style={{ borderColor: B, color: "#6B7280" }}
              >
                Annuler
              </button>
              <button
                onClick={handlePwSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: GOLD }}
              >
                <Save size={14} />Changer le mot de passe
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────
function NotificationsTab() {
  const { notifPrefs } = useProfile();

  const toggle = (key: keyof NotifPrefs) => {
    const next = !notifPrefs[key];
    updateNotifPrefs({ [key]: next });
    toast.success(next ? "Notification activée" : "Notification désactivée");
  };

  const handleReset = () => {
    resetNotifPrefs();
    toast.info("Préférences de notifications réinitialisées");
  };

  const appNotifs: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key:"nouveauProspect",      label:"Nouveau prospect",       desc:"Quand un prospect est ajouté au pipeline"      },
    { key:"demandeVisite",        label:"Demande de visite",      desc:"Quand une visite est planifiée"                },
    { key:"visiteConfirmee",      label:"Visite confirmée",       desc:"Quand le statut passe à « confirmée »"         },
    { key:"nouvelleOffre",        label:"Nouvelle offre reçue",   desc:"Quand une offre est soumise sur un bien"       },
    { key:"changementStatut",     label:"Changement de statut",   desc:"À chaque transition de statut d'une offre"    },
    { key:"transactionFinalisee", label:"Transaction finalisée",  desc:"Quand une transaction est conclue"             },
  ];

  const channels: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key:"emailNotifs", label:"Email",        desc:"Recevoir un récapitulatif par email"        },
    { key:"smsNotifs",   label:"SMS",          desc:"Alertes SMS pour les événements critiques" },
    { key:"soundNotifs", label:"Son",          desc:"Jouer un son lors des nouvelles notifications" },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="Notifications in-app" subtitle="Contrôlez quels événements génèrent une notification dans l'interface.">
        <div className="space-y-0.5">
          {appNotifs.map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3.5 border-b last:border-0"
              style={{ borderColor: B }}
            >
              <div className="pr-4">
                <div className="text-sm font-semibold" style={{ color: NAVY }}>{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
              </div>
              <Toggle checked={notifPrefs[key]} onChange={() => toggle(key)} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Canaux de diffusion" subtitle="Comment souhaitez-vous être notifié ?">
        <div className="space-y-0.5">
          {channels.map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3.5 border-b last:border-0"
              style={{ borderColor: B }}
            >
              <div className="pr-4">
                <div className="text-sm font-semibold" style={{ color: NAVY }}>{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
              </div>
              <Toggle checked={notifPrefs[key]} onChange={() => toggle(key)} />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4 border-t mt-2" style={{ borderColor: B }}>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
            style={{ borderColor: B, color: "#6B7280" }}
          >
            <RotateCcw size={13} />Réinitialiser
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Préférences ─────────────────────────────────────────────────────────
function PreferencesTab() {
  const { appPrefs } = useProfile();
  const [form, setForm] = useState({ ...appPrefs });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(appPrefs);
  const upd = (p: Partial<typeof form>) => setForm(f => ({ ...f, ...p }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      updateAppPrefs(form);
      setSaving(false);
      setSuccess(true);
      toast.success("Préférences enregistrées");
      setTimeout(() => setSuccess(false), 4000);
    }, 600);
  };

  const handleReset = () => {
    const init = { ...INITIAL_STATE.appPrefs };
    setForm(init);
    resetAppPrefs();
    toast.info("Préférences réinitialisées");
  };

  return (
    <div className="space-y-5">
      {success && <SuccessBanner message="Préférences enregistrées avec succès." />}

      <SectionCard title="Langue et région" subtitle="Paramètres d'affichage de l'interface.">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-3" style={{ color: NAVY }}>Langue</label>
            <div className="flex gap-2">
              <Pill label="Français" selected={form.langue === "fr"} onClick={() => upd({ langue: "fr" })} />
              <Pill label="English" selected={form.langue === "en"} onClick={() => upd({ langue: "en" })} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-3" style={{ color: NAVY }}>Format de date</label>
            <div className="flex flex-wrap gap-2">
              {(["dd/mm/yyyy", "yyyy-mm-dd", "dd mmm yyyy"] as const).map(f => (
                <Pill key={f} label={f.toUpperCase()} selected={form.formatDate === f} onClick={() => upd({ formatDate: f })} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Exemple : {form.formatDate === "dd/mm/yyyy" ? "19/07/2026" : form.formatDate === "yyyy-mm-dd" ? "2026-07-19" : "19 Jul 2026"}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-3" style={{ color: NAVY }}>Format d'heure</label>
            <div className="flex gap-2">
              <Pill label="24h (14:30)" selected={form.formatHeure === "24h"} onClick={() => upd({ formatHeure: "24h" })} />
              <Pill label="12h (2:30 PM)" selected={form.formatHeure === "12h"} onClick={() => upd({ formatHeure: "12h" })} />
            </div>
          </div>
        </div>
        <SaveBar isDirty={isDirty} saving={saving} onSave={handleSave} onReset={handleReset} />
      </SectionCard>

      <SectionCard title="Affichage financier" subtitle="Format des montants dans les rapports et fiches bien.">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-3" style={{ color: NAVY }}>Devise principale</label>
          <div className="flex flex-wrap gap-2">
            {(["FCFA", "EUR", "USD"] as const).map(d => (
              <Pill key={d} label={d} selected={form.devise === d} onClick={() => upd({ devise: d })} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Exemple : {form.devise === "FCFA" ? "185 000 000 FCFA" : form.devise === "EUR" ? "282 300 €" : "$305 700"}
          </p>
        </div>
        <SaveBar isDirty={isDirty} saving={saving} onSave={handleSave} onReset={handleReset} />
      </SectionCard>
    </div>
  );
}

// ─── Tab: Agence ──────────────────────────────────────────────────────────────
function AgenceTab() {
  const { agence } = useProfile();
  const [form, setForm] = useState<AgenceInfo>({ ...agence });
  const [errors, setErrors] = useState<Partial<Record<keyof AgenceInfo, string>>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(agence);
  const upd = (p: Partial<AgenceInfo>) => {
    setForm(f => ({ ...f, ...p }));
    setErrors(e => { const c = { ...e }; (Object.keys(p) as (keyof AgenceInfo)[]).forEach(k => { delete c[k]; }); return c; });
  };

  const validate = () => {
    const e: Partial<Record<keyof AgenceInfo, string>> = {};
    if (!form.nom.trim()) e.nom = "Le nom de l'agence est requis";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Format email invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      updateAgence(form);
      setSaving(false);
      setSuccess(true);
      toast.success("Informations de l'agence mises à jour");
      setTimeout(() => setSuccess(false), 4000);
    }, 600);
  };

  const handleReset = () => {
    setForm({ ...INITIAL_STATE.agence });
    resetAgence();
    setErrors({});
    toast.info("Informations agence réinitialisées");
  };

  return (
    <div className="space-y-5">
      {success && <SuccessBanner message="Informations de l'agence enregistrées avec succès." />}

      <SectionCard title="Identité de l'agence" subtitle="Ces informations apparaissent dans vos documents et communications.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Nom de l'agence" required error={errors.nom}>
              <div className="relative">
                <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className={(errors.nom ? errIc : ic) + " pl-9"}
                  value={form.nom}
                  onChange={e => upd({ nom: e.target.value })}
                  placeholder="ImmoSénégal"
                  style={{ borderColor: errors.nom ? undefined : B }}
                />
              </div>
            </Field>
          </div>

          <Field label="SIRET / NINEA">
            <input className={ic} value={form.siret} onChange={e => upd({ siret: e.target.value })}
              placeholder="SN-2019-B-09812" style={{ borderColor: B }} />
          </Field>

          <Field label="Adresse">
            <div className="relative">
              <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className={ic + " pl-9"} value={form.adresse} onChange={e => upd({ adresse: e.target.value })}
                placeholder="25, Avenue Cheikh Anta Diop" style={{ borderColor: B }} />
            </div>
          </Field>

          <Field label="Ville">
            <input className={ic} value={form.ville} onChange={e => upd({ ville: e.target.value })}
              placeholder="Dakar" style={{ borderColor: B }} />
          </Field>

          <Field label="Téléphone">
            <div className="relative">
              <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className={ic + " pl-9"} value={form.phone} onChange={e => upd({ phone: e.target.value })}
                placeholder="+221 33 821 45 67" style={{ borderColor: B }} />
            </div>
          </Field>

          <Field label="Email" error={errors.email}>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={(errors.email ? errIc : ic) + " pl-9"}
                type="email"
                value={form.email}
                onChange={e => upd({ email: e.target.value })}
                placeholder="contact@immosenegal.sn"
                style={{ borderColor: errors.email ? undefined : B }}
              />
            </div>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Site web">
              <div className="relative">
                <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className={ic + " pl-9"} value={form.siteWeb} onChange={e => upd({ siteWeb: e.target.value })}
                  placeholder="www.immosenegal.sn" style={{ borderColor: B }} />
              </div>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Description" hint="Courte présentation de l'agence.">
              <textarea className={ic + " resize-none"} rows={3}
                value={form.description} onChange={e => upd({ description: e.target.value })}
                placeholder="Décrivez votre agence…" style={{ borderColor: B }} />
            </Field>
          </div>
        </div>
        <SaveBar isDirty={isDirty} saving={saving} onSave={handleSave} onReset={handleReset} />
      </SectionCard>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Tab = "profil" | "notifications" | "preferences" | "agence";

const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id:"profil",         label:"Profil",          icon:User,     desc:"Identité, contact, sécurité"   },
  { id:"notifications",  label:"Notifications",   icon:Bell,     desc:"Alertes et canaux"              },
  { id:"preferences",    label:"Préférences",     icon:Sliders,  desc:"Langue, format, devise"         },
  { id:"agence",         label:"Agence",          icon:Building2,desc:"Informations de l'agence"       },
];

export default function ParametresPage() {
  const [tab, setTab] = useState<Tab>("profil");
  const { profile } = useProfile();

  return (
    <div className="min-h-full" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#F8F6F2" }}>
      <div className="p-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily:"'Playfair Display',serif", color:NAVY }}>
            Paramètres
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gérez votre profil, vos préférences et les informations de l'agence.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left tab nav ─────────────────────────────────────────────── */}
          <aside className="lg:w-60 shrink-0">
            {/* Profile summary card */}
            <div className="bg-white rounded-2xl border p-4 mb-3" style={{ borderColor: B }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: profile.accentColor, fontFamily:"'Playfair Display',serif" }}
                >
                  {getInitials(profile)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: NAVY }}>
                    {profile.prenom} {profile.nom}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{profile.title}</div>
                </div>
              </div>
            </div>

            {/* Tab list */}
            <nav className="space-y-1">
              {TABS.map(({ id, label, icon: Icon, desc }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm"
                    style={{
                      background: active ? `${GOLD}12` : "transparent",
                      color: active ? GOLD : "#6B7280",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
                      style={{ background: active ? `${GOLD}20` : "#F3F4F6", color: active ? GOLD : "#9CA3AF" }}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight truncate">{label}</div>
                      <div className="text-xs opacity-60 truncate">{desc}</div>
                    </div>
                    {active && (
                      <ChevronRight size={14} className="ml-auto shrink-0" style={{ color: GOLD }} />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── Right content ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {tab === "profil"        && <ProfilTab />}
            {tab === "notifications" && <NotificationsTab />}
            {tab === "preferences"   && <PreferencesTab />}
            {tab === "agence"        && <AgenceTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
