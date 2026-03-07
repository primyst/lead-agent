"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "user" | "agent";

interface Message {
  id: number;
  role: Role;
  text: string;
  time: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ACCOUNT = {
  name: "Elara Whitfield",
  tier: "Private Client",
  accountId: "PC-0042-W",
  manager: "James Okafor",
  since: "2019",
  balance: "$4,280,000",
  status: "Verified",
};

const QUICK_ACTIONS = [
  "Review transactions",
  "Schedule advisor call",
  "Wire transfer limits",
  "Portfolio summary",
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: "agent",
    text: `Good afternoon, Ms. Whitfield. I'm ARIA, your dedicated support intelligence. Your Private Client status gives you priority access — how may I assist you today?`,
    time: now(),
  },
];

function now() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Orb ──────────────────────────────────────────────────────────────────────

function OrbPulse({ thinking }: { thinking: boolean }) {
  return (
    <div className="orb-container">
      <div className={`orb ${thinking ? "orb--thinking" : ""}`}>
        <div className="orb-inner" />
        <div className="orb-ring orb-ring--1" />
        <div className="orb-ring orb-ring--2" />
        <div className="orb-ring orb-ring--3" />
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`bubble-row ${isUser ? "bubble-row--user" : ""}`}>
      {!isUser && (
        <div className="bubble-avatar">
          <span>A</span>
        </div>
      )}
      <div className={`bubble ${isUser ? "bubble--user" : "bubble--agent"}`}>
        <p>{msg.text}</p>
        <span className="bubble-time">{msg.time}</span>
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="bubble-row">
      <div className="bubble-avatar">
        <span>A</span>
      </div>
      <div className="bubble bubble--agent bubble--typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <div className="sidebar-inner">
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="1" y="1" width="20" height="20" rx="5" stroke="var(--gold)" strokeWidth="1.4" />
            <path d="M6 11h10M11 6v10" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span>Meridian</span>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose} aria-label="Close sidebar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="sidebar-divider" />

      <div className="account-block">
        <div className="account-avatar">{ACCOUNT.name.charAt(0)}</div>
        <div>
          <p className="account-name">{ACCOUNT.name}</p>
          <p className="account-tier">{ACCOUNT.tier}</p>
        </div>
      </div>

      <div className="sidebar-divider" />

      <ul className="account-meta">
        {([
          ["Account ID", ACCOUNT.accountId],
          ["Relationship Mgr.", ACCOUNT.manager],
          ["Client Since", ACCOUNT.since],
          ["AUM", ACCOUNT.balance],
        ] as [string, string][]).map(([label, value]) => (
          <li key={label}>
            <span className="meta-label">{label}</span>
            <span className="meta-value">{value}</span>
          </li>
        ))}
      </ul>

      <div className="sidebar-divider" />

      <div className="status-badge">
        <span className="status-dot" />
        <span>{ACCOUNT.status} — Priority Queue</span>
      </div>

      <div className="sidebar-footer">
        <button className="footer-btn">Escalate to Advisor</button>
        <button className="footer-btn footer-btn--ghost">Secure Logout</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setDrawerOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;
    setMessages((m) => [...m, { id: Date.now(), role: "user", text: text.trim(), time: now() }]);
    setInput("");
    setThinking(true);

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const replies: Record<string, string> = {
      transaction: "Your last 5 transactions have been reviewed. I see a $24,000 wire to Barclays Geneva on Monday and a $7,500 investment in Vanguard ETFs. No anomalies detected.",
      advisor: "I've flagged a callback request for James Okafor. Expect contact within 2 business hours. Shall I send a calendar hold to your registered email?",
      wire: "As a Private Client, your daily wire limit is $2,000,000. International transfers above $500,000 require secondary authentication via your registered device.",
      portfolio: "Your portfolio is up 6.4% YTD. Equities account for 62%, fixed income 28%, and alternatives 10%. Full report available in your client portal.",
    };

    const key = Object.keys(replies).find((k) => text.toLowerCase().includes(k));
    const replyText = key
      ? replies[key]
      : "I've noted your request and flagged it for review. Given your Private Client status, a specialist will follow up within 1 business hour. Is there anything else I can assist with?";

    setMessages((m) => [...m, { id: Date.now() + 1, role: "agent", text: replyText, time: now() }]);
    setThinking(false);
  };

  return (
    <>
      <style>{CSS}</style>

      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
      )}

      <div className="page">
        {/* Desktop sidebar */}
        <aside className="sidebar sidebar--desktop">
          <SidebarContent />
        </aside>

        {/* Mobile drawer */}
        <aside className={`sidebar sidebar--drawer ${drawerOpen ? "sidebar--open" : ""}`}>
          <SidebarContent onClose={() => setDrawerOpen(false)} />
        </aside>

        <main className="chat-area">
          <header className="chat-header">
            <button
              className="menu-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open account panel"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <OrbPulse thinking={thinking} />

            <div className="header-text">
              <h1 className="chat-title">ARIA</h1>
              <p className="chat-subtitle">Adaptive Relationship Intelligence Agent</p>
            </div>

            <div className="header-status">
              <span className="status-dot" />
              <span className="status-label">{thinking ? "Processing…" : "Online"}</span>
            </div>
          </header>

          <div className="messages">
            {messages.map((m) => <Bubble key={m.id} msg={m} />)}
            {thinking && <TypingIndicator />}
            <div ref={endRef} />
          </div>

          <div className="quick-actions">
            {QUICK_ACTIONS.map((q) => (
              <button key={q} className="quick-btn" onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>

          <div className="input-bar">
            <input
              className="input-field"
              placeholder="Ask anything about your account…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              autoComplete="off"
            />
            <button className="send-btn" onClick={() => send(input)} disabled={thinking} aria-label="Send">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M16 9L2 2l3 7-3 7 14-7z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Mono:wght@300;400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0c0c0d;
    --surface: #131315;
    --surface2: #1a1a1d;
    --border: rgba(255,255,255,0.07);
    --gold: #c9a96e;
    --gold-dim: rgba(201,169,110,0.12);
    --text: #e8e4dc;
    --text-dim: rgba(232,228,220,0.45);
    --sidebar-w: 260px;
    --header-h: 68px;
    --font-serif: 'Cormorant Garamond', Georgia, serif;
    --font-mono: 'DM Mono', monospace;
  }

  html, body, #__next { height: 100%; }

  .page {
    display: flex;
    height: 100dvh;
    background: var(--bg);
    font-family: var(--font-mono);
    color: var(--text);
    overflow: hidden;
    position: relative;
  }

  /* ── Sidebar ─────────────────────────── */

  .sidebar {
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
  }

  .sidebar-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 28px 24px;
    overflow-y: auto;
  }

  .sidebar--desktop {
    width: var(--sidebar-w);
    flex-shrink: 0;
  }

  .sidebar--drawer {
    position: fixed;
    top: 0;
    left: 0;
    width: min(var(--sidebar-w), 85vw);
    height: 100dvh;
    z-index: 200;
    transform: translateX(-110%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 4px 0 32px rgba(0,0,0,0.5);
  }

  .sidebar--drawer.sidebar--open { transform: translateX(0); }

  @media (min-width: 768px) {
    .sidebar--desktop { display: flex; }
    .sidebar--drawer  { display: none; }
    .menu-btn         { display: none !important; }
  }

  @media (max-width: 767px) {
    .sidebar--desktop { display: none; }
    .sidebar--drawer  { display: flex; }
  }

  .drawer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(2px);
    z-index: 199;
  }

  .sidebar-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--gold);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    transition: color 0.2s;
    min-width: 32px; min-height: 32px;
    align-items: center; justify-content: center;
  }
  .close-btn:hover { color: var(--text); }

  .sidebar-divider {
    height: 1px;
    background: var(--border);
    margin: 20px 0;
    flex-shrink: 0;
  }

  .account-block {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .account-avatar {
    width: 40px; height: 40px;
    border-radius: 50%;
    background: var(--gold-dim);
    border: 1px solid var(--gold);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-serif);
    font-size: 18px;
    color: var(--gold);
    flex-shrink: 0;
  }

  .account-name {
    font-family: var(--font-serif);
    font-size: 15px; font-weight: 500;
    color: var(--text); line-height: 1.2;
  }

  .account-tier {
    font-size: 10px; color: var(--gold);
    letter-spacing: 0.12em; text-transform: uppercase; margin-top: 2px;
  }

  .account-meta {
    list-style: none;
    display: flex; flex-direction: column; gap: 14px;
  }

  .account-meta li {
    display: flex; justify-content: space-between;
    align-items: baseline; gap: 8px;
  }

  .meta-label {
    font-size: 10px; color: var(--text-dim);
    letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap;
  }

  .meta-value { font-size: 11px; color: var(--text); text-align: right; }

  .status-badge {
    display: flex; align-items: center; gap: 8px;
    font-size: 10px; color: var(--text-dim); letter-spacing: 0.08em;
  }

  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #4ade80; box-shadow: 0 0 6px #4ade80;
    flex-shrink: 0;
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
  }

  .sidebar-footer {
    margin-top: auto; padding-top: 20px;
    display: flex; flex-direction: column; gap: 8px;
  }

  .footer-btn {
    width: 100%; padding: 10px 14px;
    background: var(--gold-dim);
    border: 1px solid rgba(201,169,110,0.3);
    border-radius: 8px; color: var(--gold);
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.06em; cursor: pointer;
    transition: all 0.2s; min-height: 42px;
  }
  .footer-btn:hover { background: rgba(201,169,110,0.22); }

  .footer-btn--ghost {
    background: transparent; border-color: var(--border); color: var(--text-dim);
  }
  .footer-btn--ghost:hover {
    border-color: var(--text-dim); color: var(--text); background: transparent;
  }

  /* ── Chat ────────────────────────────── */

  .chat-area {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column;
    height: 100%; overflow: hidden;
  }

  .chat-header {
    display: flex; align-items: center; gap: 12px;
    padding: 0 20px; height: var(--header-h);
    min-height: var(--header-h);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0; background: var(--surface);
  }

  @media (min-width: 640px) {
    .chat-header { padding: 0 28px; gap: 16px; }
  }

  .menu-btn {
    background: none; border: none; color: var(--text-dim);
    cursor: pointer; padding: 8px; border-radius: 8px;
    display: flex; flex-shrink: 0; transition: color 0.2s;
    min-width: 40px; min-height: 40px;
    align-items: center; justify-content: center;
  }
  .menu-btn:hover { color: var(--text); }

  .header-text { flex: 1; min-width: 0; }

  .chat-title {
    font-family: var(--font-serif); font-size: 22px;
    font-weight: 600; letter-spacing: 0.1em;
    color: var(--text); line-height: 1;
  }

  .chat-subtitle {
    font-size: 9px; color: var(--text-dim);
    letter-spacing: 0.1em; text-transform: uppercase;
    margin-top: 3px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }

  @media (max-width: 400px) {
    .chat-subtitle { display: none; }
    .chat-title { font-size: 18px; }
  }

  .header-status {
    display: flex; align-items: center; gap: 7px;
    font-size: 10px; color: var(--text-dim);
    letter-spacing: 0.08em; flex-shrink: 0;
  }

  .status-label { white-space: nowrap; }

  @media (max-width: 380px) { .status-label { display: none; } }

  /* ── Orb ─────────────────────────────── */

  .orb-container {
    position: relative; width: 44px; height: 44px; flex-shrink: 0;
  }

  .orb {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
  }

  .orb-inner {
    width: 16px; height: 16px; border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, #e8d5a3, var(--gold));
    box-shadow: 0 0 12px rgba(201,169,110,0.6);
    transition: all 0.4s;
  }

  .orb--thinking .orb-inner {
    animation: orb-breathe 1.2s ease-in-out infinite;
    box-shadow: 0 0 20px rgba(201,169,110,0.9);
  }

  @keyframes orb-breathe {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3); }
  }

  .orb-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 1px solid rgba(201,169,110,0.2);
    animation: ring-expand 3s ease-out infinite;
  }
  .orb-ring--2 { animation-delay: 1s; }
  .orb-ring--3 { animation-delay: 2s; }

  @keyframes ring-expand {
    0%   { transform: scale(0.4); opacity: 0.7; }
    100% { transform: scale(1);   opacity: 0; }
  }

  /* ── Messages ────────────────────────── */

  .messages {
    flex: 1; overflow-y: auto;
    padding: 20px 16px;
    display: flex; flex-direction: column; gap: 16px;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
    -webkit-overflow-scrolling: touch;
  }

  @media (min-width: 640px) { .messages { padding: 28px 32px; gap: 20px; } }

  .bubble-row {
    display: flex; align-items: flex-end; gap: 8px;
    animation: fade-up 0.28s ease both;
  }

  .bubble-row--user { flex-direction: row-reverse; }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .bubble-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--gold-dim);
    border: 1px solid rgba(201,169,110,0.4);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-serif); font-size: 13px;
    color: var(--gold); flex-shrink: 0;
  }

  .bubble {
    max-width: min(500px, 78vw);
    padding: 12px 15px;
    border-radius: 14px;
    font-size: 13px; line-height: 1.7;
    word-break: break-word;
  }

  @media (min-width: 640px) { .bubble { padding: 14px 18px; } }

  .bubble--agent {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
    color: var(--text);
  }

  .bubble--user {
    background: var(--gold-dim);
    border: 1px solid rgba(201,169,110,0.22);
    border-bottom-right-radius: 4px;
    color: var(--text);
  }

  .bubble-time {
    display: block; font-size: 9px; color: var(--text-dim);
    margin-top: 6px; letter-spacing: 0.08em;
  }

  .bubble--typing {
    display: flex !important;
    align-items: center; gap: 5px;
  }

  .bubble--typing span {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--gold); opacity: 0.4;
    animation: typing-bounce 1.2s ease-in-out infinite;
  }
  .bubble--typing span:nth-child(2) { animation-delay: 0.2s; }
  .bubble--typing span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes typing-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40%           { transform: translateY(-5px); opacity: 1; }
  }

  /* ── Quick Actions ───────────────────── */

  .quick-actions {
    display: flex; gap: 8px;
    padding: 0 16px 12px;
    flex-shrink: 0;
    overflow-x: auto; scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    -webkit-mask-image: linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%);
    mask-image: linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%);
  }

  .quick-actions::-webkit-scrollbar { display: none; }

  @media (min-width: 640px) {
    .quick-actions {
      padding: 0 32px 16px;
      flex-wrap: wrap;
      overflow-x: visible;
      -webkit-mask-image: none; mask-image: none;
    }
  }

  .quick-btn {
    padding: 7px 14px;
    background: transparent;
    border: 1px solid var(--border); border-radius: 20px;
    color: var(--text-dim); font-family: var(--font-mono);
    font-size: 10px; letter-spacing: 0.06em;
    cursor: pointer; transition: all 0.2s;
    white-space: nowrap; flex-shrink: 0; min-height: 34px;
  }

  .quick-btn:hover, .quick-btn:active {
    border-color: var(--gold); color: var(--gold); background: var(--gold-dim);
  }

  /* ── Input Bar ───────────────────────── */

  .input-bar {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    flex-shrink: 0; background: var(--surface);
  }

  @media (min-width: 640px) {
    .input-bar { padding: 18px 32px; gap: 12px; }
  }

  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .input-bar {
      padding-bottom: calc(12px + env(safe-area-inset-bottom));
    }
  }

  .input-field {
    flex: 1; min-width: 0;
    background: var(--surface2);
    border: 1px solid var(--border); border-radius: 10px;
    padding: 12px 14px;
    font-family: var(--font-mono); font-size: 13px;
    color: var(--text); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }

  .input-field::placeholder { color: var(--text-dim); }

  .input-field:focus {
    border-color: rgba(201,169,110,0.4);
    box-shadow: 0 0 0 3px rgba(201,169,110,0.06);
  }

  .send-btn {
    width: 44px; height: 44px; min-width: 44px;
    border-radius: 10px; background: var(--gold);
    border: none; color: #0c0c0d; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, transform 0.15s;
    flex-shrink: 0;
  }

  .send-btn:hover  { background: #d4b47a; }
  .send-btn:active { transform: scale(0.93); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
`;
