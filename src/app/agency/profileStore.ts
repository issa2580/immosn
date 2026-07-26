import { useSyncExternalStore } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  prenom: string;
  nom: string;
  email: string;
  phone: string;
  title: string;
  bio: string;
  accentColor: string;
}

export interface NotifPrefs {
  nouveauProspect: boolean;
  demandeVisite: boolean;
  visiteConfirmee: boolean;
  nouvelleOffre: boolean;
  changementStatut: boolean;
  transactionFinalisee: boolean;
  emailNotifs: boolean;
  smsNotifs: boolean;
  soundNotifs: boolean;
}

export interface AppPrefs {
  langue: "fr" | "en";
  formatDate: "dd/mm/yyyy" | "yyyy-mm-dd" | "dd mmm yyyy";
  formatHeure: "24h" | "12h";
  devise: "FCFA" | "EUR" | "USD";
}

export interface AgenceInfo {
  nom: string;
  adresse: string;
  ville: string;
  phone: string;
  email: string;
  siteWeb: string;
  siret: string;
  description: string;
}

export interface ProfileState {
  profile:     UserProfile;
  notifPrefs:  NotifPrefs;
  appPrefs:    AppPrefs;
  agence:      AgenceInfo;
}

// ─── Initial data ─────────────────────────────────────────────────────────────
export const INITIAL_STATE: ProfileState = {
  profile: {
    prenom:       "Amadou",
    nom:          "Ba",
    email:        "amadou.ba@immosenegal.sn",
    phone:        "+221 77 123 45 67",
    title:        "Directeur Commercial",
    bio:          "Directeur commercial chez ImmoSénégal depuis 2020. Spécialiste en immobilier de prestige sur la région de Dakar et les zones balnéaires.",
    accentColor:  "#C9963A",
  },
  notifPrefs: {
    nouveauProspect:      true,
    demandeVisite:        true,
    visiteConfirmee:      true,
    nouvelleOffre:        true,
    changementStatut:     false,
    transactionFinalisee: true,
    emailNotifs:          true,
    smsNotifs:            false,
    soundNotifs:          true,
  },
  appPrefs: {
    langue:      "fr",
    formatDate:  "dd/mm/yyyy",
    formatHeure: "24h",
    devise:      "FCFA",
  },
  agence: {
    nom:         "ImmoSénégal",
    adresse:     "25, Avenue Cheikh Anta Diop",
    ville:       "Dakar",
    phone:       "+221 33 821 45 67",
    email:       "contact@immosenegal.sn",
    siteWeb:     "www.immosenegal.sn",
    siret:       "SN-2019-B-09812",
    description: "Agence immobilière premium spécialisée dans l'immobilier de prestige à Dakar et dans les principales villes du Sénégal.",
  },
};

// ─── Store ────────────────────────────────────────────────────────────────────
let _state: ProfileState = JSON.parse(JSON.stringify(INITIAL_STATE));
const _subs = new Set<() => void>();
function _emit() { _subs.forEach(f => f()); }
function _snap() { return _state; }
function _sub(fn: () => void) { _subs.add(fn); return () => { _subs.delete(fn); }; }

export function useProfile() { return useSyncExternalStore(_sub, _snap); }

// ─── Actions ──────────────────────────────────────────────────────────────────
export function updateProfile(patch: Partial<UserProfile>) {
  _state = { ..._state, profile: { ..._state.profile, ...patch } };
  _emit();
}

export function updateNotifPrefs(patch: Partial<NotifPrefs>) {
  _state = { ..._state, notifPrefs: { ..._state.notifPrefs, ...patch } };
  _emit();
}

export function updateAppPrefs(patch: Partial<AppPrefs>) {
  _state = { ..._state, appPrefs: { ..._state.appPrefs, ...patch } };
  _emit();
}

export function updateAgence(patch: Partial<AgenceInfo>) {
  _state = { ..._state, agence: { ..._state.agence, ...patch } };
  _emit();
}

export function resetProfile()    { _state = { ..._state, profile:    JSON.parse(JSON.stringify(INITIAL_STATE.profile)) };    _emit(); }
export function resetNotifPrefs() { _state = { ..._state, notifPrefs: JSON.parse(JSON.stringify(INITIAL_STATE.notifPrefs)) }; _emit(); }
export function resetAppPrefs()   { _state = { ..._state, appPrefs:   JSON.parse(JSON.stringify(INITIAL_STATE.appPrefs)) };   _emit(); }
export function resetAgence()     { _state = { ..._state, agence:     JSON.parse(JSON.stringify(INITIAL_STATE.agence)) };     _emit(); }

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getInitials(p: UserProfile) {
  return `${p.prenom[0] ?? "?"}${p.nom[0] ?? "?"}`.toUpperCase();
}
