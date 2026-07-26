import { createBrowserRouter, Navigate } from "react-router";
import PublicLayout from "./layouts/PublicLayout";
import AgencyLayout from "./layouts/AgencyLayout";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import ContactPage from "./pages/ContactPage";
import DashboardPage from "./agency/DashboardPage";
import PropertiesPage from "./agency/PropertiesPage";
import NewPropertyPage from "./agency/NewPropertyPage";
import ClientsPage from "./agency/ClientsPage";
import MessagesPage from "./agency/MessagesPage";
import StatsPage from "./agency/StatsPage";
import VisitesPage from "./agency/VisitesPage";
import AgentsPage from "./agency/AgentsPage";
import OwnersPage from "./agency/OwnersPage";
import OffersPage from "./agency/OffersPage";
import ParametresPage from "./agency/ParametresPage";

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-40 text-center" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <div className="text-7xl font-bold text-gray-200 mb-4" style={{ fontFamily: "'DM Mono',monospace" }}>404</div>
      <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>Page introuvable</h2>
      <p className="text-gray-500 mb-6">La page que vous cherchez n'existe pas.</p>
      <a href="/" className="px-6 py-3 rounded-xl font-bold text-white text-sm" style={{ background: "#C9963A" }}>
        Retour à l'accueil
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "recherche", Component: SearchPage },
      { path: "bien/:id",  Component: PropertyDetailPage },
      { path: "contact",   Component: ContactPage },
      { path: "*",         Component: NotFound },
    ],
  },
  {
    path: "/agence",
    Component: AgencyLayout,
    children: [
      { index: true,               Component: DashboardPage },
      { path: "biens",             Component: PropertiesPage },
      { path: "biens/nouveau",     Component: NewPropertyPage },
      { path: "biens/:id",         Component: NewPropertyPage },
      { path: "clients",           Component: ClientsPage },
      { path: "agents",            Component: AgentsPage },
      { path: "proprietaires",     Component: OwnersPage },
      { path: "offres",            Component: OffersPage },
      { path: "visites",            Component: VisitesPage },
      { path: "messages",          Component: MessagesPage },
      { path: "stats",             Component: StatsPage },
      { path: "parametres",        Component: ParametresPage },
    ],
  },
]);
