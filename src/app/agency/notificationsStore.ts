import { useSyncExternalStore } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotifType =
  | "prospect"
  | "visite_demande"
  | "visite_confirmée"
  | "offre"
  | "statut"
  | "transaction";

export interface Notification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_NOTIFS: Notification[] = [
  {
    id: 1, type: "transaction",
    title: "Transaction finalisée",
    message: "Location Villa Meublée Almadies confirmée pour Cheikh Mbaye — 780 000 FCFA/mois",
    read: false, createdAt: "2026-07-19T15:00:00", link: "/agence/offres",
  },
  {
    id: 2, type: "offre",
    title: "Nouvelle offre reçue",
    message: "Rokhaya Diop propose 92 000 000 FCFA pour Duplex Prestige Vue Mer",
    read: false, createdAt: "2026-07-19T12:30:00", link: "/agence/offres",
  },
  {
    id: 3, type: "visite_demande",
    title: "Demande de visite",
    message: "Ibrahima Fall souhaite visiter Villa Moderne avec Piscine le 22 juillet",
    read: false, createdAt: "2026-07-19T09:00:00", link: "/agence/visites",
  },
  {
    id: 4, type: "prospect",
    title: "Nouveau prospect",
    message: "Marième Sall s'intéresse à Villa Contemporaine d'Exception — budget 180 M FCFA",
    read: false, createdAt: "2026-07-18T16:00:00", link: "/agence/clients",
  },
  {
    id: 5, type: "visite_confirmée",
    title: "Visite confirmée",
    message: "La visite de Moussa Diallo pour Villa Contemporaine est confirmée le 20 juillet",
    read: true, createdAt: "2026-07-18T10:00:00", link: "/agence/visites",
  },
  {
    id: 6, type: "statut",
    title: "Changement de statut",
    message: "Offre Villa Les Mamelles — passage en Contrat en préparation",
    read: true, createdAt: "2026-07-17T14:00:00", link: "/agence/offres",
  },
  {
    id: 7, type: "transaction",
    title: "Transaction finalisée",
    message: "Bail signé — Duplex Point E pour Aminata Sow à 580 000 FCFA/mois",
    read: true, createdAt: "2026-07-16T11:00:00", link: "/agence/offres",
  },
  {
    id: 8, type: "visite_demande",
    title: "Demande de visite",
    message: "Ndéye Diallo souhaite visiter Terrain Titré Mbour — à planifier",
    read: true, createdAt: "2026-07-15T09:00:00", link: "/agence/visites",
  },
  {
    id: 9, type: "statut",
    title: "Offre acceptée",
    message: "Accord obtenu sur la Villa Contemporaine pour Moussa Diallo à 180 000 000 FCFA",
    read: true, createdAt: "2026-07-14T16:00:00", link: "/agence/offres",
  },
  {
    id: 10, type: "prospect",
    title: "Nouveau prospect",
    message: "Ibrahim Kouyaté cherche un appartement à Dakar — budget 450 000 FCFA/mois",
    read: true, createdAt: "2026-07-13T10:00:00", link: "/agence/clients",
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────
let _notifs: Notification[] = [...INIT_NOTIFS];
let _nextId = 11;
const _subs = new Set<() => void>();
function _emit() { _subs.forEach(f => f()); }
function _snap() { return _notifs; }
function _sub(fn: () => void) { _subs.add(fn); return () => { _subs.delete(fn); }; }

export function useNotifications() { return useSyncExternalStore(_sub, _snap); }

// ─── Actions ──────────────────────────────────────────────────────────────────
export function pushNotif(n: Omit<Notification, "id" | "createdAt" | "read">): Notification {
  const notif: Notification = { ...n, id: _nextId++, createdAt: new Date().toISOString(), read: false };
  _notifs = [notif, ..._notifs];
  _emit();
  return notif;
}

export function markRead(id: number) {
  _notifs = _notifs.map(n => n.id === id ? { ...n, read: true } : n);
  _emit();
}

export function markAllRead() {
  _notifs = _notifs.map(n => ({ ...n, read: true }));
  _emit();
}

export function deleteNotif(id: number) {
  _notifs = _notifs.filter(n => n.id !== id);
  _emit();
}

export function clearAll() {
  _notifs = [];
  _emit();
}
