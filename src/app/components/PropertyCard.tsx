import { useState } from "react";
import { Link } from "react-router";
import { MapPin, BedDouble, Bath, Maximize2, Heart, ArrowRight, Star } from "lucide-react";
import { type Prop, type Status, NAVY, GOLD, CREAM, B, STATUS_CFG, fmt } from "../data";

interface Props {
  prop: Prop;
  variant?: "grid" | "list";
}

export default function PropertyCard({ prop, variant = "grid" }: Props) {
  const [liked, setLiked] = useState(false);
  const st = STATUS_CFG[prop.status as Status];
  const isLoc = prop.transaction === "location";

  if (variant === "list") {
    return (
      <Link to={`/bien/${prop.id}`}
        className="group bg-white rounded-[20px] overflow-hidden border hover:shadow-[0_12px_40px_rgba(15,28,46,0.11)] hover:-translate-y-0.5 transition-all duration-300 flex"
        style={{ borderColor: B }}>
        <div className="relative overflow-hidden bg-[#E8E4DD] shrink-0" style={{ width: 200 }}>
          <img src={prop.img} alt={prop.title}
            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
          {prop.tag && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-white"
                style={{ background: GOLD }}><Star size={8} fill="currentColor" />{prop.tag}</span>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col p-4 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                </span>
                <span className="text-[10px] font-bold text-[#7A6A52] bg-[#F0EDE8] px-2 py-0.5 rounded-full">{prop.propertyType}</span>
              </div>
              <h3 className="font-bold text-[#0F1C2E] leading-snug truncate" style={{ fontFamily: "'Playfair Display',serif", fontSize: 15 }}>
                {prop.title}
              </h3>
              <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                <MapPin size={11} style={{ color: GOLD }} />{prop.location}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-bold" style={{ fontFamily: "'DM Mono',monospace", color: GOLD, fontSize: 16 }}>
                {fmt(prop.price)}
              </div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                FCFA{isLoc ? "/mois" : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-auto pt-2 border-t text-xs text-gray-500" style={{ borderColor: B }}>
            {prop.beds > 0 && <span className="flex items-center gap-1"><BedDouble size={12} style={{ color: GOLD }} />{prop.beds} ch.</span>}
            <span className="flex items-center gap-1"><Bath size={12} style={{ color: GOLD }} />{prop.baths} sdb.</span>
            <span className="flex items-center gap-1"><Maximize2 size={12} style={{ color: GOLD }} />{prop.surface} m²</span>
            <span className="ml-auto flex items-center gap-1 font-bold group-hover:text-[#0F1C2E] transition-colors" style={{ color: GOLD }}>
              Voir <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/bien/${prop.id}`}
      className="group bg-white rounded-[20px] overflow-hidden border shadow-sm hover:shadow-[0_20px_56px_rgba(15,28,46,0.13)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
      style={{ borderColor: B }}>
      {/* Image zone */}
      <div className="relative overflow-hidden bg-[#E8E4DD]" style={{ height: 228 }}>
        <img src={prop.img} alt={prop.title}
          className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[600ms] ease-out" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/8 to-transparent" />

        {prop.tag && (
          <div className="absolute top-3.5 left-3.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold text-white shadow"
              style={{ background: GOLD }}><Star size={9} fill="currentColor" />{prop.tag}</span>
          </div>
        )}

        <button onClick={e => { e.preventDefault(); setLiked(l => !l); }}
          className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm shadow transition-all duration-200"
          style={{ background: liked ? "#EF4444" : "rgba(255,255,255,0.88)" }}>
          <Heart size={14} fill={liked ? "currentColor" : "none"} className={liked ? "text-white" : "text-gray-600"} />
        </button>

        {/* Price pill */}
        <div className="absolute bottom-3.5 left-3.5">
          <div className="bg-white/96 backdrop-blur-sm rounded-[14px] px-3.5 py-2.5 shadow-md">
            <div className="font-bold leading-none" style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: GOLD }}>
              {fmt(prop.price)}
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
              FCFA{isLoc ? " / mois" : ""}
            </div>
          </div>
        </div>

        {/* Transaction badge */}
        <div className="absolute bottom-3.5 right-3.5">
          <span className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-white shadow-sm"
            style={{ background: isLoc ? GOLD : NAVY }}>
            {prop.transaction === "terrain" ? "Terrain" : isLoc ? "À louer" : "À vendre"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${st.bg} ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F0EDE8] text-[#7A6A52]">
            {prop.propertyType}
          </span>
        </div>

        <h3 className="font-bold text-[#0F1C2E] leading-snug mb-1.5" style={{ fontFamily: "'Playfair Display',serif", fontSize: 17 }}>
          {prop.title}
        </h3>

        <div className="flex items-center gap-1.5 text-gray-500 text-[13px] mb-4">
          <MapPin size={12} style={{ color: GOLD }} className="shrink-0" />{prop.location}
        </div>

        {/* Specs grid */}
        <div className="flex items-stretch rounded-xl border overflow-hidden mb-4" style={{ background: CREAM, borderColor: B }}>
          {prop.beds > 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 border-r" style={{ borderColor: B }}>
              <BedDouble size={14} style={{ color: GOLD }} />
              <span className="font-bold text-[#0F1C2E] text-sm">{prop.beds}</span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">ch.</span>
            </div>
          )}
          <div className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 ${prop.beds > 0 ? "border-r" : ""}`} style={{ borderColor: B }}>
            <Bath size={14} style={{ color: GOLD }} />
            <span className="font-bold text-[#0F1C2E] text-sm">{prop.baths}</span>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">sdb.</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3">
            <Maximize2 size={14} style={{ color: GOLD }} />
            <span className="font-bold text-[#0F1C2E] text-sm">{prop.surface}</span>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">m²</span>
          </div>
        </div>

        {/* Equipements */}
        {prop.equipements.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {prop.equipements.slice(0, 3).map(eq => (
              <span key={eq} className="px-2 py-1 rounded-full text-[11px] font-semibold text-gray-600 border" style={{ borderColor: B }}>
                {eq}
              </span>
            ))}
            {prop.equipements.length > 3 && (
              <span className="px-2 py-1 rounded-full text-[11px] font-semibold border" style={{ borderColor: B, color: GOLD }}>
                +{prop.equipements.length - 3}
              </span>
            )}
          </div>
        )}

        <button className="w-full mt-auto py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-250 bg-[#F0EDE8] text-[#0F1C2E] group-hover:bg-[#0F1C2E] group-hover:text-white">
          Voir le détail <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </Link>
  );
}
