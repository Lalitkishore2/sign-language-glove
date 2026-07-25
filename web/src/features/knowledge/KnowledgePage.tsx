/**
 * @fileoverview AI Knowledge Workspace — Screen 03.
 * Word detail header · AI summary · visual bento · usage examples · AI Guide chat · related concepts.
 */
import React, { useState, useCallback, memo } from "react";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { Search, Volume2, Send } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface WordExample {
  text: string;
  highlight: string;
  level: string;
  levelColor: string;
  borderColor: string;
  note: string;
}

interface ChatMessage {
  from: "ai" | "user";
  text: string;
}

/* ─── Sample word data ────────────────────────────────────────────────────── */
const WORD_DATA = {
  word: "Ephemeral",
  ipa: "/əˈfem(ə)rəl/",
  partOfSpeech: "adjective",
  aiSummary:
    '"Ephemeral" describes something that lasts for a very short time. In sign language, it often relates to signs that represent fleeting emotions, temporary states, or things that vanish quickly. The concept relies on fluid, dissolving hand gestures to convey impermanence.',
  examples: [
    {
      text: "The beauty of a sunset is ephemeral.",
      highlight: "ephemeral",
      level: "Easy",
      levelColor: "text-success bg-success/10 border-success/30",
      borderColor: "border-success",
      note: "Focus on the sign for 'short-lived' applied to natural events.",
    },
    {
      text: "Fame in the digital age is often an ephemeral phenomenon.",
      highlight: "ephemeral",
      level: "Intermediate",
      levelColor: "text-warning bg-warning/10 border-warning/30",
      borderColor: "border-warning",
      note: "Combines abstract concepts of time and social status.",
    },
  ] satisfies WordExample[],
  related: ["Transient", "Fleeting", "Impermanence", "Evanescent"],
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    from: "ai",
    text: 'I noticed you\'re exploring "Ephemeral". Would you like me to break down the sign mechanics?',
  },
  {
    from: "user",
    text: "Yes, specifically how to convey 'fading away' versus 'ending'.",
  },
  {
    from: "ai",
    text: "The distinction lies in the speed and direction of the release.\n• Fading: Slower finger wiggling while pulling hands apart.\n• Ending: Sharp, definitive downward chop.",
  },
];

/* ─── AI Guide Chat ────────────────────────────────────────────────────────── */
const AIChat = memo(function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  const send = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { from: "user", text: trimmed },
      { from: "ai", text: "I'm processing your question about sign language nuances…" },
    ]);
    setInput("");
  }, [input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") send();
    },
    [send]
  );

  return (
    <div
      className="bg-surface-elevated rounded-xl border border-outline-variant/30 flex flex-col h-[400px] shadow-xl overflow-hidden"
      aria-label="AI Guide chat"
    >
      <div className="p-md border-b border-outline-variant/30 bg-surface-elevated/90 backdrop-blur-md flex justify-between items-center shrink-0">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-secondary text-[18px]" aria-hidden="true">bolt</span>
          <span className="font-label-md text-label-md text-on-surface">AI Guide</span>
        </div>
        <button aria-label="More options" className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">more_horiz</span>
        </button>
      </div>

      <div className="flex-1 p-md overflow-y-auto space-y-md" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-sm ${msg.from === "user" ? "flex-row-reverse" : ""}`}>
            {msg.from === "ai" ? (
              <div className="w-6 h-6 rounded-full bg-secondary-container/20 flex items-center justify-center shrink-0" aria-hidden="true">
                <span className="material-symbols-outlined text-[14px] text-secondary">auto_awesome</span>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0" aria-hidden="true">
                <span className="material-symbols-outlined text-[14px] text-primary">person</span>
              </div>
            )}
            <div
              className={`rounded-lg p-sm font-body-sm text-on-surface max-w-[80%] whitespace-pre-wrap ${
                msg.from === "ai"
                  ? "bg-surface-container rounded-tl-none"
                  : "bg-primary-container text-on-primary-container rounded-tr-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-sm border-t border-outline-variant/30 bg-surface-container/50 shrink-0">
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-surface-secondary border border-outline-variant/50 rounded-full py-xs pl-md pr-xl text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none placeholder-on-surface-variant/50"
            placeholder="Ask about nuances, origins, etc…"
            aria-label="Send a message to the AI Guide"
          />
          <button
            onClick={send}
            aria-label="Send message"
            className="absolute right-sm top-1/2 -translate-y-1/2 text-primary hover:text-primary-fixed-dim transition-colors"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
});

/* ─── Usage Example Row ────────────────────────────────────────────────────── */
function ExampleRow({ ex }: { ex: WordExample }) {
  const parts = ex.text.split(ex.highlight);
  return (
    <div
      className={`p-md rounded-lg bg-surface-container hover:bg-surface-variant/50 transition-colors border-l-2 ${ex.borderColor}`}
    >
      <div className="flex justify-between items-start mb-xs">
        <p className="font-body-default text-on-surface">
          "
          {parts.map((part, j) => (
            <React.Fragment key={j}>
              {j > 0 && <strong className="text-primary">{ex.highlight}</strong>}
              {part}
            </React.Fragment>
          ))}
          "
        </p>
        <span
          className={`text-[10px] font-label-sm uppercase tracking-wider px-xs py-[2px] rounded border ml-sm shrink-0 ${ex.levelColor}`}
        >
          {ex.level}
        </span>
      </div>
      <p className="font-body-sm text-on-surface-variant flex items-center gap-xs">
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">visibility</span>
        {ex.note}
      </p>
    </div>
  );
}

/* ─── Knowledge Page ─────────────────────────────────────────────────────── */
export function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("Ephemeral");

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
    []
  );

  return (
    <WorkspaceLayout headerTitle="Explore">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Local search header */}
        <div className="border-b border-outline-variant bg-surface/80 backdrop-blur-md flex justify-between items-center h-14 px-lg z-30 shrink-0">
          <span className="font-headline-lg text-headline-lg text-primary hidden md:block">
            Kinex Workspace
          </span>
          <div className="flex-1 max-w-xl mx-md relative">
            <Search
              size={18}
              className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              aria-hidden="true"
            />
            <input
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-surface-secondary border-none rounded-full py-sm pl-2xl pr-md text-on-surface focus:ring-2 focus:ring-primary font-body-default placeholder:text-on-surface-variant/50 outline-none"
              placeholder="Search concepts, signs, or words…"
              aria-label="Search the knowledge base"
              type="search"
            />
          </div>
          <div className="flex items-center gap-sm">
            <button
              aria-label="Notifications"
              className="text-on-surface-variant hover:text-primary transition-colors p-sm rounded-full hover:bg-surface-variant/30"
            >
              <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-surface-secondary border border-outline-variant flex items-center justify-center" aria-hidden="true">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-xl">
          <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-gutter">
            {/* Left Column (8/12) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-lg">
              {/* Word header card */}
              <div className="bg-surface-secondary rounded-xl p-lg border border-outline-variant/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" aria-hidden="true" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-md">
                  <div>
                    <h1 className="font-display-xl text-display-xl text-on-surface mb-xs">
                      {WORD_DATA.word}
                    </h1>
                    <div className="flex flex-wrap items-center gap-md text-on-surface-variant font-body-default">
                      <span>{WORD_DATA.ipa}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant" aria-hidden="true" />
                      <span className="italic">{WORD_DATA.partOfSpeech}</span>
                      <button
                        aria-label="Pronounce word"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-variant hover:bg-primary/20 text-primary transition-colors"
                      >
                        <Volume2 size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-sm shrink-0">
                    <button className="px-md py-xs rounded-full border border-primary text-primary font-label-md hover:bg-primary/10 transition-colors">
                      Save
                    </button>
                    <button className="px-md py-xs rounded-full bg-primary text-on-primary font-label-md hover:opacity-90 transition-opacity">
                      Practice Sign
                    </button>
                  </div>
                </div>
                {/* AI Summary */}
                <div className="mt-lg relative z-10">
                  <h2 className="font-title-lg text-title-lg text-secondary mb-sm flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">auto_awesome</span>
                    AI Summary
                  </h2>
                  <p className="font-body-default text-on-surface/90 leading-relaxed max-w-3xl">
                    {WORD_DATA.aiSummary}
                  </p>
                </div>
              </div>

              {/* Visual Understanding Bento */}
              <div className="grid grid-cols-2 gap-gutter">
                {[
                  {
                    img: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAaDkaz-mjWOnzOwHE2kjo0zgygEQ5xKoiPn30rMqi64pxtiuiYGw_WCEsUQfweTxzyfa93FD1iD-U3bvGhYvPi9KNBdOBtwyLs-A7sr6r-2zP_MBnpklELyDIGKTmHaSYPX-B-IiUx7Ks6kiiSAnQWfdhX9JPCO8st-3_nK6k8mz2Fxjz390N3kkjbgUW5c-J4rDI-_3d8J8ZneOLC4vZhKwSwNCF82TVPf8y6xepvzuL4epkZXVPwpA')",
                    label: "Hands dissolving into particles — impermanence",
                    title: "Conceptual Metaphor",
                    desc: "Dissolving hands indicate impermanence.",
                  },
                  {
                    img: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAwxUeNA5sAB9pjgL5gtySMnqTHCpr1N7C9UwpA9qRtjR7qbbA9JH68Q1lK_UulmyhZG1vmATh8Tqh0zBwzsu1DugL-KBLUwiqr_7N8f9oiXcrz-e7BCXbOPB3XPtkq8bEfipb0g3C5SRBA2By3-h9qPVnkrYvYBIst-6ke0BRUdeMesJdnIb8V-93GUVEldwrav2UWZoX4pu6f7wzZKvXTFpocomfhvb_wSbLZl7tF1Zz7TjiCcU9FFw')",
                    label: "Sign structure wireframe overlay",
                    title: "Sign Structure",
                    desc: "Fluid outward motion, relaxing fingers.",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="bg-surface-secondary rounded-xl border border-outline-variant/30 overflow-hidden"
                  >
                    <div
                      className="h-48 relative overflow-hidden bg-surface-variant bg-cover bg-center"
                      style={{ backgroundImage: card.img }}
                      role="img"
                      aria-label={card.label}
                    />
                    <div className="p-md">
                      <h3 className="font-label-md text-label-md text-on-surface mb-xs">
                        {card.title}
                      </h3>
                      <p className="font-body-sm text-on-surface-variant">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Usage Examples */}
              <div className="bg-surface-secondary rounded-xl p-lg border border-outline-variant/30">
                <h2 className="font-title-lg text-title-lg text-on-surface mb-md">
                  Usage in Context
                </h2>
                <div className="space-y-sm">
                  {WORD_DATA.examples.map((ex) => (
                    <ExampleRow key={ex.level} ex={ex} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (4/12) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
              <AIChat />
              {/* Related Concepts */}
              <div className="bg-surface-secondary rounded-xl p-md border border-outline-variant/30">
                <h3 className="font-label-md text-label-md text-on-surface-variant mb-sm uppercase tracking-widest">
                  Related Concepts
                </h3>
                <div className="flex flex-wrap gap-sm">
                  {WORD_DATA.related.map((concept) => (
                    <button
                      key={concept}
                      className="px-md py-xs rounded-full bg-surface-container hover:bg-surface-variant transition-colors border border-outline-variant/50 font-body-sm text-on-surface"
                    >
                      {concept}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
