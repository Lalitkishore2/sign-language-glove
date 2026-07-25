/**
 * @fileoverview Communication Hub — Screen 05.
 * Three-column layout: Conversation list · Active chat · AI Assistant panel.
 * All messaging and AI logic is placeholder stub — no real backend.
 */
import React, { useState, useCallback, memo } from "react";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Conversation {
  id: string;
  name: string;
  preview: string;
  time: string;
  online: boolean;
  avatar?: string;
  initials?: string;
}

type MessageFrom = "received" | "sent";

interface ChatMessage {
  id: string;
  from: MessageFrom;
  text: string;
  time: string;
  isLive?: boolean;
}

/* ─── Sample data ─────────────────────────────────────────────────────────── */
const CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    preview: "Translating ASL input…",
    time: "Now",
    online: true,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB_3gZVMYDuJbTtNgX2NQ_iEdvzp5u4VRwavWXDU0j_sb8G-bL5A2D7y4p5klk3slnidiC8LiMMP26q1HgQ46BNebxWiGD66prZA2319hkinVR9NKEivwo3XZBFaqrRWN2f-8M-knIxLk75ncygvHg0V40yjQJQ3fufBCHa8EmGeerT_yhKjwcWPJYruRX71mB_HSLsANmnzgo8Q3WhTL6diY9eZ_qwYxKEsOI-F-ENnsuOfubuCeT0dw",
  },
  {
    id: "2",
    name: "Marketing Team Sync",
    preview: "I'll review the deck later.",
    time: "2h",
    online: false,
    initials: "M",
  },
  {
    id: "3",
    name: "David Chen",
    preview: "Thanks for the notes.",
    time: "Yesterday",
    online: false,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB4ES1WHeO1cb5LQ1f6U6OEjftmfbl9YQyj7igH1igF7lldmkH5cPLihniEeAShpJHYFxuq9IjvGDXYmybOyf9dG5OjnXwg8wU5JeN7hpgkuDnSc0oogOC4HMWL_ZbA_ROBU7JFgEDpqZs2_cntYayqdfAmPbOpXiX-cx6W21cSImS438LyDgnDIk7YhYZXOzaGUUxOl0n9btl4en4pbBUtQgJlRW56CzVe3NCHl7mS2FiKXSl9G8feBQ",
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    from: "received",
    text: "Hi! Are we still on for the project review at 2 PM?",
    time: "10:42 AM",
  },
  {
    id: "m2",
    from: "sent",
    text: "Yes, I have the prototypes ready.",
    time: "10:45 AM",
  },
  {
    id: "m3",
    from: "received",
    text: '"Great, I will…"',
    time: "10:46 AM",
    isLive: true,
  },
];

const QUICK_ACTIONS = ['"I\'ll share the link now."', '"Need 5 more minutes."'];
const RECENT_SIGNS = ["Prototype", "Review"];

/* ─── Avatar helper ───────────────────────────────────────────────────────── */
function ConvAvatar({
  conv,
  size = "md",
}: {
  conv: Conversation;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "w-10 h-10" : "w-12 h-12";
  if (conv.avatar) {
    return (
      <img src={conv.avatar} alt={conv.name} className={`${dim} rounded-full object-cover`} />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-title-lg`}
    >
      {conv.initials ?? conv.name[0]}
    </div>
  );
}

/* ─── Conversation List ───────────────────────────────────────────────────── */
const ConversationList = memo(function ConversationList({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Conversations"
      className="w-full md:w-1/4 border-r border-outline-variant bg-surface-primary flex flex-col h-full shrink-0 min-w-[200px]"
    >
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-primary/90 sticky top-0 z-10 backdrop-blur-sm shrink-0">
        <h2 className="font-title-lg text-title-lg text-on-surface font-semibold">Messages</h2>
        <button
          aria-label="Start new conversation"
          className="bg-primary-container text-on-primary-container p-2 rounded-full hover:bg-primary-fixed transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
            add
          </span>
        </button>
      </div>

      <ul className="overflow-y-auto flex-1 p-2 space-y-2" role="list">
        {CONVERSATIONS.map((conv) => (
          <li key={conv.id} role="listitem">
            <button
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left p-3 rounded-xl cursor-pointer transition-colors relative overflow-hidden ${
                conv.id === active
                  ? "bg-surface-elevated border border-outline-variant shadow-sm"
                  : "bg-transparent hover:bg-surface-elevated border border-transparent hover:border-outline-variant"
              }`}
              aria-current={conv.id === active ? "true" : undefined}
              aria-label={`Conversation with ${conv.name}. ${conv.online ? "Online" : "Offline"}. Last message: ${conv.preview}`}
            >
              {conv.id === active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl" aria-hidden="true" />
              )}
              <div className="flex gap-3 items-center pl-1">
                <div className="relative shrink-0">
                  <ConvAvatar conv={conv} />
                  {conv.online && (
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface-elevated"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span
                      className={`font-label-md text-label-md truncate ${
                        conv.id === active ? "text-on-surface font-semibold" : "text-on-surface"
                      }`}
                    >
                      {conv.name}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0 ml-1">
                      {conv.time}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    {conv.preview}
                  </p>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
});

/* ─── Live bubble ────────────────────────────────────────────────────────── */
function LiveBubble({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-start gap-2 max-w-[80%]">
      <div className="glass-panel p-2 rounded-2xl rounded-tl-sm shadow-lg flex items-center gap-3">
        <div className="w-32 h-24 bg-black rounded-lg overflow-hidden relative shrink-0">
          <div
            className="w-full h-full bg-cover bg-center opacity-80"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCY5sv23PnL60AC2SKCwXu8cHEtaTA_ivBFUq40iB2ori6oteL32aionEhHaMKutC8I40GsRlIckEu_uqZvSp8U-Ge5u9QAxf967vTt5v9uQgChS6Nhb2EcPch4jY9kThKTuYSCE105LsbvPrDKg6eYPlwfrF1plpJjaz3k8TswSteq5A8ywyjET_ujtyvl70nOyN9-3iJpm4GOUsQbDeHjHVf4f_lX5bOifWwml40rxrNjRLyKYjvYLg')",
            }}
            role="img"
            aria-label="Live sign language feed thumbnail"
          />
          <div className="absolute inset-0 border-2 border-secondary rounded-lg animate-pulse" aria-hidden="true" />
          <div className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[8px] text-secondary font-mono" aria-hidden="true">
            LIVE
          </div>
        </div>
        <div className="flex flex-col justify-center pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="material-symbols-outlined text-secondary text-sm animate-spin"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              sync
            </span>
            <span className="font-label-sm text-label-sm text-secondary">Interpreting…</span>
          </div>
          <p className="font-body-default text-body-default text-on-surface opacity-70 italic">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Active Conversation ─────────────────────────────────────────────────── */
function ActiveConversation({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  const conv = CONVERSATIONS.find((c) => c.id === conversationId) ?? CONVERSATIONS[0];

  const sendMessage = useCallback(
    (text?: string) => {
      const content = (text ?? input).trim();
      if (!content) return;
      setMessages((prev) => [
        ...prev,
        { id: `m${Date.now()}`, from: "sent", text: content, time: "Now" },
      ]);
      setInput("");
    },
    [input]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="flex-1 bg-bg-base flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-outline-variant bg-surface/80 backdrop-blur-md flex items-center px-6 justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <ConvAvatar conv={conv} size="sm" />
          <div>
            <h2 className="font-label-md text-label-md text-on-surface font-semibold">
              {conv.name}
            </h2>
            <div className="flex items-center gap-1">
              {conv.online && (
                <div className="w-2 h-2 bg-success rounded-full" aria-hidden="true" />
              )}
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {conv.online ? "Active · ASL / English" : "Offline"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {[
            { icon: "videocam", label: "Video call" },
            { icon: "call", label: "Voice call" },
            { icon: "more_vert", label: "More options" },
          ].map((btn) => (
            <button
              key={btn.label}
              aria-label={btn.label}
              className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"
            >
              <span className="material-symbols-outlined" aria-hidden="true">{btn.icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative"
        role="log"
        aria-live="polite"
        aria-label="Message history"
      >
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: "radial-gradient(circle at center, #ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="flex justify-center">
          <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm text-xs">
            Today
          </span>
        </div>

        {messages.map((msg) => {
          if (msg.isLive) {
            return (
              <div key={msg.id} className="relative z-10">
                <LiveBubble text={msg.text} />
              </div>
            );
          }

          if (msg.from === "received") {
            return (
              <div key={msg.id} className="relative z-10 flex flex-col items-start max-w-[80%] gap-1">
                <div className="bg-surface-elevated text-on-surface px-4 py-3 rounded-2xl rounded-tl-sm border border-outline-variant shadow-sm">
                  <p className="font-body-default text-body-default">{msg.text}</p>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant ml-1 text-[10px]">
                  {msg.time}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className="relative z-10 flex flex-col items-end max-w-[80%] self-end gap-1">
              <div className="bg-primary-container text-on-primary-container px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm">
                <p className="font-body-default text-body-default">{msg.text}</p>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant mr-1 text-[10px]">
                {msg.time} · Translated from ASL
              </span>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-surface/90 backdrop-blur-xl border-t border-outline-variant shrink-0 z-10">
        <div className="bg-surface-secondary border border-outline-variant rounded-2xl p-2 flex flex-col gap-2 focus-within:border-primary transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant font-body-default text-body-default resize-none p-2 outline-none"
            placeholder="Type a message or start signing…"
            rows={2}
            aria-label="Message input"
          />
          <div className="flex justify-between items-center px-2 pb-1">
            <div className="flex gap-1">
              {[
                { icon: "sign_language", label: "Sign language camera input" },
                { icon: "attach_file", label: "Attach file" },
                { icon: "sentiment_satisfied", label: "Insert emoji" },
              ].map((btn) => (
                <button
                  key={btn.label}
                  aria-label={btn.label}
                  className="p-2 text-on-surface-variant hover:bg-surface-variant hover:text-secondary rounded-xl transition-colors"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 0" }}
                    aria-hidden="true"
                  >
                    {btn.icon}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => sendMessage()}
              aria-label="Send message"
              className="bg-primary text-on-primary p-2 rounded-xl hover:bg-primary-fixed transition-colors flex items-center justify-center"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                send
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── AI Assistant Panel ──────────────────────────────────────────────────── */
const AIAssistantPanel = memo(function AIAssistantPanel() {
  return (
    <aside
      className="hidden lg:flex w-[300px] xl:w-[320px] border-l border-outline-variant bg-surface-primary flex-col h-full shrink-0"
      aria-label="AI Assistant panel"
    >
      <div className="p-6 border-b border-outline-variant h-16 flex flex-col justify-center shrink-0">
        <h2 className="font-label-md text-label-md text-secondary font-semibold">AI Assistant</h2>
        <span className="font-label-sm text-label-sm text-on-surface-variant text-[10px]">
          Contextual Intelligence
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-surface-elevated rounded-xl p-4 border border-outline-variant shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
              auto_awesome
            </span>
            <h3 className="font-label-md text-label-md text-on-surface">Conversation Context</h3>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Discussing the upcoming project review at 2 PM. Sarah is expecting prototypes to be
            ready.
          </p>
        </div>

        <div>
          <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 0" }} aria-hidden="true">
              bolt
            </span>
            Quick Actions
          </h3>
          <div className="flex flex-col gap-2">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa}
                className="bg-surface-container-high hover:bg-surface-variant border border-outline-variant rounded-lg p-3 text-left transition-colors flex justify-between items-center group"
                aria-label={`Send quick message: ${qa}`}
              >
                <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors">
                  {qa}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-primary" aria-hidden="true">
                  send
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-outline-variant pt-6">
          <h3 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 0" }} aria-hidden="true">
              school
            </span>
            Recent Signs
          </h3>
          <div className="flex flex-wrap gap-2">
            {RECENT_SIGNS.map((sign) => (
              <button
                key={sign}
                className="bg-surface-container border border-outline-variant text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm hover:bg-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
                aria-label={`Learn more about the sign for ${sign}`}
              >
                {sign}
                <span className="material-symbols-outlined text-[12px]" aria-hidden="true">info</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
});

/* ─── Communication Page ──────────────────────────────────────────────────── */
export function CommunicationPage() {
  const [activeConv, setActiveConv] = useState("1");

  return (
    <WorkspaceLayout fullHeight headerTitle="Communication Hub">
      <div className="flex flex-1 overflow-hidden h-full">
        <ConversationList active={activeConv} onSelect={setActiveConv} />
        <ActiveConversation conversationId={activeConv} />
        <AIAssistantPanel />
      </div>
    </WorkspaceLayout>
  );
}
