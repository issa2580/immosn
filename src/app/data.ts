// ─── Design tokens ────────────────────────────────────────────────────────────
export const NAVY = "#0F1C2E";
export const GOLD = "#C9963A";
export const CREAM = "#F8F6F2";
export const B = "rgba(15,28,46,0.08)";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Transaction = "vente" | "location" | "terrain";
export type PropType = "Villa" | "Appartement" | "Duplex" | "Studio" | "Bureau" | "Terrain";
export type Status = "disponible" | "réservé" | "loué" | "vendu";

export interface AgentInfo {
  name: string;
  title: string;
  phone: string;
  whatsapp: string;
  email: string;
  avatar: string;
  listings: number;
  rating: number;
}

export interface Prop {
  id: number;
  ref: string;
  title: string;
  subtitle?: string;
  location: string;
  ville: string;
  quartier: string;
  price: number;
  transaction: Transaction;
  propertyType: PropType;
  beds: number;
  baths: number;
  surface: number;
  surfaceTerrain?: number;
  tag: string | null;
  status: Status;
  equipements: string[];
  img: string;
  photos?: string[];
  createdAt: string;
  views?: number;
  description?: string;
  features?: { label: string; value: string }[];
  agent?: AgentInfo;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const fmt = (n: number) => new Intl.NumberFormat("fr-SN").format(n);

export const STATUS_CFG: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  disponible: { label: "Disponible", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  réservé:    { label: "Réservé",    bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
  loué:       { label: "Loué",       bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
  vendu:      { label: "Vendu",      bg: "bg-gray-100",   text: "text-gray-500",    dot: "bg-gray-400"    },
};

export const VILLES = ["Dakar", "Thiès", "Mbour", "Rufisque"];
export const QUARTIERS: Record<string, string[]> = {
  Dakar:    ["Almadies", "Ngor", "Yoff", "Mermoz", "Plateau", "Point E", "Les Mamelles", "Ouakam"],
  Thiès:    ["Thiès Centre", "Thiès Nord", "Thiès Sud"],
  Mbour:    ["Mbour Centre", "Saly"],
  Rufisque: ["Rufisque Est", "Rufisque Ouest"],
};
export const PROP_TYPES: PropType[] = ["Villa", "Appartement", "Duplex", "Studio", "Bureau", "Terrain"];
export const EQUIPEMENTS_LIST = [
  "Piscine", "Climatisation", "Parking", "Sécurité 24h", "Jardin",
  "Groupe électrogène", "Cuisine équipée", "Terrasse", "Ascenseur",
  "Meublé", "Wifi", "Gardien",
];

// ─── Agents ───────────────────────────────────────────────────────────────────
export const AGENTS: AgentInfo[] = [
  { name: "Amadou Ba",       title: "Directeur Commercial",     phone: "+221 77 123 45 67", whatsapp: "221771234567", email: "amadou.ba@immosenegal.sn",       avatar: "AB", listings: 38, rating: 4.9 },
  { name: "Fatou Diallo",    title: "Conseillère Immobilière",  phone: "+221 77 234 56 78", whatsapp: "221772345678", email: "fatou.diallo@immosenegal.sn",    avatar: "FD", listings: 24, rating: 4.8 },
  { name: "Ousmane Ndiaye",  title: "Expert Terrain & Foncier", phone: "+221 77 345 67 89", whatsapp: "221773456789", email: "ousmane.ndiaye@immosenegal.sn",  avatar: "ON", listings: 19, rating: 4.7 },
];

// ─── Dataset (18 properties) ──────────────────────────────────────────────────
export const ALL_PROPERTIES: Prop[] = [
  // ── VENTE ────────────────────────────────────────────────────────────────
  {
    id: 1, ref: "IS-2025-001",
    title: "Villa Contemporaine d'Exception",
    subtitle: "Résidence haut de gamme avec piscine et jardin paysager",
    location: "Almadies, Dakar", ville: "Dakar", quartier: "Almadies",
    price: 185_000_000, transaction: "vente", propertyType: "Villa",
    beds: 5, baths: 4, surface: 420, surfaceTerrain: 800,
    tag: "Coup de cœur", status: "disponible",
    equipements: ["Piscine", "Climatisation", "Parking", "Sécurité 24h", "Jardin", "Groupe électrogène", "Cuisine équipée", "Terrasse"],
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=580&fit=crop&auto=format",
    photos: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1400&h=900&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&h=900&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&h=900&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&h=900&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1400&h=900&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1400&h=900&fit=crop&auto=format",
    ],
    createdAt: "10 juin 2025", views: 284,
    description: `Découvrez cette villa contemporaine d'exception nichée dans le quartier prisé des Almadies, à quelques minutes des plages et du cœur de Dakar.\n\nConstruite en 2022 avec des matériaux de première qualité, cette propriété allie modernité architecturale et confort absolu. Les grandes baies vitrées inondent chaque pièce de lumière naturelle et offrent une vue dégagée sur le jardin paysager et la piscine à débordement.\n\nLe rez-de-chaussée accueille un vaste espace de vie en open space de 95 m², une cuisine équipée haut de gamme, un bureau, une suite parentale avec dressing et une chambre d'amis. À l'étage, quatre chambres spacieuses dont une suite avec terrasse privative surplombant la piscine.`,
    features: [
      { label: "Surface habitable", value: "420 m²" }, { label: "Surface terrain", value: "800 m²" },
      { label: "Chambres", value: "5" }, { label: "Salles de bain", value: "4" },
      { label: "Garage", value: "3 places" }, { label: "Niveaux", value: "R+1" },
      { label: "Année de construction", value: "2022" }, { label: "État général", value: "Excellent" },
      { label: "Orientation", value: "Sud-Ouest" }, { label: "Vue", value: "Jardin / mer lointain" },
    ],
    agent: AGENTS[0],
  },
  {
    id: 2, ref: "IS-2025-002", title: "Duplex Prestige Vue Mer",
    location: "Ngor, Dakar", ville: "Dakar", quartier: "Ngor",
    price: 95_000_000, transaction: "vente", propertyType: "Duplex",
    beds: 4, baths: 3, surface: 280, tag: "Nouveau", status: "disponible",
    equipements: ["Terrasse", "Parking", "Climatisation", "Cuisine équipée"],
    img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1400&h=900&fit=crop&auto=format", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "5 juin 2025", views: 156,
    description: "Magnifique duplex avec vue panoramique sur l'océan Atlantique. Idéalement situé à Ngor, ce bien d'exception offre un cadre de vie privilégié aux finitions impeccables.",
    features: [{ label: "Surface", value: "280 m²" }, { label: "Chambres", value: "4" }, { label: "Niveaux", value: "R+1" }, { label: "Orientation", value: "Est / mer" }],
    agent: AGENTS[1],
  },
  {
    id: 3, ref: "IS-2025-003", title: "Appartement de Prestige",
    location: "Plateau, Dakar", ville: "Dakar", quartier: "Plateau",
    price: 75_000_000, transaction: "vente", propertyType: "Appartement",
    beds: 3, baths: 2, surface: 180, tag: null, status: "réservé",
    equipements: ["Ascenseur", "Parking", "Sécurité", "Climatisation"],
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "1 juin 2025", views: 89,
    description: "Appartement spacieux dans une résidence sécurisée au cœur du Plateau. Accès facile à tous les services, transports et ambassades.",
    features: [{ label: "Surface", value: "180 m²" }, { label: "Étage", value: "4e sur 6" }, { label: "Chambres", value: "3" }],
    agent: AGENTS[0],
  },
  {
    id: 4, ref: "IS-2025-004", title: "Villa Moderne avec Piscine",
    location: "Yoff, Dakar", ville: "Dakar", quartier: "Yoff",
    price: 120_000_000, transaction: "vente", propertyType: "Villa",
    beds: 4, baths: 3, surface: 320, tag: null, status: "disponible",
    equipements: ["Piscine", "Jardin", "Parking", "Sécurité 24h", "Climatisation"],
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&h=900&fit=crop&auto=format", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "28 mai 2025", views: 201,
    description: "Belle villa moderne à Yoff avec piscine privée et grand jardin. Architecture contemporaine et finitions haut de gamme.",
    features: [{ label: "Surface", value: "320 m²" }, { label: "Terrain", value: "550 m²" }, { label: "Chambres", value: "4" }, { label: "État", value: "Excellent" }],
    agent: AGENTS[1],
  },
  {
    id: 5, ref: "IS-2025-005", title: "Studio Haut Standing",
    location: "Mermoz, Dakar", ville: "Dakar", quartier: "Mermoz",
    price: 25_000_000, transaction: "vente", propertyType: "Studio",
    beds: 1, baths: 1, surface: 45, tag: null, status: "disponible",
    equipements: ["Meublé", "Climatisation", "Sécurité"],
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "20 mai 2025", views: 67,
    description: "Studio design entièrement meublé dans une résidence moderne à Mermoz. Idéal pour investissement locatif ou première acquisition.",
    features: [{ label: "Surface", value: "45 m²" }, { label: "Étage", value: "2e" }, { label: "État", value: "Neuf" }],
    agent: AGENTS[0],
  },
  {
    id: 6, ref: "IS-2025-006", title: "Bureau Commercial Plateau",
    location: "Plateau, Dakar", ville: "Dakar", quartier: "Plateau",
    price: 45_000_000, transaction: "vente", propertyType: "Bureau",
    beds: 0, baths: 2, surface: 120, tag: null, status: "disponible",
    equipements: ["Ascenseur", "Parking", "Sécurité", "Climatisation", "Wifi"],
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "15 mai 2025", views: 43,
    description: "Beau plateau de bureaux en plein cœur du Plateau, le CBD de Dakar. Idéal pour société de conseil, cabinet ou représentation.",
    features: [{ label: "Surface", value: "120 m²" }, { label: "Étage", value: "5e" }, { label: "Parking", value: "2 places" }],
    agent: AGENTS[0],
  },
  {
    id: 7, ref: "IS-2025-007", title: "Villa de Luxe Balnéaire",
    location: "Saly, Mbour", ville: "Mbour", quartier: "Saly",
    price: 250_000_000, transaction: "vente", propertyType: "Villa",
    beds: 6, baths: 5, surface: 650, surfaceTerrain: 1200, tag: "Exclusivité", status: "disponible",
    equipements: ["Piscine", "Plage privée", "Jardin", "Parking", "Sécurité 24h", "Groupe électrogène", "Climatisation"],
    img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "10 mai 2025", views: 312,
    description: "Villa de prestige en première ligne de plage à Saly. Résidence de 650 m² avec accès direct à la mer et piscine à débordement.",
    features: [{ label: "Surface", value: "650 m²" }, { label: "Terrain", value: "1 200 m²" }, { label: "Chambres", value: "6" }, { label: "Vue", value: "Océan" }],
    agent: AGENTS[2],
  },
  {
    id: 8, ref: "IS-2025-008", title: "Villa Les Mamelles",
    location: "Les Mamelles, Dakar", ville: "Dakar", quartier: "Les Mamelles",
    price: 310_000_000, transaction: "vente", propertyType: "Villa",
    beds: 7, baths: 6, surface: 800, surfaceTerrain: 2000, tag: "Coup de cœur", status: "disponible",
    equipements: ["Piscine", "Jardin", "Parking", "Sécurité 24h", "Groupe électrogène", "Ascenseur", "Climatisation", "Terrasse"],
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=580&fit=crop&auto=format&sat=-30",
    photos: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "5 mai 2025", views: 445,
    description: "Villa d'exception au sommet des Mamelles avec vue panoramique à 360° sur Dakar, l'océan et l'île de Gorée. Un bien absolument unique.",
    features: [{ label: "Surface", value: "800 m²" }, { label: "Terrain", value: "2 000 m²" }, { label: "Chambres", value: "7" }, { label: "Vue", value: "360° panoramique" }],
    agent: AGENTS[0],
  },
  // ── LOCATION ─────────────────────────────────────────────────────────────
  {
    id: 9, ref: "IS-2025-009", title: "Appartement Moderne Meublé",
    location: "Plateau, Dakar", ville: "Dakar", quartier: "Plateau",
    price: 350_000, transaction: "location", propertyType: "Appartement",
    beds: 2, baths: 1, surface: 85, tag: null, status: "disponible",
    equipements: ["Meublé", "Climatisation", "Sécurité", "Wifi"],
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "12 juin 2025", views: 92,
    description: "Appartement moderne entièrement meublé au cœur du Plateau. Accès direct aux transports, commerces et ambassades.",
    features: [{ label: "Surface", value: "85 m²" }, { label: "Étage", value: "3e" }, { label: "Bail min.", value: "6 mois" }],
    agent: AGENTS[1],
  },
  {
    id: 10, ref: "IS-2025-010", title: "Villa Meublée Almadies",
    location: "Almadies, Dakar", ville: "Dakar", quartier: "Almadies",
    price: 800_000, transaction: "location", propertyType: "Villa",
    beds: 4, baths: 3, surface: 300, tag: "Premium", status: "disponible",
    equipements: ["Piscine", "Meublé", "Parking", "Sécurité 24h", "Climatisation", "Jardin"],
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "8 juin 2025", views: 178,
    description: "Superbe villa meublée dans la résidence des Almadies. Idéale pour expatriés ou locations diplomatiques de longue durée.",
    features: [{ label: "Surface", value: "300 m²" }, { label: "Terrain", value: "500 m²" }, { label: "Bail min.", value: "1 an" }],
    agent: AGENTS[0],
  },
  {
    id: 11, ref: "IS-2025-011", title: "Studio Étudiant Mermoz",
    location: "Mermoz, Dakar", ville: "Dakar", quartier: "Mermoz",
    price: 175_000, transaction: "location", propertyType: "Studio",
    beds: 1, baths: 1, surface: 35, tag: null, status: "loué",
    equipements: ["Meublé", "Climatisation", "Wifi"],
    img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "30 mai 2025", views: 45,
    description: "Studio pratique à Mermoz pour étudiant ou jeune professionnel. Bien équipé, sécurisé et bien situé près des universités.",
    features: [{ label: "Surface", value: "35 m²" }, { label: "Bail min.", value: "3 mois" }],
    agent: AGENTS[1],
  },
  {
    id: 12, ref: "IS-2025-012", title: "Appartement Familial Yoff",
    location: "Yoff, Dakar", ville: "Dakar", quartier: "Yoff",
    price: 450_000, transaction: "location", propertyType: "Appartement",
    beds: 3, baths: 2, surface: 120, tag: null, status: "disponible",
    equipements: ["Parking", "Climatisation", "Sécurité"],
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "2 juin 2025", views: 87,
    description: "Grand appartement familial à Yoff, quartier résidentiel calme proche de la plage et des commerces.",
    features: [{ label: "Surface", value: "120 m²" }, { label: "Étage", value: "2e" }, { label: "Bail min.", value: "1 an" }],
    agent: AGENTS[0],
  },
  {
    id: 13, ref: "IS-2025-013", title: "Duplex Point E",
    location: "Point E, Dakar", ville: "Dakar", quartier: "Point E",
    price: 600_000, transaction: "location", propertyType: "Duplex",
    beds: 3, baths: 2, surface: 180, tag: null, status: "disponible",
    equipements: ["Parking", "Climatisation", "Terrasse", "Sécurité"],
    img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "25 mai 2025", views: 112,
    description: "Beau duplex en plein Point E avec terrasse. Quartier prisé pour les familles expatriées et professionnels internationaux.",
    features: [{ label: "Surface", value: "180 m²" }, { label: "Niveaux", value: "R+1" }, { label: "Bail min.", value: "1 an" }],
    agent: AGENTS[2],
  },
  {
    id: 14, ref: "IS-2025-014", title: "Maison Familiale Thiès",
    location: "Thiès Centre, Thiès", ville: "Thiès", quartier: "Thiès Centre",
    price: 200_000, transaction: "location", propertyType: "Villa",
    beds: 3, baths: 2, surface: 150, tag: null, status: "disponible",
    equipements: ["Jardin", "Parking"],
    img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "18 mai 2025", views: 34,
    description: "Agréable maison familiale à Thiès centre avec jardin et parking. Idéale pour une grande famille.",
    features: [{ label: "Surface", value: "150 m²" }, { label: "Jardin", value: "200 m²" }],
    agent: AGENTS[2],
  },
  // ── TERRAIN ──────────────────────────────────────────────────────────────
  {
    id: 15, ref: "IS-2025-015", title: "Terrain Titré Mbour",
    location: "Mbour Centre, Mbour", ville: "Mbour", quartier: "Mbour Centre",
    price: 15_000_000, transaction: "terrain", propertyType: "Terrain",
    beds: 0, baths: 0, surface: 500, tag: null, status: "disponible",
    equipements: ["Titré", "Borné", "Voirie"],
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "15 juin 2025", views: 28,
    description: "Terrain titré et borné en plein centre de Mbour. Accès direct à la voirie, tous réseaux disponibles.",
    features: [{ label: "Surface", value: "500 m²" }, { label: "Titre foncier", value: "Oui" }, { label: "Zone", value: "Résidentielle" }],
    agent: AGENTS[2],
  },
  {
    id: 16, ref: "IS-2025-016", title: "Terrain Balnéaire Saly",
    location: "Saly Portudal, Mbour", ville: "Mbour", quartier: "Saly",
    price: 35_000_000, transaction: "terrain", propertyType: "Terrain",
    beds: 0, baths: 0, surface: 800, tag: "Coup de cœur", status: "disponible",
    equipements: ["Titré", "Vue mer", "Bords de plage"],
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "8 juin 2025", views: 156,
    description: "Rare terrain en bord de mer à Saly avec vue océan. Idéal pour construction d'un hôtel, villa ou résidence balnéaire.",
    features: [{ label: "Surface", value: "800 m²" }, { label: "Titre foncier", value: "Oui" }, { label: "Vue", value: "Océan" }, { label: "Zone", value: "Touristique" }],
    agent: AGENTS[2],
  },
  {
    id: 17, ref: "IS-2025-017", title: "Terrain Commercial Rufisque",
    location: "Rufisque Est, Rufisque", ville: "Rufisque", quartier: "Rufisque Est",
    price: 8_000_000, transaction: "terrain", propertyType: "Terrain",
    beds: 0, baths: 0, surface: 300, tag: null, status: "disponible",
    equipements: ["Titré", "Zone commerciale", "Voirie"],
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "20 mai 2025", views: 19,
    description: "Terrain en zone commerciale à Rufisque, idéal pour commerce, entrepôt ou développement professionnel.",
    features: [{ label: "Surface", value: "300 m²" }, { label: "Zone", value: "Commerciale" }],
    agent: AGENTS[0],
  },
  {
    id: 18, ref: "IS-2025-018", title: "Terrain Résidentiel Thiès",
    location: "Thiès Nord, Thiès", ville: "Thiès", quartier: "Thiès Nord",
    price: 12_000_000, transaction: "terrain", propertyType: "Terrain",
    beds: 0, baths: 0, surface: 600, tag: null, status: "disponible",
    equipements: ["Titré", "Borné", "Zone résidentielle"],
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=580&fit=crop&auto=format",
    photos: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&h=900&fit=crop&auto=format"],
    createdAt: "10 mai 2025", views: 41,
    description: "Grand terrain en zone résidentielle à Thiès Nord. Quartier en plein essor, proche de toutes les commodités.",
    features: [{ label: "Surface", value: "600 m²" }, { label: "Zone", value: "Résidentielle" }, { label: "Viabilisé", value: "Partiellement" }],
    agent: AGENTS[1],
  },
];
