import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Star, Send, CheckCircle, Building2 } from "lucide-react";
import { AGENTS, NAVY, GOLD, CREAM, B } from "../data";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", sujet: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div style={{ background: CREAM, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      {/* Hero */}
      <section className="relative py-20 overflow-hidden" style={{ background: NAVY }}>
        <div className="absolute inset-0 opacity-10">
          <img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&h=600&fit=crop&auto=format" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-[1200px] mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="w-8 h-px" style={{ background: `${GOLD}80` }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Contact</span>
            <span className="w-8 h-px" style={{ background: `${GOLD}80` }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display',serif" }}>
            Parlons de votre projet
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Notre équipe est disponible 7j/7 pour répondre à toutes vos questions immobilières.
          </p>
        </div>
      </section>

      {/* Info cards */}
      <div className="max-w-[1200px] mx-auto px-5 -mt-8 relative z-10 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Phone size={20} />, label: "Téléphone", value: "+221 77 123 45 67", href: "tel:+221771234567" },
            { icon: <Mail size={20} />, label: "Email", value: "contact@immosenegal.sn", href: "mailto:contact@immosenegal.sn" },
            { icon: <Clock size={20} />, label: "Disponibilité", value: "Lun–Sam, 8h–19h", href: undefined },
          ].map(({ icon, label, value, href }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border flex items-center gap-4" style={{ borderColor: B }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${GOLD}15`, color: GOLD }}>
                {icon}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
                {href ? (
                  <a href={href} className="font-bold text-sm hover:underline" style={{ color: NAVY }}>{value}</a>
                ) : (
                  <div className="font-bold text-sm" style={{ color: NAVY }}>{value}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1200px] mx-auto px-5 pb-20">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Contact form */}
          <div>
            <h2 className="text-2xl font-bold text-[#0F1C2E] mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
              Envoyez-nous un message
            </h2>
            <p className="text-gray-500 text-sm mb-6">Nous vous répondons sous 2 heures ouvrées.</p>

            {sent ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center bg-white rounded-2xl border" style={{ borderColor: B }}>
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle size={28} className="text-emerald-600" />
                </div>
                <div>
                  <div className="font-bold text-[#0F1C2E] text-lg mb-1">Message envoyé !</div>
                  <div className="text-sm text-gray-500">Notre équipe vous contactera très prochainement.</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSend} className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: B }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nom complet *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))}
                      placeholder="Moussa Diallo"
                      className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 transition-all"
                      style={{ borderColor: B, color: NAVY }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone *</label>
                    <input required value={form.phone} onChange={e => setForm(f => ({...f, phone:e.target.value}))}
                      placeholder="+221 77…"
                      className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 transition-all"
                      style={{ borderColor: B, color: NAVY }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))}
                    placeholder="votre@email.com"
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 transition-all"
                    style={{ borderColor: B, color: NAVY }} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Sujet</label>
                  <select value={form.sujet} onChange={e => setForm(f => ({...f, sujet:e.target.value}))}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                    style={{ borderColor: B, color: NAVY }}>
                    <option value="">Choisir un sujet</option>
                    <option>Achat d'un bien</option>
                    <option>Location d'un bien</option>
                    <option>Vendre mon bien</option>
                    <option>Estimation gratuite</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({...f, message:e.target.value}))}
                    placeholder="Décrivez votre projet immobilier…"
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none focus:ring-2 transition-all"
                    style={{ borderColor: B, color: NAVY }} />
                </div>
                <button type="submit"
                  className="w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors"
                  style={{ background: GOLD }}>
                  <Send size={16} />Envoyer le message
                </button>
                <p className="text-xs text-gray-400 text-center">Vos données sont protégées et ne seront jamais partagées.</p>
              </form>
            )}
          </div>

          {/* Agents + map */}
          <div className="space-y-6">
            {/* Agents */}
            <div id="agents">
              <h2 className="text-2xl font-bold text-[#0F1C2E] mb-6" style={{ fontFamily: "'Playfair Display',serif" }}>
                Notre équipe
              </h2>
              <div className="space-y-4">
                {AGENTS.map(agent => (
                  <div key={agent.name} className="bg-white rounded-2xl border p-5 flex items-center gap-4" style={{ borderColor: B }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ background: NAVY }}>
                      {agent.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#0F1C2E]">{agent.name}</div>
                      <div className="text-sm text-gray-500 mb-1">{agent.title}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => <Star key={i} size={11} fill={i <= Math.floor(agent.rating) ? GOLD : "none"} style={{ color: GOLD }} />)}
                        </div>
                        <span className="text-xs text-gray-400">{agent.rating} · {agent.listings} biens</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <a href={`tel:${agent.phone}`}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                        style={{ background: `${GOLD}15`, color: GOLD }}>
                        <Phone size={15} />
                      </a>
                      <a href={`mailto:${agent.email}`}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                        style={{ background: `${NAVY}10`, color: NAVY }}>
                        <Mail size={15} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Office location */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: B }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}15`, color: GOLD }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <div className="font-bold text-[#0F1C2E]">Notre agence</div>
                  <div className="text-sm text-gray-500">Almadies, Dakar</div>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden" style={{ height: 180 }}>
                <img src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=800&h=400&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2">
                    <MapPin size={14} style={{ color: GOLD }} />
                    <span className="text-sm font-bold text-[#0F1C2E]">Almadies, Dakar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
