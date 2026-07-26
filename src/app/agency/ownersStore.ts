import { useSyncExternalStore } from "react";
import { updateProperty } from "./store";

// ─── Types ────────────────────────────────────────────────────────────────────
export type OwnerType = "Particulier" | "Société" | "Investisseur";

export interface OwnerDocument {
  id: number;
  name: string;
  type: "Titre foncier" | "CNI" | "NINEA" | "Passeport" | "Contrat de mandat" | "Autre";
  date: string;
  size: string;
}

export interface Owner {
  id: number;
  name: string;
  phone: string;
  email: string;
  ville: string;
  type: OwnerType;
  actif: boolean;
  dateAjout: string;
  notes: string;
  propIds: number[];
  documents: OwnerDocument[];
}

// ─── Initial mock data ────────────────────────────────────────────────────────
let _docId = 100;
const d = (name: string, type: OwnerDocument["type"], date: string, size: string): OwnerDocument =>
  ({ id: _docId++, name, type, date, size });

const INIT_OWNERS: Owner[] = [
  {
    id: 1, name: "Mamadou Konaté", phone: "+221 77 912 34 56",
    email: "m.konate@gmail.com", ville: "Dakar", type: "Particulier",
    actif: true, dateAjout: "2024-02-10", propIds: [1, 3],
    notes: "Client historique depuis 2022. Préfère les échanges par téléphone. Disponible uniquement en semaine.",
    documents: [
      d("Titre Foncier — Almadies n°4521", "Titre foncier",    "2024-02-10", "1,2 Mo"),
      d("CNI — Mamadou Konaté",           "CNI",               "2024-02-10", "340 Ko"),
      d("Contrat de mandat IS-001",        "Contrat de mandat", "2024-02-15", "890 Ko"),
    ],
  },
  {
    id: 2, name: "Mariama Baldé", phone: "+221 78 523 67 89",
    email: "mariama.balde@yahoo.fr", ville: "Dakar", type: "Investisseur",
    actif: true, dateAjout: "2024-03-18", propIds: [2, 4, 10],
    notes: "Investisseure active. Cherche à agrandir son portefeuille côté location meublée. Délais de réponse très courts.",
    documents: [
      d("Titre Foncier — Ngor n°7823",     "Titre foncier",    "2024-03-18", "1,5 Mo"),
      d("CNI — Mariama Baldé",             "CNI",               "2024-03-18", "320 Ko"),
      d("Titre Foncier — Yoff n°3319",     "Titre foncier",    "2024-03-20", "1,1 Mo"),
      d("Contrat de mandat IS-002",         "Contrat de mandat", "2024-03-22", "910 Ko"),
    ],
  },
  {
    id: 3, name: "El Hadj Ibrahima Sow", phone: "+221 77 345 12 78",
    email: "ibrahima.sow@sowimmobilier.sn", ville: "Mbour", type: "Société",
    actif: true, dateAjout: "2023-09-05", propIds: [7, 16],
    notes: "Société SCI Sow Immobilier. Patrimoine principalement balnéaire à Saly. Représentant légal : El Hadj Ibrahima Sow.",
    documents: [
      d("NINEA — SCI Sow Immobilier",      "NINEA",             "2023-09-05", "220 Ko"),
      d("Titre Foncier — Saly Villa n°8823","Titre foncier",    "2023-09-05", "2,1 Mo"),
      d("Titre Foncier — Saly Terrain n°9011","Titre foncier",  "2023-09-08", "1,8 Mo"),
      d("Contrat de mandat IS-003",          "Contrat de mandat","2023-09-10", "870 Ko"),
    ],
  },
  {
    id: 4, name: "Aïssatou Diallo", phone: "+221 76 234 89 01",
    email: "aissatou.diallo@orange.sn", ville: "Dakar", type: "Particulier",
    actif: true, dateAjout: "2024-01-20", propIds: [9, 11, 12],
    notes: "Propriétaire de plusieurs biens locatifs. Gestion déléguée à l'agence pour toutes les locations. Très satisfaite du service.",
    documents: [
      d("CNI — Aïssatou Diallo",           "CNI",               "2024-01-20", "310 Ko"),
      d("Contrat de mandat IS-004",         "Contrat de mandat", "2024-01-22", "895 Ko"),
    ],
  },
  {
    id: 5, name: "Serigne Cheikh Mbaye", phone: "+221 77 456 78 90",
    email: "sc.mbaye@invest-sn.com", ville: "Thiès", type: "Investisseur",
    actif: true, dateAjout: "2023-11-14", propIds: [14, 15, 17, 18],
    notes: "Investisseur foncier dans les zones émergentes. Intéressé par Thiès et Mbour. Stratégie long terme.",
    documents: [
      d("CNI — Serigne Cheikh Mbaye",      "CNI",               "2023-11-14", "335 Ko"),
      d("Titre Foncier — Thiès n°1102",    "Titre foncier",     "2023-11-14", "1,3 Mo"),
      d("NINEA — InvestSN SARL",           "NINEA",             "2023-11-15", "200 Ko"),
      d("Contrat de mandat IS-005",         "Contrat de mandat", "2023-11-20", "920 Ko"),
    ],
  },
  {
    id: 6, name: "Bineta Fall", phone: "+221 78 678 90 12",
    email: "bineta.fall@gmail.com", ville: "Dakar", type: "Particulier",
    actif: true, dateAjout: "2024-05-02", propIds: [5, 6, 8, 13],
    notes: "Héritage familial. Souhaite vendre la villa des Mamelles à terme. Suivi mensuel requis. Contact privilégié par email.",
    documents: [
      d("CNI — Bineta Fall",               "CNI",               "2024-05-02", "325 Ko"),
      d("Titre Foncier — Les Mamelles n°5560","Titre foncier",  "2024-05-02", "1,9 Mo"),
      d("Contrat de mandat IS-006",          "Contrat de mandat","2024-05-05", "915 Ko"),
    ],
  },
];

// Seed owner info onto properties at initialization
function seedOwnerOnProps() {
  for (const owner of INIT_OWNERS) {
    for (const propId of owner.propIds) {
      updateProperty(propId, {
        ownerName:  owner.name,
        ownerPhone: owner.phone,
        ownerEmail: owner.email,
      });
    }
  }
}
// Run once on module load
seedOwnerOnProps();

// ─── Module-level store ───────────────────────────────────────────────────────
let _owners: Owner[] = INIT_OWNERS.map(o => ({ ...o, documents: [...o.documents] }));
let _nextId = 7;
let _nextDocId = _docId;
const _subs = new Set<() => void>();
function _emit() { _subs.forEach(f => f()); }
function _snap() { return _owners; }
function _sub(fn: () => void) { _subs.add(fn); return () => { _subs.delete(fn); }; }

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useOwners() {
  return useSyncExternalStore(_sub, _snap);
}

// ─── Actions ──────────────────────────────────────────────────────────────────
export function addOwner(data: Omit<Owner, "id" | "dateAjout" | "propIds" | "documents">): Owner {
  const owner: Owner = {
    ...data, id: _nextId++,
    dateAjout: new Date().toISOString().split("T")[0],
    propIds: [], documents: [],
  };
  _owners = [..._owners, owner];
  _emit();
  return owner;
}

export function updateOwner(id: number, patch: Partial<Owner>) {
  _owners = _owners.map(o => o.id === id ? { ...o, ...patch } : o);
  _emit();
}

export function deleteOwner(id: number) {
  _owners = _owners.filter(o => o.id !== id);
  _emit();
}

export function toggleOwner(id: number) {
  _owners = _owners.map(o => o.id === id ? { ...o, actif: !o.actif } : o);
  _emit();
}

export function assignProp(ownerId: number, propId: number, ownerData: { name: string; phone: string; email: string }) {
  _owners = _owners.map(o =>
    o.id === ownerId && !o.propIds.includes(propId)
      ? { ...o, propIds: [...o.propIds, propId] }
      : o
  );
  _emit();
  updateProperty(propId, { ownerName: ownerData.name, ownerPhone: ownerData.phone, ownerEmail: ownerData.email });
}

export function removeProp(ownerId: number, propId: number) {
  _owners = _owners.map(o =>
    o.id === ownerId ? { ...o, propIds: o.propIds.filter(p => p !== propId) } : o
  );
  _emit();
  updateProperty(propId, { ownerName: undefined, ownerPhone: undefined, ownerEmail: undefined });
}

export function addDocument(ownerId: number, doc: Omit<OwnerDocument, "id">): OwnerDocument {
  const newDoc = { ...doc, id: _nextDocId++ };
  _owners = _owners.map(o =>
    o.id === ownerId ? { ...o, documents: [...o.documents, newDoc] } : o
  );
  _emit();
  return newDoc;
}

export function removeDocument(ownerId: number, docId: number) {
  _owners = _owners.map(o =>
    o.id === ownerId ? { ...o, documents: o.documents.filter(d => d.id !== docId) } : o
  );
  _emit();
}
