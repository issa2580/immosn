import { Link } from "react-router";
import { Building2, Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";
import { NAVY, GOLD, B } from "../data";

export default function Footer() {
  return (
    <footer style={{ background: NAVY }}>
      <div className="max-w-[1200px] mx-auto px-5 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}20` }}>
                <Building2 size={19} style={{ color: GOLD }} />
              </div>
              <div>
                <div className="font-bold text-base text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
                  Immo<span style={{ color: GOLD }}>Sénégal</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${GOLD}80` }}>Agence Premium</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              L'agence immobilière de référence au Sénégal. Achat, vente et location de biens d'exception.
            </p>
            <div className="flex items-center gap-2">
              {[
                { icon: <Facebook size={15} />, href: "#" },
                { icon: <Instagram size={15} />, href: "#" },
                { icon: <Linkedin size={15} />, href: "#" },
              ].map(({ icon, href }, i) => (
                <a key={i} href={href}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Biens */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: GOLD }}>Biens</div>
            <ul className="space-y-3">
              {[
                { label: "Acheter", to: "/recherche?tab=vente" },
                { label: "Louer", to: "/recherche?tab=location" },
                { label: "Terrains", to: "/recherche?tab=terrain" },
                { label: "Villas", to: "/recherche?tab=vente&type=Villa" },
                { label: "Appartements", to: "/recherche?tab=vente&type=Appartement" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Agence */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: GOLD }}>Agence</div>
            <ul className="space-y-3">
              {[
                { label: "À propos", to: "/#apropos" },
                { label: "Nos agents", to: "/contact#agents" },
                { label: "Témoignages", to: "/contact#temoignages" },
                { label: "Contact", to: "/contact" },
                { label: "Espace agence", to: "/agence" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: GOLD }}>Contact</div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={15} style={{ color: GOLD }} className="shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">Almadies, Dakar<br />Sénégal</span>
              </li>
              <li>
                <a href="tel:+221771234567" className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                  <Phone size={15} style={{ color: GOLD }} />+221 77 123 45 67
                </a>
              </li>
              <li>
                <a href="mailto:contact@immosenegal.sn" className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                  <Mail size={15} style={{ color: GOLD }} />contact@immosenegal.sn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-gray-500">© 2025 ImmoSénégal. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Mentions légales</a>
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
