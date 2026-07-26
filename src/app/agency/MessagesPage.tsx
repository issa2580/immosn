import { useState } from "react";
import { Send, Search, Phone, ArrowLeft } from "lucide-react";
import { NAVY, GOLD, B } from "../data";

const CONVERSATIONS = [
  { id: 1, name: "Moussa Diallo",  avatar: "MD", last: "Bonjour, je souhaite visiter la villa des Almadies ce weekend.", time: "Il y a 1h",   unread: 2, ref: "IS-2025-001" },
  { id: 2, name: "Aminata Sow",    avatar: "AS", last: "Est-ce que l'appartement est encore disponible ?",              time: "Il y a 3h",   unread: 1, ref: "IS-2025-003" },
  { id: 3, name: "Ibrahima Fall",  avatar: "IF", last: "Merci pour les informations sur le terrain à Saly.",            time: "Hier",        unread: 0, ref: "IS-2025-016" },
  { id: 4, name: "Fatou Ndiaye",   avatar: "FN", last: "Quand est-ce qu'on peut planifier une visite ?",                time: "Lundi",       unread: 0, ref: "IS-2025-010" },
  { id: 5, name: "Cheikh Mbaye",   avatar: "CM", last: "Le prix est-il négociable ?",                                   time: "28 mai",      unread: 0, ref: "IS-2025-004" },
];

function ConvMessages({ conv }: { conv: typeof CONVERSATIONS[0] }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "client", text: conv.last, time: conv.time },
    { from: "agent",  text: "Bonjour ! Je suis Amadou Ba de ImmoSénégal. Je suis ravi de vous aider.", time: "Tout à l'heure" },
  ]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(m => [...m, { from: "agent", text: input, time: "À l'instant" }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, { from: "client", text: "Merci pour votre réponse rapide !", time: "À l'instant" }]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b bg-white" style={{ borderColor: B }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: NAVY }}>
          {conv.avatar}
        </div>
        <div className="flex-1">
          <div className="font-bold text-[#0F1C2E] text-sm">{conv.name}</div>
          <div className="text-xs text-gray-400">Réf. {conv.ref}</div>
        </div>
        <a href={`tel:+221771234567`} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}15`, color: GOLD }}>
          <Phone size={16} />
        </a>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "agent" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[75%]">
              <div
                className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={{
                  background: msg.from === "agent" ? GOLD : "#F0EDE8",
                  color: msg.from === "agent" ? "white" : "#374151",
                  borderRadius: msg.from === "agent" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                }}
              >
                {msg.text}
              </div>
              <div className={`text-[10px] text-gray-400 mt-1 ${msg.from === "agent" ? "text-right" : "text-left"}`}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-3 px-5 py-4 border-t bg-white" style={{ borderColor: B }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder="Écrire un message…"
          className="flex-1 px-4 py-3 rounded-xl border text-sm outline-none transition-all"
          style={{ borderColor: B, color: NAVY }} />
        <button type="submit" className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-colors"
          style={{ background: GOLD }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof CONVERSATIONS[0] | null>(null);

  const filtered = CONVERSATIONS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.ref.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar list */}
      <div className={`flex flex-col border-r bg-white ${selected ? "hidden md:flex" : "flex"} shrink-0`}
        style={{ width: 300, borderColor: B }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: B }}>
          <h2 className="font-bold text-[#0F1C2E] mb-3">Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: B, color: NAVY }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: B }}>
          {filtered.map(conv => (
            <div key={conv.id} onClick={() => setSelected(conv)}
              className={`flex items-start gap-3 px-4 py-4 cursor-pointer transition-colors ${selected?.id === conv.id ? "" : "hover:bg-gray-50"}`}
              style={{ background: selected?.id === conv.id ? `${GOLD}10` : undefined }}>
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: NAVY }}>
                  {conv.avatar}
                </div>
                {conv.unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: GOLD }}>
                    {conv.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-sm truncate ${conv.unread > 0 ? "font-bold text-[#0F1C2E]" : "font-semibold text-gray-700"}`}>{conv.name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{conv.time}</span>
                </div>
                <div className="text-xs text-gray-400 truncate mt-0.5">{conv.last}</div>
                <div className="text-[10px] font-mono text-gray-300 mt-0.5">{conv.ref}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation area */}
      <div className={`flex-1 flex flex-col min-w-0 ${selected ? "flex" : "hidden md:flex"}`}>
        {selected ? (
          <>
            {/* Mobile back */}
            <div className="md:hidden">
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-500">
                <ArrowLeft size={16} />Retour
              </button>
            </div>
            <ConvMessages conv={selected} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${GOLD}15` }}>
              <Send size={24} style={{ color: GOLD }} />
            </div>
            <div className="font-semibold text-[#0F1C2E]">Sélectionnez une conversation</div>
            <div className="text-sm mt-1">Choisissez un contact à gauche pour voir la conversation.</div>
          </div>
        )}
      </div>
    </div>
  );
}
