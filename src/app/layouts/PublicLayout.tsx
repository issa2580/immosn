import { Outlet, useNavigation } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { GOLD } from "../data";

export default function PublicLayout() {
  const navigation = useNavigation();
  const loading = navigation.state === "loading";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      {/* Top loading bar */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden">
          <div
            className="h-full animate-pulse"
            style={{
              background: GOLD,
              animation: "progress 1s ease-in-out infinite",
              width: "60%",
            }}
          />
          <style>{`
            @keyframes progress {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
        </div>
      )}
      <Navbar />
      <main className={loading ? "opacity-70 transition-opacity" : "transition-opacity"}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
