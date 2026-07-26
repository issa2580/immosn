import { useState, useEffect } from "react";
import { Outlet, NavLink, Link, useLocation, useNavigate, useNavigation } from "react-router";
import {
  Building2, LayoutDashboard, Home, Users, MessageSquare,
  BarChart3, Settings, LogOut, Menu, X, Bell, ChevronRight,
  Plus, Calendar, UserCircle, KeyRound, Handshake,
  CheckCircle, RefreshCw, Zap, Trash2, CheckCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NAVY, GOLD, B } from "../data";
import {
  useNotifications, markRead, markAllRead, deleteNotif, clearAll,
  type Notification, type NotifType,
} from "../agency/notificationsStore";
import { useProfile, getInitials } from "../agency/profileStore";

const NAV = [
  { label: "Tableau de bord", to: "/agence",           icon: <LayoutDashboard size={18} />, exact: true },
  { label: "Mes biens",       to: "/agence/biens",      icon: <Home size={18} /> },
  { label: "Clients",         to: "/agence/clients",    icon: <Users size={18} /> },
  { label: "Agents",          to: "/agence/agents",        icon: <UserCircle size={18} /> },
  { label: "Propriétaires",   to: "/agence/proprietaires", icon: <KeyRound size={18} /> },
  { label: "Offres",          to: "/agence/offres",        icon: <Handshake size={18} /> },
  { label: "Visites",         to: "/agence/visites",    icon: <Calendar size={18} /> },
  { label: "Messages",        to: "/agence/messages",   icon: <MessageSquare size={18} /> },
  { label: "Statistiques",    to: "/agence/stats",      icon: <BarChart3 size={18} /> },
];

const BREADCRUMB_MAP: Record<string, string> = {
  agence: "Tableau de bord",
  biens: "Mes biens",
  nouveau: "Nouveau bien",
  clients: "Clients",
  agents: "Agents",
  proprietaires: "Propriétaires",
  offres: "Offres & Transactions",
  visites: "Visites",
  messages: "Messages",
  stats: "Statistiques",
  parametres: "Paramètres",
};

function useBreadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p, i) => ({
    label: BREADCRUMB_MAP[p] ?? p,
    to: "/" + parts.slice(0, i + 1).join("/"),
    isLast: i === parts.length - 1,
  }));
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const initials  = getInitials(profile);
  const fullName  = `${profile.prenom} ${profile.nom}`;

  return (
    <div className="flex flex-col h-full" style={{ background: NAVY }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${GOLD}22` }}>
          <Building2 size={17} style={{ color: GOLD }} />
        </div>
        <div>
          <div className="font-bold text-white text-sm" style={{ fontFamily: "'Playfair Display',serif" }}>
            Immo<span style={{ color: GOLD }}>Sénégal</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: `${GOLD}70` }}>Espace agence</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Quick action */}
      <div className="px-4 py-3">
        <Link to="/agence/biens/nouveau"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
          style={{ background: GOLD, color: "#fff" }}>
          <Plus size={15} />Nouveau bien
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, to, icon, exact }) => (
          <NavLink key={to} to={to} end={exact}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "text-white"
                  : "text-white/55 hover:text-white/80 hover:bg-white/5"
              }`
            }
            style={({ isActive }) => isActive ? { background: `${GOLD}22`, color: GOLD } : {}}
          >
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? GOLD : undefined }}>{icon}</span>
                {label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-3 mt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <NavLink to="/agence/parametres"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive ? "" : "text-white/55 hover:text-white/80 hover:bg-white/5"
              }`
            }
            style={({ isActive }) => isActive ? { background: `${GOLD}22`, color: GOLD } : {}}>
            <Settings size={18} />Paramètres
          </NavLink>
        </div>
      </nav>

      {/* Profile */}
      <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <NavLink
          to="/agence/parametres"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: profile.accentColor }}>{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">{fullName}</div>
            <div className="text-white/40 text-xs">{profile.title}</div>
          </div>
        </NavLink>

        <div className="flex items-center gap-1 mt-1">
          <Link to="/" onClick={onClose} className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-white/40 hover:text-white/70">
            <Home size={14} />Site public
          </Link>
          <button
            onClick={() => { onClose?.(); navigate("/"); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-white/30 hover:text-white/60 hover:bg-white/5"
            title="Déconnexion"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notification helpers ─────────────────────────────────────────────────────
const NOTIF_CFG: Record<NotifType, { Icon: LucideIcon; color: string }> = {
  prospect:         { Icon: Users,        color: "#3B82F6" },
  visite_demande:   { Icon: Calendar,     color: "#D97706" },
  visite_confirmée: { Icon: CheckCircle,  color: "#16A34A" },
  offre:            { Icon: Handshake,    color: GOLD      },
  statut:           { Icon: RefreshCw,    color: "#7C3AED" },
  transaction:      { Icon: Zap,          color: GOLD      },
};

function relTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "À l'instant";
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "Hier";
  if (days < 7)   return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-SN", { day: "2-digit", month: "short" });
}

function NotifPanel({ onClose }: { onClose: () => void }) {
  const notifs = useNotifications();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "unread">("all");

  const unreadCount = notifs.filter(n => !n.read).length;
  const displayed = tab === "unread" ? notifs.filter(n => !n.read) : notifs;

  const handleClick = (n: Notification) => {
    markRead(n.id);
    if (n.link) { navigate(n.link); onClose(); }
  };

  return (
    <div
      className="fixed right-0 top-0 h-full z-50 bg-white flex flex-col"
      style={{ width: 380, boxShadow: "-4px 0 32px rgba(15,28,46,0.12)", animation: "slideNotifIn 0.22s ease-out" }}
    >
      <style>{`@keyframes slideNotifIn { from { transform:translateX(100%); } to { transform:translateX(0); } }`}</style>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: B }}>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base" style={{ fontFamily: "'Playfair Display',serif", color: NAVY }}>
            Notifications
          </div>
          {unreadCount > 0 && (
            <div className="text-xs mt-0.5 font-medium" style={{ color: GOLD }}>
              {unreadCount} non lue{unreadCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-gray-50 shrink-0"
            style={{ borderColor: `${GOLD}50`, color: GOLD }}
          >
            <CheckCheck size={13} />Tout lire
          </button>
        )}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b shrink-0" style={{ borderColor: B }}>
        {(["all", "unread"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px"
            style={{ borderColor: tab === t ? GOLD : "transparent", color: tab === t ? NAVY : "#9CA3AF" }}
          >
            {t === "all" ? "Toutes" : `Non lues${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-6">
            <Bell size={28} className="text-gray-200 mb-3" />
            <div className="text-sm font-medium text-gray-400">
              {tab === "unread" ? "Aucune notification non lue" : "Aucune notification"}
            </div>
          </div>
        ) : (
          <div>
            {displayed.map((n, i) => {
              const cfg = NOTIF_CFG[n.type];
              return (
                <div
                  key={n.id}
                  className={`group flex gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50 border-b ${!n.read ? "bg-[#FDF9F3]" : "bg-white"}`}
                  style={{ borderColor: i < displayed.length - 1 ? B : "transparent" }}
                  onClick={() => handleClick(n)}
                >
                  {/* Type icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${cfg.color}15`, color: cfg.color }}
                  >
                    <cfg.Icon size={17} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold leading-tight ${!n.read ? "text-[#0F1C2E]" : "text-gray-700"}`}>
                          {n.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                          {n.message}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1.5 font-medium">
                          {relTime(n.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full" style={{ background: GOLD }} />
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifs.length > 0 && (
        <div className="shrink-0 px-5 py-3 border-t" style={{ borderColor: B }}>
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
          >
            Effacer toutes les notifications
          </button>
        </div>
      )}
    </div>
  );
}

export default function AgencyLayout() {
  const [sideOpen, setSideOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { profile } = useProfile();
  const layoutInitials = getInitials(profile);
  const breadcrumbs = useBreadcrumbs();
  const navigation = useNavigation();
  const loading = navigation.state === "loading";
  const { pathname } = useLocation();

  useEffect(() => { setSideOpen(false); }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "#F8F6F2" }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r" style={{ borderColor: B }}>
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {sideOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSideOpen(false)} />
          <div className="relative w-64 shrink-0">
            <Sidebar onClose={() => setSideOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 bg-white border-b px-5 flex items-center gap-3" style={{ height: 64, borderColor: B }}>
          <button
            onClick={() => setSideOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.to} className="flex items-center gap-1.5 min-w-0">
                {i > 0 && <ChevronRight size={13} className="text-gray-300 shrink-0" />}
                {crumb.isLast ? (
                  <span className="font-semibold text-[#0F1C2E] truncate">{crumb.label}</span>
                ) : (
                  <Link to={crumb.to} className="text-gray-400 hover:text-[#0F1C2E] transition-colors truncate">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <NotifBell onOpen={() => setNotifOpen(o => !o)} />
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: profile.accentColor }}
              title={`${profile.prenom} ${profile.nom}`}
            >
              {layoutInitials}
            </div>
          </div>
        </header>

        {/* Loading bar */}
        {loading && (
          <div className="h-0.5 overflow-hidden shrink-0">
            <div className="h-full" style={{ background: GOLD, animation: "slideIn 0.8s ease-in-out", width: "50%" }} />
            <style>{`@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(200%); } }`}</style>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Notification panel */}
      {notifOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setNotifOpen(false)} />
          <NotifPanel onClose={() => setNotifOpen(false)} />
        </>
      )}
    </div>
  );
}

function NotifBell({ onOpen }: { onOpen: () => void }) {
  const notifs = useNotifications();
  const unread = notifs.filter(n => !n.read).length;
  return (
    <button
      onClick={onOpen}
      className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
    >
      <Bell size={18} />
      {unread > 0 ? (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold px-1"
          style={{ background: GOLD, fontSize: 10, lineHeight: 1 }}
        >
          {unread > 9 ? "9+" : unread}
        </span>
      ) : (
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
      )}
    </button>
  );
}
