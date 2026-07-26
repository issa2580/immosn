import { useSyncExternalStore } from "react";
import { AGENTS } from "../data";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Specialite = "Vente" | "Location" | "Terrain & Foncier" | "Luxe & Prestige" | "Commerce & Bureaux";

export interface AgentFull {
  id: number;
  name: string;
  title: string;
  specialite: Specialite;
  zone: string;
  phone: string;
  whatsapp: string;
  email: string;
  avatar: string;
  actif: boolean;
  dateEntree: string;
  tauxCommission: number; // %
  bio: string;
  rating: number;
  commissionHistorique: number; // FCFA pre-existing
  prospectIds: number[];
  visitIds: number[];
}

// ─── Mock cross-module data ───────────────────────────────────────────────────
export interface MockProspect {
  id: number;
  name: string;
  phone: string;
  type: string;
  budget: number;
  stage: string;
}

export interface MockVisit {
  id: number;
  propTitle: string;
  propRef: string;
  date: string;
  heure: string;
  prospectName: string;
  statut: string;
}

export const MOCK_PROSPECTS: MockProspect[] = [
  { id: 1, name: "Moussa Diallo",  phone: "+221 77 123 45 67", type: "Acheteur",    budget: 150_000_000, stage: "Visite planifiée" },
  { id: 2, name: "Fatou Ndiaye",   phone: "+221 76 456 78 90", type: "Locataire",   budget: 500_000,     stage: "Contacté"         },
  { id: 3, name: "Cheikh Mbaye",   phone: "+221 77 567 89 01", type: "Acheteur",    budget: 80_000_000,  stage: "Qualifié"         },
  { id: 4, name: "Rokhaya Diop",   phone: "+221 78 678 90 12", type: "Acheteur",    budget: 90_000_000,  stage: "Planifiée"        },
  { id: 5, name: "Ibrahima Fall",  phone: "+221 77 345 67 89", type: "Investisseur",budget: 200_000_000, stage: "Planifiée"        },
  { id: 6, name: "Aminata Sow",    phone: "+221 78 234 56 78", type: "Locataire",   budget: 400_000,     stage: "Confirmée"        },
  { id: 7, name: "Ndéye Diallo",   phone: "+221 76 890 12 34", type: "Acheteur",    budget: 35_000_000,  stage: "Nouveau"          },
  { id: 8, name: "Oumar Sarr",     phone: "+221 77 789 01 23", type: "Acheteur",    budget: 300_000_000, stage: "Offre"            },
];

export const MOCK_VISITS: MockVisit[] = [
  { id: 1, propTitle: "Villa Balnéaire Saly",             propRef: "IS-2025-007", date: "2026-07-18", heure: "15:00", prospectName: "Oumar Sarr",    statut: "effectuée" },
  { id: 2, propTitle: "Appartement de Prestige",           propRef: "IS-2025-003", date: "2026-07-17", heure: "10:00", prospectName: "Fatou Ndiaye",  statut: "annulée"   },
  { id: 3, propTitle: "Appartement Moderne Meublé",        propRef: "IS-2025-009", date: "2026-07-19", heure: "09:30", prospectName: "Cheikh Mbaye",  statut: "reportée"  },
  { id: 4, propTitle: "Villa Contemporaine d'Exception",   propRef: "IS-2025-001", date: "2026-07-20", heure: "10:00", prospectName: "Moussa Diallo", statut: "confirmée" },
  { id: 5, propTitle: "Duplex Prestige Vue Mer",           propRef: "IS-2025-002", date: "2026-07-20", heure: "14:30", prospectName: "Rokhaya Diop",  statut: "planifiée" },
  { id: 6, propTitle: "Villa Moderne avec Piscine",        propRef: "IS-2025-004", date: "2026-07-22", heure: "09:00", prospectName: "Ibrahima Fall", statut: "planifiée" },
  { id: 7, propTitle: "Villa Meublée Almadies",            propRef: "IS-2025-010", date: "2026-07-24", heure: "11:00", prospectName: "Aminata Sow",   statut: "confirmée" },
  { id: 8, propTitle: "Terrain Balnéaire Saly",            propRef: "IS-2025-016", date: "2026-07-26", heure: "16:00", prospectName: "Ndéye Diallo",  statut: "planifiée" },
];

// ─── Initial agent data ───────────────────────────────────────────────────────
const INIT: AgentFull[] = [
  {
    id: 1,
    name:             AGENTS[0].name,
    title:            AGENTS[0].title,
    specialite:       "Luxe & Prestige",
    zone:             "Dakar — Almadies, Ngor, Les Mamelles",
    phone:            AGENTS[0].phone,
    whatsapp:         AGENTS[0].whatsapp,
    email:            AGENTS[0].email,
    avatar:           AGENTS[0].avatar,
    actif:            true,
    dateEntree:       "2020-03-01",
    tauxCommission:   4.0,
    bio:              "Fondateur et directeur commercial d'ImmoSénégal. Avec plus de 12 ans d'expérience dans l'immobilier de luxe à Dakar, Amadou accompagne une clientèle VIP nationale et internationale. Spécialiste des biens d'exception et des transactions à haute valeur ajoutée.",
    rating:           4.9,
    commissionHistorique: 18_400_000,
    prospectIds:      [1, 5],
    visitIds:         [4, 6],
  },
  {
    id: 2,
    name:             AGENTS[1].name,
    title:            AGENTS[1].title,
    specialite:       "Location",
    zone:             "Dakar — Plateau, Mermoz, Point E, Yoff",
    phone:            AGENTS[1].phone,
    whatsapp:         AGENTS[1].whatsapp,
    email:            AGENTS[1].email,
    avatar:           AGENTS[1].avatar,
    actif:            true,
    dateEntree:       "2021-06-15",
    tauxCommission:   3.5,
    bio:              "Spécialiste de la gestion locative et des baux résidentiels haut de gamme. Fatou est reconnue pour son écoute client et sa réactivité. Elle gère un portefeuille de plus de 40 biens en location longue durée pour expatriés et familles.",
    rating:           4.8,
    commissionHistorique: 8_750_000,
    prospectIds:      [2, 6],
    visitIds:         [2, 7],
  },
  {
    id: 3,
    name:             AGENTS[2].name,
    title:            AGENTS[2].title,
    specialite:       "Terrain & Foncier",
    zone:             "Mbour, Thiès, Rufisque",
    phone:            AGENTS[2].phone,
    whatsapp:         AGENTS[2].whatsapp,
    email:            AGENTS[2].email,
    avatar:           AGENTS[2].avatar,
    actif:            true,
    dateEntree:       "2022-09-01",
    tauxCommission:   3.0,
    bio:              "Expert foncier certifié avec une connaissance approfondie du marché des terrains au Sénégal. Ousmane conseille investisseurs et promoteurs sur les opportunités de développement en zones littorales et périurbaines. Maîtrise des procédures de titrement foncier.",
    rating:           4.7,
    commissionHistorique: 6_300_000,
    prospectIds:      [3, 7],
    visitIds:         [5, 8],
  },
];

// ─── Module-level store ───────────────────────────────────────────────────────
let _agents: AgentFull[] = INIT.map(a => ({ ...a }));
let _nextId = 4;
const _subs = new Set<() => void>();
function _emit() { _subs.forEach(f => f()); }
function _snap() { return _agents; }
function _sub(fn: () => void) { _subs.add(fn); return () => { _subs.delete(fn); }; }

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAgents() {
  return useSyncExternalStore(_sub, _snap);
}

// ─── Actions ──────────────────────────────────────────────────────────────────
export function addAgent(data: Omit<AgentFull, "id" | "commissionHistorique" | "prospectIds" | "visitIds">): AgentFull {
  const ag: AgentFull = { ...data, id: _nextId++, commissionHistorique: 0, prospectIds: [], visitIds: [] };
  _agents = [..._agents, ag];
  _emit();
  return ag;
}

export function updateAgent(id: number, patch: Partial<AgentFull>) {
  _agents = _agents.map(a => a.id === id ? { ...a, ...patch } : a);
  _emit();
}

export function deleteAgent(id: number) {
  _agents = _agents.filter(a => a.id !== id);
  _emit();
}

export function toggleAgent(id: number) {
  _agents = _agents.map(a => a.id === id ? { ...a, actif: !a.actif } : a);
  _emit();
}

export function assignProspect(agentId: number, prospectId: number) {
  _agents = _agents.map(a =>
    a.id === agentId && !a.prospectIds.includes(prospectId)
      ? { ...a, prospectIds: [...a.prospectIds, prospectId] }
      : a
  );
  _emit();
}

export function removeProspect(agentId: number, prospectId: number) {
  _agents = _agents.map(a =>
    a.id === agentId ? { ...a, prospectIds: a.prospectIds.filter(p => p !== prospectId) } : a
  );
  _emit();
}

export function assignVisit(agentId: number, visitId: number) {
  _agents = _agents.map(a =>
    a.id === agentId && !a.visitIds.includes(visitId)
      ? { ...a, visitIds: [...a.visitIds, visitId] }
      : a
  );
  _emit();
}

export function removeVisit(agentId: number, visitId: number) {
  _agents = _agents.map(a =>
    a.id === agentId ? { ...a, visitIds: a.visitIds.filter(v => v !== visitId) } : a
  );
  _emit();
}
