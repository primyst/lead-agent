"use client"

import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `You are ARIA, a sharp, warm lead qualification agent for a digital services business. Your job is to turn website visitors into qualified leads — not answer general questions.

CONVERSATION FLOW:
1. Greet and ask what service they're looking for
2. Ask 1-2 short qualifying questions based on their answer (budget, timeline, business size, specific need)
3. Recommend a suitable service tier or package
4. Capture their name, email, and optionally phone number — collect these one at a time naturally
5. Confirm you've received their details and tell them someone will be in touch within 24 hours

RULES:
- Keep responses SHORT (2-3 sentences max)
- Sound human, not robotic
- Never ask more than one question at a time
- Once you have name + email, output a JSON block at the end of your message in this exact format: <<<LEAD:{"name":"...","email":"...","phone":"...","service":"...","summary":"..."}>>>
- Be confident and conversion-focused

Services available:
- Starter Website (₦150k–₦300k): 5-page brochure site
- Business Website (₦400k–₦700k): full site with booking/payments
- E-commerce Store (₦800k–₦1.5M): full online store
- Custom Web App (₦1.5M+): dashboards, platforms, SaaS
- Monthly Retainer (₦80k/mo): maintenance + updates`;

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Hi there 👋 I'm ARIA, your digital assistant. What kind of project are you thinking about — a website, an online store, or something custom?",
  id: 0,
};

const STATS = [
  { value: "3×", label: "More leads captured" },
  { value: "24/7", label: "Always available" },
  { value: "<30s", label: "Response time" },
];

const FEATURES = [
  {
    icon: "◈",
    title: "Smart Qualification",
    desc: "Asks the right questions to identify serious prospects before they leave.",
  },
  {
    icon: "◉",
    title: "Contact Capture",
    desc: "Collects name, email, and phone naturally through conversation.",
  },
  {
    icon: "◎",
    title: "Instant Routing",
    desc: "Sends qualified leads directly to your inbox, WhatsApp, or CRM.",
  },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-1.5 h-1.5 rounded-full bg-amber-400/70 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "1s" }}
        />
      ))}
    </div>
  );
}

function LeadBanner({ lead }: { lead: any }) {
  return (
    <div className="rounded-xl bg-emerald-950/60 border border-emerald-800/50 p-4 text-xs font-mono">
      <p className="text-emerald-400 tracking-widest text-[10px] font-semibold mb-3">✓ LEAD CAPTURED</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {[["Name", lead.name], ["Email", lead.email], ["Phone", lead.phone || "—"], ["Interest", lead.service]].map(([k, v]) => (
          <div key={k}>
            <p className="text-emerald-700 text-[9px] tracking-widest uppercase">{k}</p>
            <p className="text-emerald-200 text-[11px] font-medium truncate">{v}</p>
          </div>
        ))}
      </div>
      {lead.summary && (
        <div className="mt-3 pt-3 border-t border-emerald-900">
          <p className="text-emerald-700 text-[9px] tracking-widest uppercase mb-1">Notes</p>
          <p className="text-emerald-300/80 leading-relaxed">{lead.summary}</p>
        </div>
      )}
    </div>
  );
}

export default function LeadAgent() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [capturedLead, setCapturedLead] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim(), id: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || "Something went wrong. Please try again.";
      const leadMatch = raw.match(/<<<LEAD:(.*?)>>>/s);
      if (leadMatch) {
        try { setCapturedLead(JSON.parse(leadMatch[1])); } catch {}
      }
      const clean = raw.replace(/<<<LEAD:.*?>>>/s, "").trim();
      setMessages((prev) => [...prev, { role: "assistant", content: clean, id: Date.now() }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again.", id: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist+Mono:wght@400;500&family=Geist:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Instrument Serif', serif; }
        .font-mono-custom { font-family: 'Geist Mono', monospace; }
        .font-body { font-family: 'Geist', sans-serif; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .msg-in { animation: fadeUp 0.25s ease forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="font-body min-h-screen bg-[#F7F5F0] text-[#1a1814]">

        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-[#e2ddd6]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-[#1a1814] flex items-center justify-center">
              <span className="text-[#F7F5F0] text-[10px] font-semibold font-mono-custom">P</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">Primyst</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#6b6458]">
            <a href="#" className="hover:text-[#1a1814] transition-colors">Product</a>
            <a href="#" className="hover:text-[#1a1814] transition-colors">Pricing</a>
            <a href="#" className="hover:text-[#1a1814] transition-colors">Docs</a>
          </div>
          <button className="text-sm bg-[#1a1814] text-[#F7F5F0] px-4 py-2 rounded-lg hover:bg-[#2e2a24] transition-colors">
            Get started
          </button>
        </nav>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* Left — copy */}
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/80 rounded-full px-3 py-1 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[11px] font-mono-custom text-amber-700 tracking-widest font-medium">LEAD CAPTURE AI</span>
              </div>

              <h1 className="font-display text-[52px] leading-[1.08] tracking-tight text-[#1a1814] mb-6">
                Your website,<br />
                <em>working while<br />you sleep.</em>
              </h1>

              <p className="text-[#6b6458] text-[15px] leading-relaxed max-w-sm mb-10">
                ARIA is an AI agent that greets your visitors, qualifies them, and captures their contact details — so no lead ever leaves without a follow-up.
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-8 mb-10">
                {STATS.map(({ value, label }) => (
                  <div key={label}>
                    <p className="font-display text-3xl text-[#1a1814]">{value}</p>
                    <p className="text-[11px] text-[#9a9186] font-mono-custom mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="space-y-4">
                {FEATURES.map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="text-amber-600 mt-0.5 text-base leading-none">{icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1814]">{title}</p>
                      <p className="text-xs text-[#9a9186] mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — chat widget */}
            <div className="relative">
              {/* Decorative backdrop */}
              <div className="absolute -inset-4 bg-gradient-to-br from-amber-100/40 via-transparent to-stone-200/30 rounded-3xl -z-10" />

              <div className="bg-white rounded-2xl shadow-[0_8px_48px_rgba(0,0,0,0.10)] border border-[#e8e3db] overflow-hidden">

                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f0ece6] bg-[#faf9f7]">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                      A
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-[#1a1814]">ARIA</p>
                    <p className="text-[11px] text-emerald-600 font-mono-custom">Online now</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#c4bdb4] font-mono-custom tracking-wider">
                    AI AGENT
                  </div>
                </div>

                {/* Messages */}
                <div className="p-4 h-[340px] overflow-y-auto scrollbar-hide flex flex-col gap-3 bg-[#fdfdfc]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`msg-in flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] text-[13px] leading-relaxed rounded-2xl px-4 py-2.5 ${
                          msg.role === "user"
                            ? "bg-[#1a1814] text-[#f7f5f0] rounded-br-sm font-medium"
                            : "bg-[#f3f0eb] text-[#2e2a24] rounded-bl-sm border border-[#ebe6de]"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {capturedLead && <LeadBanner lead={capturedLead} />}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-[#f3f0eb] border border-[#ebe6de] rounded-2xl rounded-bl-sm px-4 py-2.5">
                        <TypingDots />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="flex items-end gap-2.5 px-4 py-3 border-t border-[#f0ece6] bg-[#faf9f7]">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    className="flex-1 resize-none bg-[#f3f0eb] border border-[#e2ddd6] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1a1814] placeholder-[#b0a89f] outline-none focus:border-amber-400/60 focus:ring-0 transition-colors font-body leading-relaxed"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="w-9 h-9 rounded-xl bg-[#1a1814] disabled:bg-[#d4cfc8] flex items-center justify-center flex-shrink-0 transition-colors hover:bg-[#2e2a24] disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

              </div>

              {/* Trust note below widget */}
              <p className="text-center text-[11px] text-[#b0a89f] font-mono-custom mt-4 tracking-wide">
                Powered by Primyst AI · Leads delivered to your inbox
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA strip */}
        <section className="border-t border-[#e2ddd6] bg-[#1a1814] py-12 px-6">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-display text-2xl text-[#f7f5f0] mb-1">Ready to stop losing leads?</p>
              <p className="text-[#6b6458] text-sm">Add ARIA to your website in under 10 minutes.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-5 py-2.5 text-sm border border-[#3a3530] text-[#9a9186] rounded-lg hover:border-[#6b6458] transition-colors">
                See pricing
              </button>
              <button className="px-5 py-2.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-400 transition-colors font-medium">
                Get early access
              </button>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
