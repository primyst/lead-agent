"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "user" | "agent" | "system";
type Stage = "chat" | "capture" | "captured";

interface Message {
  id: number;
  role: Role;
  text: string;
  options?: string[];
  time: string;
}

interface Lead {
  name: string;
  email: string;
  intent: string;
}

// ─── Knowledge base ───────────────────────────────────────────────────────────

const KB: { match: string[]; reply: string; followUp?: string; captureAfter?: boolean }[] = [
  {
    match: ["service", "offer", "what do you", "what can you"],
    reply: "We build **custom web products** — from marketing sites to full SaaS platforms. Our core stack is Next.js, Supabase, and TypeScript. Here's a quick overview:",
    followUp: "Which of these best fits what you need?",
    captureAfter: false,
  },
  {
    match: ["price", "cost", "how much", "budget", "rate", "fee"],
    reply: "Pricing depends on scope. As a rough guide:\n\n• **Landing page** — from ₦350k\n• **Web app / SaaS** — from ₦900k\n• **Full product build** — custom quote",
    followUp: "Want me to get Qudus to send you a proper quote? I just need a couple details.",
    captureAfter: true,
  },
  {
    match: ["time", "long", "timeline", "deadline", "week", "when"],
    reply: "Most projects ship in **3–8 weeks** depending on complexity. A landing page can be live in under 2 weeks. Full platforms take 6–10 weeks.",
    followUp: "Do you have a specific launch deadline? I can let the team know.",
    captureAfter: true,
  },
  {
    match: ["portfolio", "work", "example", "sample", "previous", "past"],
    reply: "You can view recent projects at **primyst.dev/work** — including Hairxpert (salon booking platform), a white-label ecommerce system, and various client sites.",
    followUp: "Would you like the team to walk you through a specific project?",
    captureAfter: false,
  },
  {
    match: ["contact", "reach", "talk", "speak", "call", "email", "whatsapp"],
    reply: "You can reach Qudus directly at **hello@primyst.dev** or on WhatsApp. Or — I can collect your info and have them get back to you within a few hours.",
    followUp: "Want me to arrange that callback?",
    captureAfter: true,
  },
  {
    match: ["tech", "stack", "built with", "framework", "react", "next", "supabase"],
    reply: "The core stack is **Next.js 15**, **Supabase** (auth + database), **TypeScript**, **TailwindCSS**, and **Paystack** for payments. Deployed on Vercel.",
    followUp: "Is there a specific integration you're wondering about?",
    captureAfter: false,
  },
  {
    match: ["yes", "sure", "okay", "ok", "please", "go ahead", "arrange", "quote", "send"],
    reply: "Great! Let me grab your details so we can follow up properly.",
    captureAfter: true,
  },
  {
    match: ["no", "not now", "maybe later", "nope"],
    reply: "No problem at all. Feel free to come back anytime — I'm here 24/7. Is there anything else I can help you with?",
    captureAfter: false,
  },
];

const SUGGESTIONS = [
  "What services do you offer?",
  "How much does a project cost?",
  "How long does it take?",
  "Can I see past work?",
];

function now() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function makeId() {
  return Date.now() + Math.random();
}

function getReply(text: string): { reply: string; followUp?: string; captureAfter?: boolean } {
  const lower = text.toLowerCase();
  for (const entry of KB) {
    if (entry.match.some((kw) => lower.includes(kw))) {
      return { reply: entry.reply, followUp: entry.followUp, captureAfter: entry.captureAfter };
    }
  }
  return {
    reply: "That's a great question — I want to make sure I give you the right answer. Let me loop in the team for this one.",
    followUp: "Can I grab your name and email so they can reach out?",
    captureAfter: true,
  };
}

// ─── Render bold markdown inline ──────────────────────────────────────────────

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Orb ──────────────────────────────────────────────────────────────────────

function Orb({ active }: { active: boolean }) {
  return (
    <div className="orb-wrap">
      <div className={`orb ${active ? "orb--active" : ""}`}>
        <div className="orb-core" />
        {[1, 2, 3].map((n) => (
          <div key={n} className={`orb-ring orb-ring--${n}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Lead capture card (inline in chat) ───────────────────────────────────────

function LeadCard({ onSubmit }: { onSubmit: (lead: Lead) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [intent, setIntent] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setErr("Please fill in your name and email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Please enter a valid email address.");
      return;
    }
    setErr("");
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    onSubmit({ name: name.trim(), email: email.trim(), intent: intent.trim() });
  };

  return (
    <div className="lead-card">
      <p className="lead-card-title">Quick introduction</p>
      <div className="lead-fields">
        <div className="lead-field">
          <label>Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amara Obi"
            autoComplete="name"
          />
        </div>
        <div className="lead-field">
          <label>Email address</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
          />
        </div>
        <div className="lead-field">
          <label>What are you building? <span className="optional">(optional)</span></label>
          <input
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="e.g. ecommerce site, SaaS product..."
          />
        </div>
        {err && <p className="lead-err">{err}</p>}
        <button className="lead-submit" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Sending…" : "Send to team →"}
        </button>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({
  msg,
  onOption,
  onCapture,
  stage,
}: {
  msg: Message;
  onOption: (o: string) => void;
  onCapture: (l: Lead) => void;
  stage: Stage;
}) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <div className="sys-msg">
        <span>{msg.text}</span>
      </div>
    );
  }

  return (
    <div className={`brow ${isUser ? "brow--user" : ""}`}>
      {!isUser && (
        <div className="bavatar">
          <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
            <rect x="1" y="1" width="20" height="20" rx="5" stroke="var(--gold)" strokeWidth="1.6" />
            <path d="M6 11h10M11 6v10" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
      )}
      <div className={`bubble ${isUser ? "bubble--user" : "bubble--agent"}`}>
        <p className="bubble-text">
          {msg.text.split("\n").map((line, i) => (
            <span key={i}>
              <RichText text={line} />
              {i < msg.text.split("\n").length - 1 && <br />}
            </span>
          ))}
        </p>
        {msg.options && stage === "chat" && (
          <div className="bubble-options">
            {msg.options.map((o) => (
              <button key={o} className="opt-btn" onClick={() => onOption(o)}>
                {o}
              </button>
            ))}
          </div>
        )}
        {msg.role === "agent" && stage === "capture" && msg === undefined && (
          <LeadCard onSubmit={onCapture} />
        )}
        <span className="bubble-time">{msg.time}</span>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function Typing() {
  return (
    <div className="brow">
      <div className="bavatar">
        <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
          <rect x="1" y="1" width="20" height="20" rx="5" stroke="var(--gold)" strokeWidth="1.6" />
          <path d="M6 11h10M11 6v10" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <div className="bubble bubble--agent bubble--typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ lead, msgCount, onClose }: { lead: Lead | null; msgCount: number; onClose?: () => void }) {
  return (
    <div className="sb-inner">
      <div className="sb-top">
        <div className="sb-logo">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <rect x="1" y="1" width="20" height="20" rx="5" stroke="var(--gold)" strokeWidth="1.5" />
            <path d="M6 11h10M11 6v10" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Primyst</span>
        </div>
        {onClose && (
          <button className="sb-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="sb-div" />

      <div className="sb-agent">
        <Orb active={false} />
        <div>
          <p className="sb-agent-name">Primyst AI</p>
          <p className="sb-agent-role">Support Agent</p>
        </div>
      </div>

      <div className="sb-div" />

      <div className="sb-section-label">Session</div>
      <ul className="sb-meta">
        {[
          ["Status", "Active"],
          ["Messages", String(msgCount)],
          ["Response time", "~2 sec"],
          ["Queue position", "Instant"],
        ].map(([k, v]) => (
          <li key={k}>
            <span className="sb-meta-key">{k}</span>
            <span className="sb-meta-val">{v}</span>
          </li>
        ))}
      </ul>

      <div className="sb-div" />

      <div className="sb-section-label">Visitor</div>
      {lead ? (
        <div className="sb-lead-card">
          <div className="sb-lead-row">
            <span className="sb-lead-label">Name</span>
            <span className="sb-lead-val">{lead.name}</span>
          </div>
          <div className="sb-lead-row">
            <span className="sb-lead-label">Email</span>
            <span className="sb-lead-val sb-lead-email">{lead.email}</span>
          </div>
          {lead.intent && (
            <div className="sb-lead-row">
              <span className="sb-lead-label">Interest</span>
              <span className="sb-lead-val">{lead.intent}</span>
            </div>
          )}
          <div className="sb-lead-captured">
            <span className="captured-dot" />
            Lead captured
          </div>
        </div>
      ) : (
        <p className="sb-no-lead">Not yet captured — Primyst will ask naturally.</p>
      )}

      <div className="sb-div" />

      <div className="sb-capabilities">
        <div className="sb-section-label">What Primyst does</div>
        {[
          ["⚡", "Answers questions instantly"],
          ["🎯", "Captures leads automatically"],
          ["🔁", "Escalates to humans when needed"],
          ["📊", "Logs every conversation"],
        ].map(([icon, label]) => (
          <div key={label as string} className="sb-cap">
            <span className="sb-cap-icon">{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="sb-footer">
        <div className="sb-online">
          <span className="online-dot" />
          <span>Online · 24/7 availability</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const WELCOME: Message = {
    id: 1,
    role: "agent",
    text: "Hey there 👋 I'm the Primyst AI agent. I can answer questions about our services, help you figure out what you need, and connect you with the team.",
    options: SUGGESTIONS,
    time: now(),
  };

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [stage, setStage] = useState<Stage>("chat");
  const [lead, setLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [captureCardId, setCaptureCardId] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, stage]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setDrawerOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const agentReply = useCallback(
    async (userText: string) => {
      setThinking(true);
      await new Promise((r) => setTimeout(r, 1100 + Math.random() * 700));

      const { reply, followUp, captureAfter } = getReply(userText);

      const mainMsg: Message = { id: makeId(), role: "agent", text: reply, time: now() };
      setMessages((m) => [...m, mainMsg]);

      if (followUp) {
        await new Promise((r) => setTimeout(r, 600));
        const followId = makeId();
        const fMsg: Message = { id: followId, role: "agent", text: followUp, time: now() };
        setMessages((m) => [...m, fMsg]);

        if (captureAfter && stage === "chat") {
          await new Promise((r) => setTimeout(r, 400));
          setStage("capture");
          setCaptureCardId(followId);
        }
      }

      setThinking(false);
    },
    [stage]
  );

  const send = useCallback(
    (text: string) => {
      if (!text.trim() || thinking || stage === "captured") return;
      const userMsg: Message = { id: makeId(), role: "user", text: text.trim(), time: now() };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      agentReply(text.trim());
    },
    [thinking, stage, agentReply]
  );

  const handleCapture = async (data: Lead) => {
    setLead(data);
    setStage("captured");

    const confirm: Message = {
      id: makeId(),
      role: "agent",
      text: `Thanks, ${data.name.split(" ")[0]}! 🎉 Your details have been sent to the Primyst team. Expect a response within a few hours.`,
      time: now(),
    };
    const follow: Message = {
      id: makeId(),
      role: "agent",
      text: "In the meantime, feel free to keep asking questions — I'm still here.",
      time: now(),
    };

    await new Promise((r) => setTimeout(r, 300));
    setMessages((m) => [...m, confirm]);
    await new Promise((r) => setTimeout(r, 500));
    setMessages((m) => [...m, follow]);
    setStage("chat");
  };

  const msgCount = messages.filter((m) => m.role !== "system").length;

  return (
    <>
      <style>{CSS}</style>

      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
      )}

      <div className="page">
        {/* Desktop sidebar */}
        <aside className="sb sb--desk">
          <Sidebar lead={lead} msgCount={msgCount} />
        </aside>

        {/* Mobile drawer */}
        <aside className={`sb sb--drawer ${drawerOpen ? "sb--open" : ""}`}>
          <Sidebar lead={lead} msgCount={msgCount} onClose={() => setDrawerOpen(false)} />
        </aside>

        <main className="chat">
          {/* Header */}
          <header className="chat-header">
            <button className="menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Menu">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <Orb active={thinking} />

            <div className="hd-text">
              <h1 className="hd-title">Primyst AI</h1>
              <p className="hd-sub">Support Agent · Powered by Primyst</p>
            </div>

            <div className="hd-status">
              <span className="online-dot" />
              <span className="hd-status-label">{thinking ? "Typing…" : "Online"}</span>
            </div>
          </header>

          {/* Messages */}
          <div className="messages">
            {messages.map((m) => (
              <div key={m.id}>
                <Bubble
                  msg={m}
                  onOption={(o) => send(o)}
                  onCapture={handleCapture}
                  stage={stage}
                />
                {/* Render lead capture card after the capture-trigger message */}
                {stage === "capture" && captureCardId === m.id && (
                  <div className="brow lead-card-wrap">
                    <div className="bavatar" style={{ visibility: "hidden" }} />
                    <LeadCard onSubmit={handleCapture} />
                  </div>
                )}
              </div>
            ))}
            {thinking && <Typing />}
            <div ref={endRef} />
          </div>

          {/* Suggestions (shown at start only) */}
          {messages.length <= 2 && stage === "chat" && (
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="sug-btn" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="input-row">
            <input
              ref={inputRef}
              className="input-field"
              placeholder={
                stage === "capture"
                  ? "Fill in your details above…"
                  : "Ask anything about Primyst…"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && stage !== "capture" && send(input)}
              disabled={stage === "capture"}
              autoComplete="off"
            />
            <button
              className="send-btn"
              onClick={() => send(input)}
              disabled={thinking || stage === "capture"}
              aria-label="Send"
            >
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                <path d="M16 9L2 2l3 7-3 7 14-7z" fill="currentColor" />
              </svg>
            </button>
          </div>

          <div className="chat-brand">Primyst AI · Available 24/7</div>
        </main>
      </div>
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Mono:wght@300;400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #0b0b0d;
    --surf:     #111114;
    --surf2:    #18181c;
    --surf3:    #1e1e23;
    --border:   rgba(255,255,255,0.07);
    --gold:     #c9a96e;
    --gold-d:   rgba(201,169,110,0.13);
    --gold-s:   rgba(201,169,110,0.28);
    --text:     #e8e4dc;
    --text-d:   rgba(232,228,220,0.45);
    --green:    #4ade80;
    --sb-w:     268px;
    --hh:       68px;
    --serif:    'Cormorant Garamond', Georgia, serif;
    --mono:     'DM Mono', monospace;
    --ease:     cubic-bezier(0.4,0,0.2,1);
  }

  html,body,#__next { height: 100%; }

  .page {
    display: flex;
    height: 100dvh;
    background: var(--bg);
    font-family: var(--mono);
    color: var(--text);
    overflow: hidden;
  }

  /* ── Sidebar ─────────────────────────── */

  .sb {
    background: var(--surf);
    border-right: 1px solid var(--border);
    overflow: hidden;
  }

  .sb-inner {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 26px 22px;
    overflow-y: auto;
    scrollbar-width: none;
  }
  .sb-inner::-webkit-scrollbar { display: none; }

  .sb--desk { width: var(--sb-w); flex-shrink: 0; }

  .sb--drawer {
    position: fixed;
    inset-block: 0;
    left: 0;
    width: min(var(--sb-w), 86vw);
    height: 100dvh;
    z-index: 200;
    transform: translateX(-110%);
    transition: transform 0.3s var(--ease);
    box-shadow: 6px 0 40px rgba(0,0,0,0.55);
  }
  .sb--drawer.sb--open { transform: translateX(0); }

  @media (min-width: 768px) {
    .sb--desk   { display: block; }
    .sb--drawer { display: none; }
    .menu-btn   { display: none !important; }
  }
  @media (max-width: 767px) {
    .sb--desk   { display: none; }
    .sb--drawer { display: block; }
  }

  .drawer-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(3px);
    z-index: 199;
  }

  .sb-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 22px;
  }

  .sb-logo {
    display: flex; align-items: center; gap: 9px;
    font-family: var(--serif); font-size: 19px;
    font-weight: 600; letter-spacing: 0.05em;
    color: var(--gold);
  }

  .sb-close {
    background: none; border: none; color: var(--text-d);
    cursor: pointer; padding: 6px; border-radius: 6px;
    display: flex; min-width: 30px; min-height: 30px;
    align-items: center; justify-content: center;
    transition: color 0.2s;
  }
  .sb-close:hover { color: var(--text); }

  .sb-div { height: 1px; background: var(--border); margin: 18px 0; flex-shrink: 0; }

  .sb-agent { display: flex; align-items: center; gap: 12px; }

  .sb-agent-name {
    font-family: var(--serif); font-size: 15px;
    font-weight: 500; color: var(--text); line-height: 1.2;
  }
  .sb-agent-role {
    font-size: 10px; color: var(--gold);
    letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px;
  }

  .sb-section-label {
    font-size: 9px; color: var(--text-d);
    letter-spacing: 0.14em; text-transform: uppercase;
    margin-bottom: 12px;
  }

  .sb-meta { list-style: none; display: flex; flex-direction: column; gap: 11px; }
  .sb-meta li { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .sb-meta-key { font-size: 10px; color: var(--text-d); letter-spacing: 0.07em; }
  .sb-meta-val { font-size: 11px; color: var(--text); }

  .sb-lead-card {
    background: var(--surf2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .sb-lead-row { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }
  .sb-lead-label { font-size: 9px; color: var(--text-d); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 1px; }
  .sb-lead-val { font-size: 11px; color: var(--text); text-align: right; }
  .sb-lead-email { color: var(--gold); }

  .sb-lead-captured {
    display: flex; align-items: center; gap: 6px;
    font-size: 9px; color: var(--green);
    letter-spacing: 0.08em; text-transform: uppercase;
    padding-top: 6px; border-top: 1px solid var(--border);
  }

  .captured-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--green); flex-shrink: 0;
  }

  .sb-no-lead {
    font-size: 11px; color: var(--text-d);
    line-height: 1.5; font-style: italic;
  }

  .sb-capabilities { display: flex; flex-direction: column; gap: 10px; }
  .sb-cap { display: flex; align-items: center; gap: 9px; font-size: 11px; color: var(--text-d); }
  .sb-cap-icon { font-size: 13px; }

  .sb-footer { margin-top: auto; padding-top: 18px; }
  .sb-online { display: flex; align-items: center; gap: 7px; font-size: 10px; color: var(--text-d); letter-spacing: 0.07em; }

  .online-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--green); box-shadow: 0 0 6px var(--green);
    flex-shrink: 0;
    animation: blink 2.2s ease-in-out infinite;
  }

  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* ── Orb ─────────────────────────────── */

  .orb-wrap { position: relative; width: 42px; height: 42px; flex-shrink: 0; }

  .orb { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }

  .orb-core {
    width: 15px; height: 15px; border-radius: 50%;
    background: radial-gradient(circle at 38% 32%, #edd9a3, var(--gold));
    box-shadow: 0 0 10px rgba(201,169,110,0.55);
    transition: all 0.35s;
  }

  .orb--active .orb-core {
    animation: breathe 1.1s ease-in-out infinite;
    box-shadow: 0 0 22px rgba(201,169,110,0.85);
  }

  @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }

  .orb-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 1px solid rgba(201,169,110,0.18);
    animation: ripple 3s ease-out infinite;
  }
  .orb-ring--2 { animation-delay: 1s; }
  .orb-ring--3 { animation-delay: 2s; }

  @keyframes ripple { 0%{transform:scale(0.35);opacity:0.7} 100%{transform:scale(1);opacity:0} }

  /* ── Chat ────────────────────────────── */

  .chat {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column;
    height: 100dvh; overflow: hidden;
  }

  .chat-header {
    display: flex; align-items: center; gap: 12px;
    padding: 0 18px; height: var(--hh); min-height: var(--hh);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0; background: var(--surf);
  }

  @media (min-width: 640px) { .chat-header { padding: 0 28px; gap: 14px; } }

  .menu-btn {
    background: none; border: none; color: var(--text-d);
    cursor: pointer; padding: 8px; border-radius: 8px;
    display: flex; flex-shrink: 0; transition: color 0.2s;
    min-width: 40px; min-height: 40px; align-items: center; justify-content: center;
  }
  .menu-btn:hover { color: var(--text); }

  .hd-text { flex: 1; min-width: 0; }

  .hd-title {
    font-family: var(--serif); font-size: 21px;
    font-weight: 600; letter-spacing: 0.08em;
    color: var(--text); line-height: 1;
  }

  .hd-sub {
    font-size: 9px; color: var(--text-d);
    letter-spacing: 0.1em; text-transform: uppercase;
    margin-top: 3px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }

  @media (max-width: 400px) { .hd-sub { display: none; } .hd-title { font-size: 17px; } }

  .hd-status {
    display: flex; align-items: center; gap: 7px;
    font-size: 10px; color: var(--text-d);
    letter-spacing: 0.07em; flex-shrink: 0;
  }
  .hd-status-label { white-space: nowrap; }
  @media (max-width: 380px) { .hd-status-label { display: none; } }

  /* ── Messages ────────────────────────── */

  .messages {
    flex: 1; overflow-y: auto;
    padding: 20px 16px;
    display: flex; flex-direction: column; gap: 14px;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
    -webkit-overflow-scrolling: touch;
  }

  @media (min-width: 640px) { .messages { padding: 24px 28px; gap: 18px; } }

  .brow {
    display: flex; align-items: flex-end; gap: 8px;
    animation: up 0.25s ease both;
  }
  .brow--user { flex-direction: row-reverse; }

  @keyframes up { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }

  .bavatar {
    width: 28px; height: 28px; flex-shrink: 0;
    border-radius: 8px;
    background: var(--gold-d);
    border: 1px solid rgba(201,169,110,0.35);
    display: flex; align-items: center; justify-content: center;
  }

  .bubble {
    max-width: min(480px, 76vw);
    padding: 11px 14px;
    border-radius: 14px;
    font-size: 13px; line-height: 1.7;
    word-break: break-word;
  }

  @media (min-width: 640px) { .bubble { padding: 13px 17px; } }

  .bubble--agent {
    background: var(--surf2);
    border: 1px solid var(--border);
    border-bottom-left-radius: 3px;
    color: var(--text);
  }

  .bubble--user {
    background: var(--gold-d);
    border: 1px solid var(--gold-s);
    border-bottom-right-radius: 3px;
    color: var(--text);
  }

  .bubble-text { white-space: pre-line; }

  .bubble-options {
    display: flex; flex-wrap: wrap; gap: 6px;
    margin-top: 12px;
  }

  .opt-btn {
    padding: 5px 11px;
    background: var(--surf3);
    border: 1px solid rgba(201,169,110,0.25);
    border-radius: 20px;
    color: var(--gold); font-family: var(--mono);
    font-size: 10px; letter-spacing: 0.04em;
    cursor: pointer; transition: all 0.18s;
    white-space: nowrap;
  }
  .opt-btn:hover { background: var(--gold-d); border-color: var(--gold); }

  .bubble-time {
    display: block; font-size: 9px; color: var(--text-d);
    margin-top: 6px; letter-spacing: 0.06em;
  }

  /* Typing */
  .bubble--typing {
    display: flex !important; align-items: center; gap: 5px;
    padding: 13px 16px !important;
  }
  .bubble--typing span {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--gold); opacity: 0.4;
    animation: dot 1.2s ease-in-out infinite;
  }
  .bubble--typing span:nth-child(2) { animation-delay: 0.2s; }
  .bubble--typing span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes dot {
    0%,80%,100%{transform:translateY(0);opacity:0.4}
    40%{transform:translateY(-5px);opacity:1}
  }

  /* System message */
  .sys-msg {
    text-align: center; font-size: 10px;
    color: var(--text-d); letter-spacing: 0.06em;
    padding: 4px 0;
  }

  /* ── Lead capture card ───────────────── */

  .lead-card-wrap { align-items: flex-start; }

  .lead-card {
    max-width: min(440px, 76vw);
    background: var(--surf2);
    border: 1px solid rgba(201,169,110,0.22);
    border-radius: 14px;
    padding: 16px;
    animation: up 0.3s ease both;
  }

  .lead-card-title {
    font-family: var(--serif); font-size: 14px;
    font-weight: 500; color: var(--gold);
    margin-bottom: 14px; letter-spacing: 0.03em;
  }

  .lead-fields { display: flex; flex-direction: column; gap: 10px; }

  .lead-field { display: flex; flex-direction: column; gap: 5px; }

  .lead-field label {
    font-size: 10px; color: var(--text-d);
    letter-spacing: 0.08em; text-transform: uppercase;
  }
  .optional { font-size: 9px; color: var(--text-d); text-transform: none; letter-spacing: 0; }

  .lead-field input {
    background: var(--surf3);
    border: 1px solid var(--border);
    border-radius: 8px; padding: 9px 12px;
    font-family: var(--mono); font-size: 12px;
    color: var(--text); outline: none;
    transition: border-color 0.2s;
    -webkit-appearance: none;
  }
  .lead-field input::placeholder { color: var(--text-d); }
  .lead-field input:focus { border-color: rgba(201,169,110,0.4); }

  .lead-err { font-size: 11px; color: #f87171; }

  .lead-submit {
    margin-top: 4px; width: 100%; padding: 10px;
    background: var(--gold); border: none;
    border-radius: 8px; color: #0b0b0d;
    font-family: var(--mono); font-size: 12px;
    letter-spacing: 0.05em; cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    min-height: 40px;
  }
  .lead-submit:hover { background: #d4b47a; }
  .lead-submit:active { transform: scale(0.97); }
  .lead-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Suggestions ─────────────────────── */

  .suggestions {
    display: flex; gap: 7px;
    padding: 0 16px 12px;
    flex-shrink: 0;
    overflow-x: auto; scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    -webkit-mask-image: linear-gradient(to right,transparent 0,black 12px,black calc(100% - 12px),transparent 100%);
    mask-image: linear-gradient(to right,transparent 0,black 12px,black calc(100% - 12px),transparent 100%);
  }
  .suggestions::-webkit-scrollbar { display: none; }

  @media (min-width: 640px) {
    .suggestions {
      padding: 0 28px 14px;
      flex-wrap: wrap; overflow-x: visible;
      -webkit-mask-image: none; mask-image: none;
    }
  }

  .sug-btn {
    padding: 7px 13px;
    background: transparent;
    border: 1px solid var(--border); border-radius: 20px;
    color: var(--text-d); font-family: var(--mono);
    font-size: 10px; letter-spacing: 0.05em;
    cursor: pointer; transition: all 0.18s;
    white-space: nowrap; flex-shrink: 0; min-height: 34px;
  }
  .sug-btn:hover,.sug-btn:active {
    border-color: var(--gold); color: var(--gold); background: var(--gold-d);
  }

  /* ── Input ───────────────────────────── */

  .input-row {
    display: flex; align-items: center; gap: 9px;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    flex-shrink: 0; background: var(--surf);
  }

  @media (min-width: 640px) { .input-row { padding: 16px 28px; gap: 10px; } }

  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .input-row { padding-bottom: calc(12px + env(safe-area-inset-bottom)); }
  }

  .input-field {
    flex: 1; min-width: 0;
    background: var(--surf2); border: 1px solid var(--border);
    border-radius: 10px; padding: 11px 14px;
    font-family: var(--mono); font-size: 13px;
    color: var(--text); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }
  .input-field::placeholder { color: var(--text-d); }
  .input-field:focus { border-color: rgba(201,169,110,0.4); box-shadow: 0 0 0 3px rgba(201,169,110,0.06); }
  .input-field:disabled { opacity: 0.45; cursor: not-allowed; }

  .send-btn {
    width: 42px; height: 42px; min-width: 42px;
    border-radius: 10px; background: var(--gold);
    border: none; color: #0b0b0d; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.18s, transform 0.12s; flex-shrink: 0;
  }
  .send-btn:hover { background: #d4b47a; }
  .send-btn:active { transform: scale(0.93); }
  .send-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

  .chat-brand {
    text-align: center; font-size: 9px;
    color: var(--text-d); letter-spacing: 0.09em;
    padding: 6px 0 10px;
    flex-shrink: 0;
  }

  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .chat-brand { padding-bottom: calc(8px + env(safe-area-inset-bottom)); }
  }
`;
