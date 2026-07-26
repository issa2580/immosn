import { useSyncExternalStore } from "react";
import { GOLD } from "../data";

// ─── Types ────────────────────────────────────────────────────────────────────
export type OfferStatus = "reçue" | "négociation" | "acceptée" | "contrat" | "finalisée" | "annulée";

export interface OfferHistoryEvent {
  id: number;
  date: string;
  action: string;
  by: string;
  note?: string;
}

export interface Offer {
  id: number;
  propId: number;
  propTitle: string;
  propRef: string;
  propImg: string;
  propPrice: number;
  propTransaction: string;
  prospectName: string;
  prospectPhone: string;
  agentName: string;
  montant: number;
  statut: OfferStatus;
  commentaire: string;
  createdAt: string;
  updatedAt: string;
  history: OfferHistoryEvent[];
}

// ─── Status config ────────────────────────────────────────────────────────────
export const OFFER_STATUS_CFG: Record<OfferStatus, {
  label: string; bg: string; text: string; dot: string; color: string; step: number;
}> = {
  reçue:       { label: "Offre reçue",           bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400",    color: "#3B82F6", step: 0 },
  négociation: { label: "En négociation",         bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   color: "#D97706", step: 1 },
  acceptée:    { label: "Acceptée",               bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", color: "#16A34A", step: 2 },
  contrat:     { label: "Contrat en préparation", bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-400",  color: "#7C3AED", step: 3 },
  finalisée:   { label: "Finalisée",              bg: "bg-[#FDF6E7]",  text: "text-[#C9963A]",   dot: "bg-[#C9963A]",   color: GOLD,      step: 4 },
  annulée:     { label: "Annulée",                bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400",     color: "#EF4444", step: 5 },
};

export const OFFER_STATUS_ORDER: OfferStatus[] = ["reçue", "négociation", "acceptée", "contrat", "finalisée", "annulée"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function now() { return new Date().toISOString().split("T")[0]; }
let _hid = 200;
function evt(action: string, by = "Amadou Ba", note?: string): OfferHistoryEvent {
  return { id: _hid++, date: now(), action, by, note };
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_OFFERS: Offer[] = [
  {
    id: 1, propId: 7,
    propTitle: "Villa de Luxe Balnéaire", propRef: "IS-2025-007",
    propImg: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=80&h=80&fit=crop",
    propPrice: 250_000_000, propTransaction: "vente",
    prospectName: "Oumar Sarr", prospectPhone: "+221 77 789 01 23",
    agentName: "Amadou Ba", montant: 235_000_000, statut: "négociation",
    commentaire: "Client très sérieux. Premier contact positif. Discussion sur la répartition des frais notariaux.",
    createdAt: "2026-07-05", updatedAt: "2026-07-10",
    history: [
      { id: 201, date: "2026-07-05", action: "Offre reçue",        by: "Amadou Ba",      note: "Première offre à 235 M FCFA." },
      { id: 202, date: "2026-07-10", action: "Mise en négociation", by: "Amadou Ba",      note: "Vendeur souhaite 248 M FCFA. Négociation ouverte." },
    ],
  },
  {
    id: 2, propId: 1,
    propTitle: "Villa Contemporaine d'Exception", propRef: "IS-2025-001",
    propImg: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=80&h=80&fit=crop",
    propPrice: 185_000_000, propTransaction: "vente",
    prospectName: "Moussa Diallo", prospectPhone: "+221 77 123 45 67",
    agentName: "Amadou Ba", montant: 180_000_000, statut: "acceptée",
    commentaire: "Accord verbal obtenu. Attente confirmation écrite du propriétaire.",
    createdAt: "2026-06-28", updatedAt: "2026-07-08",
    history: [
      { id: 203, date: "2026-06-28", action: "Offre reçue",         by: "Amadou Ba",      note: "Offre initiale à 175 M FCFA." },
      { id: 204, date: "2026-07-02", action: "Mise en négociation",  by: "Amadou Ba",      note: "Contre-offre propriétaire : 182 M FCFA." },
      { id: 205, date: "2026-07-05", action: "Montant révisé",       by: "Amadou Ba",      note: "Accord sur 180 M FCFA après négociation." },
      { id: 206, date: "2026-07-08", action: "Offre acceptée",       by: "Amadou Ba",      note: "Propriétaire a accepté le montant de 180 M FCFA." },
    ],
  },
  {
    id: 3, propId: 4,
    propTitle: "Villa Moderne avec Piscine", propRef: "IS-2025-004",
    propImg: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=80&h=80&fit=crop",
    propPrice: 120_000_000, propTransaction: "vente",
    prospectName: "Ibrahima Fall", prospectPhone: "+221 77 345 67 89",
    agentName: "Fatou Diallo", montant: 115_000_000, statut: "reçue",
    commentaire: "Investisseur. Souhaite visiter une seconde fois avant de confirmer.",
    createdAt: "2026-07-16", updatedAt: "2026-07-16",
    history: [
      { id: 207, date: "2026-07-16", action: "Offre reçue", by: "Fatou Diallo", note: "Offre à 115 M FCFA suite à la deuxième visite." },
    ],
  },
  {
    id: 4, propId: 8,
    propTitle: "Villa Les Mamelles", propRef: "IS-2025-008",
    propImg: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=80&h=80&fit=crop&sat=-30",
    propPrice: 310_000_000, propTransaction: "vente",
    prospectName: "Serigne Cheikh Mbaye", prospectPhone: "+221 77 456 78 90",
    agentName: "Amadou Ba", montant: 295_000_000, statut: "contrat",
    commentaire: "Dossier transmis au notaire Me Dieng. Signature prévue fin juillet.",
    createdAt: "2026-06-15", updatedAt: "2026-07-12",
    history: [
      { id: 208, date: "2026-06-15", action: "Offre reçue",           by: "Amadou Ba", note: "Offre initiale 280 M FCFA." },
      { id: 209, date: "2026-06-20", action: "Mise en négociation",    by: "Amadou Ba", note: "Discussion sur financement et délais." },
      { id: 210, date: "2026-06-28", action: "Montant révisé",         by: "Amadou Ba", note: "Accord sur 295 M FCFA." },
      { id: 211, date: "2026-07-02", action: "Offre acceptée",         by: "Amadou Ba", note: "Toutes les parties d'accord." },
      { id: 212, date: "2026-07-12", action: "Contrat en préparation", by: "Amadou Ba", note: "Dossier transmis au notaire Me Dieng." },
    ],
  },
  {
    id: 5, propId: 13,
    propTitle: "Duplex Point E", propRef: "IS-2025-013",
    propImg: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=80&fit=crop",
    propPrice: 600_000, propTransaction: "location",
    prospectName: "Aminata Sow", prospectPhone: "+221 78 234 56 78",
    agentName: "Ousmane Ndiaye", montant: 580_000, statut: "finalisée",
    commentaire: "Bail signé le 10 juillet 2026. Entrée des lieux effectuée.",
    createdAt: "2026-06-25", updatedAt: "2026-07-10",
    history: [
      { id: 213, date: "2026-06-25", action: "Offre reçue",           by: "Ousmane Ndiaye", note: "Demande de location longue durée." },
      { id: 214, date: "2026-06-28", action: "Offre acceptée",         by: "Ousmane Ndiaye", note: "Propriétaire accepte 580 000 FCFA/mois." },
      { id: 215, date: "2026-07-02", action: "Contrat en préparation", by: "Ousmane Ndiaye", note: "Rédaction bail et état des lieux." },
      { id: 216, date: "2026-07-10", action: "Transaction finalisée",  by: "Ousmane Ndiaye", note: "Bail signé. Remise des clés effectuée." },
    ],
  },
  {
    id: 6, propId: 15,
    propTitle: "Terrain Titré Mbour", propRef: "IS-2025-015",
    propImg: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=80&h=80&fit=crop",
    propPrice: 15_000_000, propTransaction: "terrain",
    prospectName: "Ndéye Diallo", prospectPhone: "+221 76 890 12 34",
    agentName: "Ousmane Ndiaye", montant: 13_000_000, statut: "annulée",
    commentaire: "Prospect a trouvé un terrain concurrent moins cher.",
    createdAt: "2026-07-01", updatedAt: "2026-07-08",
    history: [
      { id: 217, date: "2026-07-01", action: "Offre reçue", by: "Ousmane Ndiaye", note: "Offre initiale à 13 M FCFA." },
      { id: 218, date: "2026-07-08", action: "Offre annulée", by: "Ousmane Ndiaye", note: "Prospect a trouvé une alternative moins chère." },
    ],
  },
  {
    id: 7, propId: 2,
    propTitle: "Duplex Prestige Vue Mer", propRef: "IS-2025-002",
    propImg: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=80&fit=crop",
    propPrice: 95_000_000, propTransaction: "vente",
    prospectName: "Rokhaya Diop", prospectPhone: "+221 78 678 90 12",
    agentName: "Fatou Diallo", montant: 92_000_000, statut: "reçue",
    commentaire: "Première offre. Prospect très intéressée, souhaite réponse rapide.",
    createdAt: "2026-07-18", updatedAt: "2026-07-18",
    history: [
      { id: 219, date: "2026-07-18", action: "Offre reçue", by: "Fatou Diallo", note: "Offre à 92 M FCFA, urgence exprimée par le prospect." },
    ],
  },
  {
    id: 8, propId: 10,
    propTitle: "Villa Meublée Almadies", propRef: "IS-2025-010",
    propImg: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=80&h=80&fit=crop",
    propPrice: 800_000, propTransaction: "location",
    prospectName: "Cheikh Mbaye", prospectPhone: "+221 77 567 89 01",
    agentName: "Amadou Ba", montant: 780_000, statut: "finalisée",
    commentaire: "Location annuelle signée. Dépôt de garantie encaissé.",
    createdAt: "2026-06-01", updatedAt: "2026-06-20",
    history: [
      { id: 220, date: "2026-06-01",  action: "Offre reçue",           by: "Amadou Ba", note: "Demande location 1 an." },
      { id: 221, date: "2026-06-05",  action: "Offre acceptée",         by: "Amadou Ba", note: "Accord sur 780 000 FCFA/mois." },
      { id: 222, date: "2026-06-10",  action: "Contrat en préparation", by: "Amadou Ba", note: "Bail en rédaction." },
      { id: 223, date: "2026-06-20",  action: "Transaction finalisée",  by: "Amadou Ba", note: "Bail signé et clés remises." },
    ],
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────
let _offers: Offer[] = INIT_OFFERS.map(o => ({ ...o, history: [...o.history] }));
let _nextId = 9;
const _subs = new Set<() => void>();
function _emit() { _subs.forEach(f => f()); }
function _snap() { return _offers; }
function _sub(fn: () => void) { _subs.add(fn); return () => { _subs.delete(fn); }; }

export function useOffers() { return useSyncExternalStore(_sub, _snap); }

// ─── Actions ──────────────────────────────────────────────────────────────────
function patch(id: number, data: Partial<Offer>, event?: Omit<OfferHistoryEvent, "id">) {
  _offers = _offers.map(o => {
    if (o.id !== id) return o;
    const history = event ? [...o.history, { ...event, id: _hid++ }] : o.history;
    return { ...o, ...data, updatedAt: now(), history };
  });
  _emit();
}

export function addOffer(data: Omit<Offer, "id" | "createdAt" | "updatedAt" | "history">): Offer {
  const offer: Offer = {
    ...data, id: _nextId++, createdAt: now(), updatedAt: now(),
    history: [evt("Offre reçue", data.agentName, `Offre initiale : ${new Intl.NumberFormat("fr-SN").format(data.montant)} FCFA`)],
  };
  _offers = [..._offers, offer];
  _emit();
  return offer;
}

export function updateOffer(id: number, data: Partial<Pick<Offer, "montant" | "commentaire" | "agentName" | "prospectName" | "prospectPhone">>, note?: string) {
  patch(id, data, data.montant ? { date: now(), action: "Montant révisé", by: "Amadou Ba", note } : undefined);
}

export function setOfferStatus(id: number, statut: OfferStatus, by: string, note?: string) {
  const ACTION_LABELS: Record<OfferStatus, string> = {
    reçue:       "Offre réactivée",
    négociation: "Mise en négociation",
    acceptée:    "Offre acceptée",
    contrat:     "Contrat en préparation",
    finalisée:   "Transaction finalisée",
    annulée:     "Offre annulée",
  };
  patch(id, { statut }, { date: now(), action: ACTION_LABELS[statut], by, note });
}

export function deleteOffer(id: number) {
  _offers = _offers.filter(o => o.id !== id);
  _emit();
}
