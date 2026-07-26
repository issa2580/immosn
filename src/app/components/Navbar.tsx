import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router";
import { Building2, Search, Menu, X, Phone, ChevronDown } from "lucide-react";
import { NAVY, GOLD, B } from "../data";

type NavLink = { label: string; to: string; end?: boolean; hash?: boolean };
const NAV_LINKS: NavLink[] = [
  { label: "Accueil",   to: "/",          end: true  },
  { label: "Services",  to: "/#services", hash: true },
  { label: "À propos",  to: "/#apropos",  hash: true },
  { label: "Contact",   to: "/contact"               },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${scrolled ? B : "transparent"}`,
          boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-5 flex items-center justify-between" style={{ height: 68 }}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: NAVY }}>
              <Building2 size={17} style={{ color: GOLD }} />
            </div>
            <div>
              <div className="font-bold text-base leading-none" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>
                Immo<span style={{ color: GOLD }}>Sénégal</span>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Agence Premium</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, to, end, hash }) =>
              hash ? (
                <a
                  key={to}
                  href={to}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-gray-600 hover:text-[#0F1C2E] hover:bg-[#F8F6F2]"
                >
                  {label}
                </a>
              ) : (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? "text-[#0F1C2E] bg-[#F0EDE8]"
                        : "text-gray-600 hover:text-[#0F1C2E] hover:bg-[#F8F6F2]"
                    }`
                  }
                >
                  {label}
                </NavLink>
              )
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/recherche")}
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-gray-500 hover:bg-[#F0EDE8] hover:text-[#0F1C2E] transition-colors"
            >
              <Search size={18} />
            </button>

            <Link
              to="/agence"
              className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors hover:opacity-90"
              style={{ background: GOLD }}
            >
              Espace agence
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 hover:bg-[#F0EDE8] transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 right-0 bg-white shadow-2xl rounded-b-3xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5" style={{ height: 68, borderBottom: `1px solid ${B}` }}>
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: NAVY }}>
                  <Building2 size={17} style={{ color: GOLD }} />
                </div>
                <span className="font-bold" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>
                  Immo<span style={{ color: GOLD }}>Sénégal</span>
                </span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F0EDE8] transition-colors">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Links */}
            <nav className="p-4 space-y-1">
              {NAV_LINKS.map(({ label, to, end, hash }) =>
                hash ? (
                  <a
                    key={to}
                    href={to}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors text-gray-600 hover:bg-[#F8F6F2]"
                  >
                    {label}
                  </a>
                ) : (
                  <NavLink key={to} to={to} end={end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors ${
                        isActive ? "bg-[#F0EDE8] text-[#0F1C2E]" : "text-gray-600 hover:bg-[#F8F6F2]"
                      }`
                    }>
                    {label}
                  </NavLink>
                )
              )}
            </nav>

            <div className="px-4 pb-6 space-y-2">
              <Link to="/agence" onClick={() => setMobileOpen(false)}
                className="block w-full py-3.5 rounded-xl text-center text-sm font-bold text-white transition-colors"
                style={{ background: GOLD }}>
                Espace agence
              </Link>
              <a href="tel:+221771234567"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold border transition-colors"
                style={{ borderColor: B, color: NAVY }}>
                <Phone size={15} />+221 77 123 45 67
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
