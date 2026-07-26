import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  MapPin, BedDouble, Bath, Maximize2, Heart, ArrowRight, Phone, Star,
  X, ChevronLeft, ChevronRight, Check, Calendar, Share2, Download, Eye,
  Expand, Waves, Thermometer, Car, ShieldCheck, TreePine, Zap, Home,
  Play, ArrowUpRight, User, Send, CheckCircle, ChevronDown, MoveUp, Wifi,
} from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import { ALL_PROPERTIES, type Status, NAVY, GOLD, CREAM, B, STATUS_CFG, fmt } from "../data";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const EQUIP_ICON: Record<string, React.ReactNode> = {
  Piscine: <Waves size={16} />, Climatisation: <Thermometer size={16} />,
  Parking: <Car size={16} />, "Sécurité 24h": <ShieldCheck size={16} />,
  Jardin: <TreePine size={16} />, "Groupe électrogène": <Zap size={16} />,
  "Cuisine équipée": <Home size={16} />, Terrasse: <Home size={16} />,
  Wifi: <Wifi size={16} />, Meublé: <Home size={16} />, Ascenseur: <MoveUp size={16} />,
  Gardien: <User size={16} />,
};

// ─── Gallery ──────────────────────────────────────────────────────────────────
function Gallery({ photos }: { photos: string[] }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lightIdx, setLightIdx] = useState(0);

  const openLight = (i: number) => { setLightIdx(i); setLightbox(true); };
  const prev = () => setLightIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setLightIdx(i => (i + 1) % photos.length);

  useEffect(() => {
    if (!lightbox) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [lightbox]);

  const labels = ["Façade principale", "Piscine & terrasse", "Salon principal", "Chambre principale", "Vue jardin", "Extérieur nuit"];

  return (
    <>
      {/* Gallery grid */}
      <div className="w-full overflow-hidden rounded-none md:rounded-2xl" style={{ maxHeight: 580 }}>
        <div className="flex h-full gap-2">
          {/* Main */}
          <div className="relative flex-[3] overflow-hidden group cursor-pointer bg-[#1A2D45]" style={{ minHeight: 420 }} onClick={() => openLight(active)}>
            <img src={photos[active]} alt={labels[active] || "Photo"} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            <div className="absolute bottom-4 right-4">
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm text-white rounded-full px-4 py-2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                <Expand size={13} />Agrandir
              </div>
            </div>
            <div className="absolute bottom-4 left-4">
              <span className="bg-black/50 backdrop-blur-sm text-white rounded-lg px-3 py-1.5 text-xs font-semibold">{labels[active] || "Photo"}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); setActive(i => (i - 1 + photos.length) % photos.length); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-gray-800 flex items-center justify-center shadow transition-all opacity-0 group-hover:opacity-100">
              <ChevronLeft size={20} /></button>
            <button onClick={e => { e.stopPropagation(); setActive(i => (i + 1) % photos.length); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-gray-800 flex items-center justify-center shadow transition-all opacity-0 group-hover:opacity-100">
              <ChevronRight size={20} /></button>
          </div>

          {/* Thumbnails */}
          <div className="hidden md:flex flex-col gap-2 flex-1">
            {photos.slice(0, 3).map((ph, i) => (
              <div key={i} onClick={() => setActive(i)} className="relative flex-1 overflow-hidden cursor-pointer group"
                style={{ border: active === i ? `2px solid ${GOLD}` : "2px solid transparent", transition: "border-color 0.2s" }}>
                <img src={ph} alt={labels[i]} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-400" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              </div>
            ))}
            {photos.length > 3 && (
              <div onClick={() => openLight(3)} className="relative flex-1 overflow-hidden cursor-pointer group">
                <img src={photos[3]} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                  <Eye size={20} className="mb-1 opacity-80" />
                  <span className="font-bold text-lg">+{photos.length - 3}</span>
                  <span className="text-xs opacity-70">photos</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile thumbnails */}
      <div className="flex md:hidden gap-2 mt-2 overflow-x-auto pb-1 px-4">
        {photos.map((ph, i) => (
          <button key={i} onClick={() => setActive(i)}
            className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all"
            style={{ borderColor: active === i ? GOLD : "transparent" }}>
            <img src={ph} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => setLightbox(false)}>
          <div className="flex items-center justify-between px-6 py-4 shrink-0" onClick={e => e.stopPropagation()}>
            <div>
              <span className="text-white font-bold">{labels[lightIdx] || "Photo"}</span>
              <span className="text-white/40 text-sm ml-3">{lightIdx + 1} / {photos.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setLightbox(false)} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-16 relative" onClick={e => e.stopPropagation()}>
            <button onClick={prev} className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
              <ChevronLeft size={24} /></button>
            <img src={photos[lightIdx]} alt="" className="max-w-full max-h-full object-contain rounded-xl" style={{ maxHeight: "calc(100vh - 200px)" }} />
            <button onClick={next} className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
              <ChevronRight size={24} /></button>
          </div>
          <div className="flex items-center justify-center gap-2 px-6 pb-6 pt-4 shrink-0 overflow-x-auto" onClick={e => e.stopPropagation()}>
            {photos.map((ph, i) => (
              <button key={i} onClick={() => setLightIdx(i)} className="shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all"
                style={{ borderColor: lightIdx === i ? GOLD : "transparent", opacity: lightIdx === i ? 1 : 0.5 }}>
                <img src={ph} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Contact panel ────────────────────────────────────────────────────────────
function ContactPanel({ prop, formOpen, setFormOpen }: {
  prop: ReturnType<typeof ALL_PROPERTIES.find>;
  formOpen: boolean;
  setFormOpen: (v: boolean) => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "", date: "" });
  const [sent, setSent] = useState(false);
  if (!prop) return null;
  const st = STATUS_CFG[prop.status as Status];
  const agent = prop.agent;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault(); setSent(true); setTimeout(() => { setSent(false); setFormOpen(false); }, 4000);
  };

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: B }}>
      {/* Price */}
      <div className="p-6 border-b" style={{ borderColor: B }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="font-bold text-4xl leading-none mb-1" style={{ fontFamily: "'DM Mono',monospace", color: GOLD }}>
              {fmt(prop.price)}
            </div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              FCFA{prop.transaction === "location" ? " / mois" : ""}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${st.bg} ${st.text} shrink-0`}>
            <span className={`w-2 h-2 rounded-full ${st.dot}`} />{st.label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Eye size={12} />{prop.views ?? 0} vues · Ajouté le {prop.createdAt}
        </div>
      </div>

      {/* CTAs */}
      <div className="p-5 space-y-3 border-b" style={{ borderColor: B }}>
        <button onClick={() => setFormOpen(o => !o)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-white transition-colors"
          style={{ background: GOLD }}>
          <Calendar size={17} />Demander une visite
        </button>
        <div className="grid grid-cols-2 gap-2">
          {agent && (
            <a href={`tel:${agent.phone}`}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:bg-[#0F1C2E] hover:text-white"
              style={{ borderColor: NAVY, color: NAVY }}>
              <Phone size={15} />Appeler
            </a>
          )}
          {agent && (
            <a href={`https://wa.me/${agent.whatsapp}?text=Bonjour, je suis intéressé par le bien réf. ${prop.ref}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: "#25D366" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="p-5 border-b" style={{ borderColor: B }}>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <div>
                <div className="font-bold text-[#0F1C2E]">Message envoyé !</div>
                <div className="text-sm text-gray-500 mt-0.5">Réponse sous 2h ouvrées.</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-3">
              <div className="text-sm font-bold text-[#0F1C2E] mb-1">Demande de contact</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nom</label>
                  <input required value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))}
                    placeholder="Votre nom" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 transition-all" style={{ borderColor:B, color:NAVY }} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Téléphone</label>
                  <input required value={form.phone} onChange={e => setForm(f => ({...f, phone:e.target.value}))}
                    placeholder="+221 77…" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 transition-all" style={{ borderColor:B, color:NAVY }} />
                </div>
              </div>
              <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date:e.target.value}))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all" style={{ borderColor:B, color:NAVY }} />
              <textarea rows={3} value={form.message} onChange={e => setForm(f => ({...f, message:e.target.value}))}
                placeholder="Je suis intéressé par ce bien…"
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all" style={{ borderColor:B, color:NAVY }} />
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2" style={{ background: NAVY }}>
                <Send size={14} />Envoyer
              </button>
            </form>
          )}
        </div>
      )}

      {/* Agent */}
      {agent && (
        <div className="p-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0" style={{ background: NAVY }}>
              {agent.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[#0F1C2E] text-sm leading-tight">{agent.name}</div>
              <div className="text-xs text-gray-500">{agent.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={i <= Math.floor(agent.rating) ? GOLD : "none"} style={{ color: GOLD }} />)}
                </div>
                <span className="text-xs text-gray-400 font-semibold">{agent.rating} · {agent.listings} biens</span>
              </div>
            </div>
            <a href={`tel:${agent.phone}`} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${GOLD}18`, color: GOLD }}>
              <Phone size={15} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prop = ALL_PROPERTIES.find(p => p.id === Number(id));
  const [descExpanded, setDescExpanded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (!prop) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center" style={{ background: CREAM }}>
        <div className="text-6xl mb-4">🏚</div>
        <h2 className="text-2xl font-bold text-[#0F1C2E] mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>Bien introuvable</h2>
        <p className="text-gray-500 mb-6">Ce bien n'existe pas ou a été supprimé.</p>
        <Link to="/recherche" className="px-6 py-3 rounded-xl font-bold text-white text-sm" style={{ background: GOLD }}>
          Retour à la recherche
        </Link>
      </div>
    );
  }

  const st = STATUS_CFG[prop.status as Status];
  const photos = prop.photos?.length ? prop.photos : [prop.img];
  const similar = ALL_PROPERTIES.filter(p => p.id !== prop.id && p.transaction === prop.transaction && p.propertyType === prop.propertyType).slice(0, 3);
  const fallbackSimilar = similar.length < 3 ? ALL_PROPERTIES.filter(p => p.id !== prop.id && p.transaction === prop.transaction).slice(0, 3) : similar;

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: CREAM }}>
      {/* Gallery */}
      <div className="bg-[#0F1C2E] md:bg-transparent">
        <div className="max-w-[1200px] mx-auto md:px-5 md:pt-6">
          <Gallery photos={photos} />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1200px] mx-auto px-5 py-8">
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#0F1C2E] transition-colors mb-6">
          <ChevronLeft size={16} />Retour aux résultats
        </button>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Left */}
          <div className="space-y-6 min-w-0">
            {/* Header card */}
            <Reveal>
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: B }}>
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  {prop.tag && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: GOLD }}>
                      <Star size={10} fill="currentColor" />{prop.tag}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#F0EDE8] text-[#7A6A52]">{prop.propertyType}</span>
                  <span className="text-xs text-gray-400 font-semibold ml-auto hidden sm:block">Réf. {prop.ref}</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-[#0F1C2E] leading-tight mb-1.5" style={{ fontFamily: "'Playfair Display',serif" }}>
                  {prop.title}
                </h1>
                {prop.subtitle && <p className="text-gray-500 mb-4">{prop.subtitle}</p>}

                <div className="flex items-center gap-2 text-gray-600 mb-5">
                  <MapPin size={16} style={{ color: GOLD }} className="shrink-0" />
                  <span className="font-semibold">{prop.location}</span>
                </div>

                {/* Mobile price */}
                <div className="flex items-baseline gap-3 mb-5 lg:hidden p-4 rounded-xl" style={{ background: CREAM }}>
                  <div className="font-bold text-3xl leading-none" style={{ fontFamily: "'DM Mono',monospace", color: GOLD }}>{fmt(prop.price)}</div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wide">FCFA{prop.transaction === "location" ? "/mois" : ""}</div>
                </div>

                {/* Quick specs */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {prop.beds > 0 && <SpecBox icon={<BedDouble size={18} />} val={`${prop.beds}`} label="Chambres" />}
                  <SpecBox icon={<Bath size={18} />} val={`${prop.baths}`} label="SDB" />
                  <SpecBox icon={<Maximize2 size={18} />} val={`${prop.surface} m²`} label="Surface" />
                  {prop.surfaceTerrain && <SpecBox icon={<Home size={18} />} val={`${prop.surfaceTerrain} m²`} label="Terrain" />}
                  {prop.features?.[5] && <SpecBox icon={<Star size={18} />} val={prop.features[5].value} label={prop.features[5].label} />}
                </div>
              </div>
            </Reveal>

            {/* Description */}
            {prop.description && (
              <Reveal delay={0.08}>
                <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: B }}>
                  <h2 className="text-xl font-bold text-[#0F1C2E] mb-4" style={{ fontFamily: "'Playfair Display',serif" }}>Description</h2>
                  <div className="relative overflow-hidden transition-all duration-500" style={{ maxHeight: descExpanded ? 1000 : 120 }}>
                    {prop.description.split("\n\n").map((para, i) => (
                      <p key={i} className="text-gray-600 text-sm leading-relaxed mb-3 last:mb-0">{para}</p>
                    ))}
                    {!descExpanded && <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />}
                  </div>
                  <button onClick={() => setDescExpanded(d => !d)}
                    className="flex items-center gap-1.5 mt-3 text-sm font-bold" style={{ color: GOLD }}>
                    {descExpanded ? "Voir moins" : "Lire la suite"}
                    <ChevronDown size={15} className={`transition-transform ${descExpanded ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </Reveal>
            )}

            {/* Features */}
            {prop.features && prop.features.length > 0 && (
              <Reveal delay={0.1}>
                <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: B }}>
                  <h2 className="text-xl font-bold text-[#0F1C2E] mb-5" style={{ fontFamily: "'Playfair Display',serif" }}>Caractéristiques</h2>
                  <div className="grid sm:grid-cols-2 gap-0">
                    {prop.features.map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-3 border-b" style={{ borderColor: B }}>
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className="text-sm font-bold text-[#0F1C2E]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Équipements */}
            {prop.equipements.length > 0 && (
              <Reveal delay={0.12}>
                <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: B }}>
                  <h2 className="text-xl font-bold text-[#0F1C2E] mb-5" style={{ fontFamily: "'Playfair Display',serif" }}>Équipements</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {prop.equipements.map(eq => (
                      <div key={eq} className="flex items-center gap-3 p-3.5 rounded-xl border hover:border-[#C9963A] hover:bg-[#FDF6E7] transition-all"
                        style={{ borderColor: B }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${GOLD}15`, color: GOLD }}>
                          {EQUIP_ICON[eq] ?? <Check size={16} />}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{eq}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Location */}
            <Reveal delay={0.14}>
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: B }}>
                <h2 className="text-xl font-bold text-[#0F1C2E] mb-4" style={{ fontFamily: "'Playfair Display',serif" }}>Localisation</h2>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                  <MapPin size={14} style={{ color: GOLD }} />{prop.location}
                </div>
                <div className="relative rounded-2xl overflow-hidden border" style={{ height: 240, borderColor: B }}>
                  <img src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=1000&h=400&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: GOLD }}>
                        <MapPin size={18} className="text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-[#0F1C2E] text-sm">{prop.title}</div>
                        <div className="text-xs text-gray-500">{prop.quartier}, {prop.ville}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Trust */}
            <Reveal delay={0.15}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: <ShieldCheck size={20} />, title: "Transaction sécurisée", sub: "Suivi notarial" },
                  { icon: <Phone size={20} />, title: "Réponse sous 2h", sub: "7j/7" },
                  { icon: <CheckCircle size={20} />, title: "Bien vérifié", sub: "Visite & diagnostics" },
                ].map(({ icon, title, sub }) => (
                  <div key={title} className="bg-white rounded-2xl p-4 border text-center" style={{ borderColor: B }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${GOLD}15`, color: GOLD }}>{icon}</div>
                    <div className="font-bold text-xs text-[#0F1C2E] mb-0.5">{title}</div>
                    <div className="text-[11px] text-gray-400">{sub}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right — sticky contact */}
          <div className="hidden lg:block">
            <div className="sticky top-[84px] space-y-4">
              <Reveal><ContactPanel prop={prop} formOpen={formOpen} setFormOpen={setFormOpen} /></Reveal>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile visit modal */}
      {formOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFormOpen(false)} />
          <div className="relative w-full bg-white rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: B }}>
              <span className="font-bold text-[#0F1C2E]" style={{ fontFamily: "'Playfair Display',serif" }}>Demander une visite</span>
              <button onClick={() => setFormOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <ContactPanel prop={prop} formOpen={formOpen} setFormOpen={setFormOpen} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile CTA bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t shadow-2xl px-4 py-3" style={{ borderColor: B }}>
        <div className="flex items-center gap-2.5">
          <div className="flex-1">
            <div className="font-bold text-lg leading-none" style={{ fontFamily: "'DM Mono',monospace", color: GOLD }}>{fmt(prop.price)}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">FCFA</div>
          </div>
          {prop.agent && (
            <a href={`https://wa.me/${prop.agent.whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white" style={{ background: "#25D366" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
          )}
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: GOLD }}
          >
            <Calendar size={16} />Visiter
          </button>
        </div>
      </div>

      {/* Similar properties */}
      {fallbackSimilar.length > 0 && (
        <section className="pb-24 lg:pb-16" style={{ background: CREAM }}>
          <div className="max-w-[1200px] mx-auto px-5 pt-6">
            <Reveal>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="inline-flex items-center gap-2.5 mb-2">
                    <span className="w-7 h-px" style={{ background: GOLD }} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Suggestions</span>
                  </div>
                  <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>Biens similaires</h2>
                </div>
                <Link to={`/recherche?tab=${prop.transaction}`} className="hidden md:flex items-center gap-2 text-sm font-bold" style={{ color: GOLD }}>
                  Voir tous <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {fallbackSimilar.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.1}>
                  <PropertyCard prop={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SpecBox({ icon, val, label }: { icon: React.ReactNode; val: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl border text-center" style={{ background: CREAM, borderColor: B }}>
      <span style={{ color: GOLD }}>{icon}</span>
      <span className="font-bold text-[#0F1C2E] text-sm" style={{ fontFamily: "'DM Mono',monospace" }}>{val}</span>
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}
