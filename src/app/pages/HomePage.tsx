import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import {
  Search, MapPin, Building2, ArrowRight, Star, ChevronRight,
  BedDouble, Bath, Maximize2, Phone, Shield, Clock, Award,
  TrendingUp, Home, Users, CheckCircle,
} from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import { ALL_PROPERTIES, NAVY, GOLD, CREAM, B, fmt } from "../data";

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible: v };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(28px)", transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s` }}>
      {children}
    </div>
  );
}

function AnimCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: `opacity 0.52s ease ${delay}s, transform 0.52s ease ${delay}s` }}>
      {children}
    </div>
  );
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, visible } = useInView(0.3);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(value / 60);
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setCount(start);
      if (start >= value) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [visible, value]);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: "'DM Mono',monospace" }}>
        {count}{suffix}
      </div>
      <div className="text-sm font-semibold" style={{ color: `${GOLD}cc` }}>{label}</div>
    </div>
  );
}

const TABS: { key: "vente" | "location" | "terrain"; label: string }[] = [
  { key: "vente",    label: "Acheter" },
  { key: "location", label: "Louer" },
  { key: "terrain",  label: "Terrain" },
];

const TESTIMONIALS = [
  { name: "Moussa Diallo", role: "Chef d'entreprise", note: 5, text: "Service impeccable ! L'équipe d'ImmoSénégal m'a trouvé ma villa de rêve aux Almadies en moins de 3 semaines.", avatar: "MD" },
  { name: "Aminata Sow",   role: "Expatriée, retour Sénégal", note: 5, text: "Professionnalisme, réactivité et excellente connaissance du marché. Je recommande sans hésitation.", avatar: "AS" },
  { name: "Ibrahima Fall", role: "Investisseur immobilier", note: 5, text: "Partenaire de confiance pour tous mes investissements. Équipe de haut niveau.", avatar: "IF" },
];

const SERVICES = [
  { icon: <Home size={24} />, title: "Achat & Vente", desc: "Accompagnement complet pour l'acquisition ou la cession de votre bien immobilier." },
  { icon: <Building2 size={24} />, title: "Location", desc: "Gestion locative professionnelle et sélection rigoureuse des locataires." },
  { icon: <Shield size={24} />, title: "Expertise & Évaluation", desc: "Estimation précise de votre bien par nos experts certifiés." },
  { icon: <Award size={24} />, title: "Conseil Patrimonial", desc: "Stratégie d'investissement sur mesure pour valoriser votre patrimoine." },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"vente" | "location" | "terrain">("vente");
  const [search, setSearch] = useState("");

  const featured = ALL_PROPERTIES.filter(p => p.tag && p.transaction === "vente").slice(0, 3);
  const vente = ALL_PROPERTIES.filter(p => p.transaction === "vente" && !p.tag).slice(0, 3);
  const location = ALL_PROPERTIES.filter(p => p.transaction === "location").slice(0, 3);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/recherche?tab=${tab}&search=${encodeURIComponent(search)}`);
  };

  return (
    <div style={{ background: CREAM }}>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "90vh" }}>
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1800&h=1200&fit=crop&auto=format&q=90"
            alt="Hero" className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${NAVY}ee 0%, ${NAVY}99 50%, ${NAVY}55 100%)` }} />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-5 flex flex-col justify-center" style={{ minHeight: "90vh", paddingTop: 80, paddingBottom: 80 }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 self-start">
            <span className="w-8 h-px" style={{ background: GOLD }} />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Agence premium — Dakar, Sénégal</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 max-w-3xl leading-tight"
            style={{ fontFamily: "'Playfair Display',serif" }}>
            Votre bien d'exception<br />
            <span style={{ color: GOLD }}>au Sénégal</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-xl mb-10 leading-relaxed">
            Villas, appartements, terrains — découvrez une sélection de biens haut de gamme à Dakar et sur toute la côte sénégalaise.
          </p>

          {/* Search engine */}
          <div className="bg-white rounded-2xl overflow-hidden max-w-2xl" style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: B }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex-1 py-3.5 text-sm font-bold transition-all"
                  style={{
                    color: tab === t.key ? GOLD : "#6B7280",
                    borderBottom: tab === t.key ? `2px solid ${GOLD}` : "2px solid transparent",
                    background: tab === t.key ? `${GOLD}08` : "transparent",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <form onSubmit={handleSearch} className="flex items-center gap-3 p-4">
              <MapPin size={18} style={{ color: GOLD }} className="shrink-0 ml-1" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Ville, quartier, référence…"
                className="flex-1 text-sm font-medium outline-none bg-transparent placeholder-gray-400"
                style={{ color: NAVY }}
              />
              <button type="submit"
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-colors shrink-0"
                style={{ background: GOLD }}>
                <Search size={15} />Rechercher
              </button>
            </form>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-3 mt-6">
            {["Almadies", "Ngor", "Yoff", "Saly", "Mermoz"].map(q => (
              <button key={q} onClick={() => navigate(`/recherche?tab=vente&quartier=${q}`)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/15 transition-colors border border-white/20">
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section style={{ background: NAVY }}>
        <div className="max-w-[1200px] mx-auto px-5 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={250} suffix="+" label="Biens vendus" />
            <StatCounter value={18} suffix="" label="Années d'expérience" />
            <StatCounter value={98} suffix="%" label="Clients satisfaits" />
            <StatCounter value={3} suffix="" label="Agents experts" />
          </div>
        </div>
      </section>

      {/* ── FEATURED ──────────────────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-5 py-20">
        <Reveal>
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2.5 mb-3">
                <span className="w-8 h-px" style={{ background: GOLD }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Sélection exclusive</span>
              </div>
              <h2 className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>
                Biens Coup de cœur
              </h2>
              <p className="text-gray-500 mt-2">Nos propriétés d'exception sélectionnées par nos experts.</p>
            </div>
            <Link to="/recherche?tab=vente" className="hidden md:flex items-center gap-2 text-sm font-bold hover:opacity-80 transition-opacity" style={{ color: GOLD }}>
              Voir tous <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((p, i) => (
            <AnimCard key={p.id} delay={i * 0.1}>
              <PropertyCard prop={p} />
            </AnimCard>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link to="/recherche?tab=vente" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white" style={{ background: GOLD }}>
            Voir tous les biens <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── ACHETER ───────────────────────────────────────────────────────── */}
      <section style={{ background: "#F0EDE8" }}>
        <div className="max-w-[1200px] mx-auto px-5 py-20">
          <Reveal>
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2.5 mb-3">
                  <span className="w-8 h-px" style={{ background: GOLD }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Acheter</span>
                </div>
                <h2 className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>
                  Biens à vendre
                </h2>
              </div>
              <Link to="/recherche?tab=vente" className="hidden md:flex items-center gap-2 text-sm font-bold" style={{ color: GOLD }}>
                Voir plus <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vente.map((p, i) => (
              <AnimCard key={p.id} delay={i * 0.1}>
                <PropertyCard prop={p} />
              </AnimCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOUER ─────────────────────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-5 py-20">
        <Reveal>
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2.5 mb-3">
                <span className="w-8 h-px" style={{ background: GOLD }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Louer</span>
              </div>
              <h2 className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>
                Biens en location
              </h2>
            </div>
            <Link to="/recherche?tab=location" className="hidden md:flex items-center gap-2 text-sm font-bold" style={{ color: GOLD }}>
              Voir plus <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {location.map((p, i) => (
            <AnimCard key={p.id} delay={i * 0.1}>
              <PropertyCard prop={p} />
            </AnimCard>
          ))}
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────────────────────── */}
      <section id="services" style={{ background: NAVY }}>
        <div className="max-w-[1200px] mx-auto px-5 py-20">
          <Reveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2.5 mb-3">
                <span className="w-8 h-px" style={{ background: `${GOLD}80` }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Nos services</span>
                <span className="w-8 h-px" style={{ background: `${GOLD}80` }} />
              </div>
              <h2 className="text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
                Un accompagnement complet
              </h2>
              <p className="mt-3 text-gray-400 max-w-xl mx-auto">
                De la recherche à la remise des clés, nous vous accompagnons à chaque étape.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map(({ icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <div className="p-6 rounded-2xl border hover:border-[#C9963A]/40 transition-colors group"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                    style={{ background: `${GOLD}20`, color: GOLD }}>
                    {icon}
                  </div>
                  <h3 className="font-bold text-white mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-5 py-20">
        <Reveal>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <span className="w-8 h-px" style={{ background: GOLD }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Témoignages</span>
              <span className="w-8 h-px" style={{ background: GOLD }} />
            </div>
            <h2 className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>
              Ils nous font confiance
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, note, text, avatar }, i) => (
            <Reveal key={name} delay={i * 0.1}>
              <div className="bg-white rounded-2xl p-7 border" style={{ borderColor: B }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: note }).map((_, j) => (
                    <Star key={j} size={15} fill={GOLD} style={{ color: GOLD }} />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: NAVY }}>
                    {avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#0F1C2E]">{name}</div>
                    <div className="text-xs text-gray-400">{role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── À PROPOS ──────────────────────────────────────────────────────── */}
      <section id="apropos" style={{ background: CREAM }}>
        <div className="max-w-[1200px] mx-auto px-5 py-24">

          {/* Header */}
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2.5 mb-3">
                <span className="w-8 h-px" style={{ background: GOLD }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Notre agence</span>
                <span className="w-8 h-px" style={{ background: GOLD }} />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>
                À propos d'ImmoSénégal
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
                Depuis 2006, nous sommes l'agence de référence pour l'immobilier de prestige au Sénégal, avec une présence dans toutes les grandes villes du pays.
              </p>
            </div>
          </Reveal>

          {/* Story + photo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <Reveal>
              <div className="relative rounded-3xl overflow-hidden" style={{ height: 420 }}>
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=700&fit=crop&auto=format&q=90"
                  alt="Bureaux ImmoSénégal"
                  className="w-full h-full object-cover"
                />
                {/* Floating badge */}
                <div className="absolute bottom-6 left-6 bg-white rounded-2xl px-5 py-4 shadow-xl">
                  <div className="text-3xl font-bold" style={{ fontFamily: "'DM Mono',monospace", color: GOLD }}>18+</div>
                  <div className="text-xs font-semibold text-gray-500 mt-0.5">Années d'expertise</div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div>
                <h3 className="text-2xl font-bold mb-5" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>
                  L'excellence immobilière<br />depuis 2006
                </h3>
                <p className="text-gray-500 leading-relaxed mb-5">
                  Fondée à Dakar par des professionnels passionnés de l'immobilier, ImmoSénégal s'est imposée comme l'agence premium incontournable sur le marché sénégalais. Notre réseau couvre Dakar, Thiès, Saint-Louis, Saly et les zones balnéaires les plus prisées.
                </p>
                <p className="text-gray-500 leading-relaxed mb-8">
                  Nous accompagnons particuliers, entreprises et investisseurs étrangers dans leurs projets d'achat, de vente, de location et d'investissement, avec un service personnalisé et une expertise locale sans égale.
                </p>

                {/* Key points */}
                <div className="space-y-3">
                  {[
                    "Agence agréée par le Ministère de l'Urbanisme du Sénégal",
                    "Membre de la Fédération Nationale de l'Immobilier (FENAI)",
                    "Portefeuille de plus de 500 biens exclusifs",
                    "Équipe plurilingue (français, anglais, wolof)",
                  ].map((point) => (
                    <div key={point} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${GOLD}20` }}>
                        <CheckCircle size={12} style={{ color: GOLD }} />
                      </div>
                      <span className="text-sm text-gray-600 leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Valeurs */}
          <Reveal>
            <h3 className="text-center text-2xl font-bold mb-10" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>
              Nos valeurs
            </h3>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
            {[
              {
                icon: <Shield size={22} />,
                titre: "Intégrité",
                desc: "Transparence totale dans chaque transaction. Nous défendons vos intérêts avec honnêteté et rigueur.",
              },
              {
                icon: <Award size={22} />,
                titre: "Excellence",
                desc: "Sélection exigeante des biens, conseils d'experts et accompagnement premium du début à la fin.",
              },
              {
                icon: <Users size={22} />,
                titre: "Proximité",
                desc: "Un interlocuteur dédié pour chaque client. Nous construisons des relations sur la durée.",
              },
            ].map(({ icon, titre, desc }, i) => (
              <Reveal key={titre} delay={i * 0.12}>
                <div className="bg-white rounded-2xl p-8 border text-center" style={{ borderColor: B }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: `${GOLD}15`, color: GOLD }}>
                    {icon}
                  </div>
                  <h4 className="font-bold text-lg mb-3" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>{titre}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Équipe */}
          <Reveal>
            <h3 className="text-center text-2xl font-bold mb-10" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>
              Notre équipe
            </h3>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { nom: "Amadou Ba", titre: "Directeur Commercial", initiales: "AB", ville: "Dakar", desc: "Expert en immobilier de prestige avec 12 ans d'expérience sur le marché dakarois." },
              { nom: "Fatou Diop", titre: "Responsable Location", initiales: "FD", ville: "Dakar", desc: "Spécialiste de la gestion locative et du suivi patrimonial pour les investisseurs." },
              { nom: "Oumar Ndiaye", titre: "Agent Commercial", initiales: "ON", ville: "Saly & Côte", desc: "Référent sur les zones balnéaires — Saly, Somone, Warang et la Petite Côte." },
            ].map(({ nom, titre, initiales, ville, desc }, i) => (
              <Reveal key={nom} delay={i * 0.12}>
                <div className="bg-white rounded-2xl p-6 border text-center" style={{ borderColor: B }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg" style={{ background: NAVY, fontFamily: "'DM Mono',monospace" }}>
                    {initiales}
                  </div>
                  <div className="font-bold text-base mb-0.5" style={{ color: NAVY, fontFamily: "'Playfair Display',serif" }}>{nom}</div>
                  <div className="text-xs font-semibold mb-1" style={{ color: GOLD }}>{titre}</div>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-3">
                    <MapPin size={11} />{ville}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA BAND ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&h=600&fit=crop&auto=format" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `${NAVY}e0` }} />
        </div>
        <div className="relative max-w-[1200px] mx-auto px-5 py-20 text-center">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display',serif" }}>
              Prêt à trouver votre<br /><span style={{ color: GOLD }}>bien idéal ?</span>
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              Nos conseillers sont disponibles 7j/7 pour vous accompagner dans votre projet immobilier.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/recherche" className="px-8 py-4 rounded-xl font-bold text-white text-sm transition-colors" style={{ background: GOLD }}>
                Rechercher un bien
              </Link>
              <Link to="/contact" className="px-8 py-4 rounded-xl font-bold text-sm border-2 text-white border-white/30 hover:border-white transition-colors">
                Nous contacter
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
