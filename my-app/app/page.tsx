"use client"

import { useState, useEffect, useRef } from "react";

// ─── Config — swap this per client ───────────────────────────────────────────
const BRAND = {
  name: "Al-Qudus Travels",
  agentName: "Qudus",
  color: "#065f46", // emerald-800
  phone: "+234 801 234 5678",
  email: "hello@alqudus.travel",
  hours: "Mon – Sat, 8am – 7pm WAT",
  whatsapp: "2348012345678",
};

const PACKAGES = [
  { id: "dubai",    name: "Dubai Getaway",           duration: "5 days / 4 nights", price: 850000,   tag: "Popular",  includes: ["Return flights", "4-star hotel", "Airport transfers", "City tour", "Desert safari"] },
  { id: "london",   name: "London Explorer",          duration: "7 days / 6 nights", price: 1400000,  tag: "Value",    includes: ["Return flights", "3-star hotel", "Airport transfers", "Oyster card", "Thames cruise"] },
  { id: "istanbul", name: "Istanbul & Cappadocia",    duration: "6 days / 5 nights", price: 950000,   tag: "New",      includes: ["Return flights", "4-star hotel", "Hot air balloon", "Guided tours", "All transfers"] },
  { id: "maldives", name: "Maldives Escape",          duration: "5 days / 4 nights", price: 1800000,  tag: "Luxury",   includes: ["Return flights", "Overwater villa", "All meals", "Snorkelling", "Sunset cruise"] },
  { id: "umrah",    name: "Umrah Package",            duration: "10 days",           price: 750000,   tag: "Spiritual",includes: ["Return flights", "Hotel near Haram", "Ziyarah tours", "Ground transport", "Visa"] },
  { id: "local",    name: "Nigeria Road Trips",       duration: "3 – 5 days",        price: 120000,   tag: "Local",    includes: ["Transport", "Hotel", "Meals", "Activities", "Tour guide"] },
];

const FAQS: { q: string; a: string; id: string }[] = [
  { id: "visa",      q: "Visa & documents",        a: "We handle visa processing for Dubai, UK, Schengen, and more. Visa fees are separate from the package price. Once you book, we send you a full document checklist and guide you step by step." },
  { id: "payment",   q: "Payment & instalments",   a: "We accept bank transfers and card payments. A 50% deposit secures your booking, with the balance due 2 weeks before departure. Flexible instalment plans are available on select packages — just ask." },
  { id: "group",     q: "Group bookings",          a: "Yes! We offer group discounts for 5 or more travellers. Corporate retreats and family group packages can be fully customised around your schedule and budget." },
  { id: "children",  q: "Travelling with children",a: "Children under 2 travel free (no seat). Ages 2–11 get a discounted child fare. Our family packages include child-friendly hotels and age-appropriate activities." },
  { id: "cancel",    q: "Cancellation policy",     a: "Cancellations 30+ days before departure receive a 70% refund. Within 14 days of departure, bookings are non-refundable. We strongly recommend adding travel insurance to your package." },
  { id: "custom",    q: "Custom / other destinations", a: "If your destination isn't listed, we'll build a custom itinerary for you. Tell us where you want to go, your travel dates, and budget — and we'll handle the rest." },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type Sender = "agent" | "user";
type Step =
  | "welcome" | "main"
  | "packages" | "pkg_detail" | "pkg_quote_count" | "pkg_quote_date" | "pkg_quote_done"
  | "faq_list" | "faq_answer"
  | "book_name" | "book_contact" | "book_done"
  | "custom_dest" | "custom_budget" | "custom_done";

interface Chip  { label: string; value: string }
interface Msg   { id: number; sender: Sender; text: string; chips?: Chip[]; card?: typeof PACKAGES[0] }
interface State { step: Step; pkg?: typeof PACKAGES[0]; count?: number; name?: string; dest?: string }

let _id = 0;
const uid = () => ++_id;
const fmt = (n: number) => `₦${n.toLocaleString()}`;

// ─── Response Engine ──────────────────────────────────────────────────────────
function reply(val: string, label: string, st: State): { msgs: Omit<Msg,"id">[]; next: Partial<State> } {
  const v = val.toLowerCase();

  // Global shortcuts
  if (v === "menu")   return toMain("Anything else I can help with?");
  if (v === "book")   return { msgs: [{ sender:"agent", text:"What's your name?" }], next:{ step:"book_name" } };
  if (v === "faqs")   return toFaqList();
  if (v === "pkgs")   return toPkgList();

  switch (st.step) {
    case "welcome":
    case "main": {
      if (v === "pkgs")   return toPkgList();
      if (v === "quote")  return toPkgList("Sure! Which destination are you considering?");
      if (v === "book")   return { msgs:[{ sender:"agent", text:"What's your name?" }], next:{ step:"book_name" } };
      if (v === "faqs")   return toFaqList();
      if (v === "hours")  return { msgs:[agent(`We're available **${BRAND.hours}**. You can also reach us anytime via WhatsApp.`, mainChips())], next:{ step:"main" } };
      if (v === "contact")return { msgs:[agent(`📞 **${BRAND.phone}**\n✉️ **${BRAND.email}**\n🕐 ${BRAND.hours}`, mainChips())], next:{ step:"main" } };
      return toMain("I didn't catch that — here's what I can help with:");
    }

    case "packages": {
      const pkg = PACKAGES.find(p => p.id === v);
      if (pkg) return {
        msgs:[
          { sender:"agent", text:"", card: pkg },
          agent(`Interested in **${pkg.name}**?`, [
            { label:"Get a quote",      value:`quote_${pkg.id}` },
            { label:"Book a call",      value:"book" },
            { label:"← All packages",  value:"pkgs" },
          ]),
        ],
        next:{ step:"pkg_detail", pkg },
      };
      return toPkgList();
    }

    case "pkg_detail": {
      if (v.startsWith("quote_")) {
        const pkg = PACKAGES.find(p => `quote_${p.id}` === v)!;
        return {
          msgs:[agent(`How many people are travelling on the **${pkg.name}**?`, countChips())],
          next:{ step:"pkg_quote_count", pkg },
        };
      }
      if (v === "pkgs") return toPkgList();
      if (v === "book") return { msgs:[agent("What's your name?")], next:{ step:"book_name" } };
      return toMain();
    }

    case "pkg_quote_count": {
      const n = parseInt(v) || 2;
      return {
        msgs:[agent(`Got it — **${n === 5 ? "5+" : n}** traveller${n !== 1 ? "s" : ""}. When are you planning to travel?`, dateChips())],
        next:{ step:"pkg_quote_date", count: n },
      };
    }

    case "pkg_quote_date": {
      const pkg  = st.pkg!;
      const n    = st.count || 1;
      const disc = n >= 5 ? 0.10 : n >= 3 ? 0.05 : 0;
      const total = pkg.price * n * (1 - disc);
      const note  = disc ? ` _(includes ${disc * 100}% group discount)_` : "";
      return {
        msgs:[agent(
          `Here's your estimate:\n\n✈️ **${pkg.name}**\n👥 ${n} traveller${n!==1?"s":""} · ${label}\n💰 **${fmt(total)}**${note}\n\n_Prices are subject to flight availability. Visa fees are not included._`,
          [
            { label:"Book a consultation", value:"book" },
            { label:"View other packages", value:"pkgs" },
            { label:"Ask a question",      value:"faqs" },
          ]
        )],
        next:{ step:"pkg_quote_done" },
      };
    }

    case "pkg_quote_done":
    case "faq_answer":
    case "book_done":
    case "custom_done": {
      if (v === "pkgs") return toPkgList();
      if (v === "faqs") return toFaqList();
      if (v === "book") return { msgs:[agent("What's your name?")], next:{ step:"book_name" } };
      return toMain();
    }

    case "faq_list": {
      const faq = FAQS.find(f => f.id === v);
      if (faq) return {
        msgs:[
          agent(faq.a),
          agent("Was that helpful?", [
            { label:"Another question",    value:"faqs" },
            { label:"View packages",       value:"pkgs" },
            { label:"Book a consultation", value:"book" },
          ]),
        ],
        next:{ step:"faq_answer" },
      };
      return toFaqList();
    }

    case "book_name": return {
      msgs:[agent(`Nice to meet you, **${label}**! What's the best number or email to reach you?`)],
      next:{ step:"book_contact", name: label },
    };

    case "book_contact": return {
      msgs:[agent(
        `✅ Got it, **${st.name}**! A travel consultant will reach out to you on **${label}** within 2 business hours.\n\nOr contact us directly:\n📞 **${BRAND.phone}**\n✉️ **${BRAND.email}**`,
        [
          { label:"View packages", value:"pkgs" },
          { label:"Ask a question", value:"faqs" },
          { label:"Back to menu",   value:"menu" },
        ]
      )],
      next:{ step:"book_done" },
    };

    case "custom_dest": return {
      msgs:[agent(`${label} sounds amazing! What's your rough budget per person?`, [
        { label:"Under ₦500k",      value:"u500"  },
        { label:"₦500k – ₦1M",     value:"m1"    },
        { label:"₦1M – ₦2M",       value:"m2"    },
        { label:"Above ₦2M",        value:"m3"    },
      ])],
      next:{ step:"custom_budget", dest: label },
    };

    case "custom_budget": {
      const budgets: Record<string,string> = { u500:"under ₦500,000", m1:"₦500k – ₦1M", m2:"₦1M – ₦2M", m3:"above ₦2M" };
      return {
        msgs:[agent(
          `A custom trip to **${st.dest}** at **${budgets[v] || label}** per person is very doable. Our team will put together a full itinerary.\n\nShall I get someone to call you?`,
          [
            { label:"Yes, book a call",    value:"book" },
            { label:"I'll reach out later", value:"self" },
          ]
        )],
        next:{ step:"custom_done" },
      };
    }

    default: return toMain();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const agent = (text: string, chips?: Chip[]): Omit<Msg,"id"> => ({ sender:"agent", text, chips });

const mainChips = (): Chip[] => [
  { label:"✈️ Packages",        value:"pkgs"    },
  { label:"💰 Get a quote",     value:"quote"   },
  { label:"📞 Book a call",     value:"book"    },
  { label:"❓ FAQs",            value:"faqs"    },
  { label:"🕐 Opening hours",   value:"hours"   },
  { label:"📍 Contact us",      value:"contact" },
];

const countChips = (): Chip[] => [
  { label:"1 person",       value:"1" },
  { label:"2 people",       value:"2" },
  { label:"3 – 4 people",   value:"3" },
  { label:"5+ (group)",     value:"5" },
];

const dateChips = (): Chip[] => [
  { label:"Within a month",   value:"within a month"   },
  { label:"In 2 – 3 months",  value:"in 2–3 months"    },
  { label:"In 4 – 6 months",  value:"in 4–6 months"    },
  { label:"Just exploring",   value:"flexible / exploring" },
];

function toMain(text = "How can I help you today?"): ReturnType<typeof reply> {
  return { msgs:[agent(text, mainChips())], next:{ step:"main" } };
}

function toPkgList(text = "Here are our current packages:"): ReturnType<typeof reply> {
  return {
    msgs:[agent(text, PACKAGES.map(p => ({ label:`${p.name}  ·  ${fmt(p.price)}`, value: p.id })))],
    next:{ step:"packages" },
  };
}

function toFaqList(): ReturnType<typeof reply> {
  return {
    msgs:[agent("What would you like to know?", FAQS.map(f => ({ label: f.q, value: f.id })))],
    next:{ step:"faq_list" },
  };
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MD({ text }: { text: string }) {
  return (
    <span className="block space-y-0.5">
      {text.split("\n").map((line, i) => (
        <span key={i} className="block">
          {line.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
            chunk.startsWith("**") && chunk.endsWith("**")
              ? <strong key={j} className="font-semibold">{chunk.slice(2,-2)}</strong>
              : <span key={j}>{chunk}</span>
          )}
        </span>
      ))}
    </span>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────────
function PkgCard({ pkg }: { pkg: typeof PACKAGES[0] }) {
  return (
    <div className="rounded-xl overflow-hidden border border-stone-200 bg-white shadow-sm text-xs w-full">
      <div className="px-3.5 py-2.5 flex items-center justify-between" style={{ background: BRAND.color }}>
        <span className="text-white font-semibold text-[13px]">{pkg.name}</span>
        <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">{pkg.tag}</span>
      </div>
      <div className="px-3.5 py-2.5">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-base font-bold text-stone-800">{fmt(pkg.price)}</span>
          <span className="text-stone-400">{pkg.duration}</span>
        </div>
        <ul className="space-y-0.5">
          {pkg.includes.map(i => (
            <li key={i} className="flex items-center gap-1.5 text-stone-500">
              <span style={{ color: BRAND.color }}>✓</span>{i}
            </li>
          ))}
        </ul>
        <p className="text-stone-300 mt-2">* per person</p>
      </div>
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────
export default function SupportWidget() {
  const [open, setOpen]       = useState(false);
  const [unread, setUnread]   = useState(1);
  const [input, setInput]     = useState("");
  const [state, setState]     = useState<State>({ step: "welcome" });
  const [msgs, setMsgs]       = useState<Msg[]>([{
    id: uid(), sender: "agent",
    text: `Hi there! 👋 Welcome to **${BRAND.name}**. I'm ${BRAND.agentName}, your travel assistant.\n\nHow can I help you today?`,
    chips: mainChips(),
  }]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);
  useEffect(() => { if (open) setUnread(0); }, [open]);

  function dispatch(val: string, label: string) {
    const userMsg: Msg = { id: uid(), sender:"user", text: label };
    const { msgs: newMsgs, next } = reply(val, label, state);
    const agentMsgs: Msg[] = newMsgs.map(m => ({ ...m, id: uid() } as Msg));
    setMsgs(prev => [...prev, userMsg, ...agentMsgs]);
    setState(prev => ({ ...prev, ...next }));
  }

  function send() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    dispatch(text, text);
  }

  // Only show chips from the very last agent message
  const lastAgentChips = [...msgs].reverse().find(m => m.sender === "agent" && m.chips?.length)?.chips;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        .sw { font-family:'DM Sans',sans-serif; }
        @keyframes swIn  { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes msgIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        .sw-in  { animation:swIn  .22s cubic-bezier(.2,.8,.4,1) forwards }
        .msg-in { animation:msgIn .18s ease forwards }
        .sw-scroll::-webkit-scrollbar{width:3px}
        .sw-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:2px}
      `}</style>

      {/* ── Backdrop hint so reviewers can see the widget in context ── */}
      <div className="sw min-h-screen bg-gradient-to-br from-slate-100 to-sky-50 flex items-center justify-center relative">
        <div className="text-center select-none opacity-20 pointer-events-none">
          <p className="text-6xl mb-4">✈️</p>
          <p className="text-stone-400 text-sm tracking-widest uppercase">Business website</p>
        </div>

        {/* ── Widget panel ── */}
        {open && (
          <div className="sw-in fixed bottom-24 right-5 w-[360px] max-h-[580px] flex flex-col rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden z-50">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 shrink-0" style={{ background: BRAND.color }}>
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                  {BRAND.agentName[0]}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-[2px] border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-semibold leading-tight">{BRAND.agentName} · Support</p>
                <p className="text-white/60 text-[11px]">{BRAND.name}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors text-lg leading-none shrink-0 ml-1">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto sw-scroll px-4 py-4 space-y-2.5 bg-slate-50">
              {msgs.map(m => (
                <div key={m.id} className={`msg-in flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {m.card ? (
                    <div className="w-full"><PkgCard pkg={m.card} /></div>
                  ) : (
                    <div className={`max-w-[85%] text-[13px] leading-relaxed rounded-2xl px-3.5 py-2.5 ${
                      m.sender === "user"
                        ? "text-white rounded-br-sm font-medium"
                        : "bg-white text-stone-700 border border-stone-200 rounded-bl-sm shadow-sm"
                    }`} style={m.sender === "user" ? { background: BRAND.color } : {}}>
                      <MD text={m.text} />
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Chips */}
            {lastAgentChips && lastAgentChips.length > 0 && (
              <div className="px-3 py-2.5 border-t border-slate-100 bg-white flex flex-wrap gap-1.5 shrink-0">
                {lastAgentChips.map(c => (
                  <button
                    key={c.value}
                    onClick={() => dispatch(c.value, c.label)}
                    className="text-[11.5px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-600 hover:text-sky-700 transition-colors font-medium"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-100 bg-white shrink-0">
              <input
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-sky-400 transition-colors"
                placeholder="Type a message…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors disabled:bg-slate-200"
                style={{ background: input.trim() ? BRAND.color : undefined }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <p className="text-center text-[10px] text-slate-300 py-1.5 bg-white shrink-0">
              Powered by <span className="text-slate-400 font-medium">Primyst</span>
            </p>
          </div>
        )}

        {/* ── FAB ── */}
        <button
          onClick={() => setOpen(o => !o)}
          className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white text-xl transition-all hover:scale-105 active:scale-95"
          style={{ background: BRAND.color }}
        >
          {open ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {!open && unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
