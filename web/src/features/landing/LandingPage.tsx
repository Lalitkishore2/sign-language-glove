/**
 * @fileoverview Kinex Landing Experience — complete 13-section marketing page.
 * Implements: Navigation · Hero · Product Preview · Communication Story
 * · AI Features · Knowledge Preview · Learning Preview · Device Preview
 * · Technology · Accessibility · Future Vision · CTA · Footer
 */
import React, { useEffect, useRef, useState, memo } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Play,
  Cpu,
  Globe,
  Layers,
  Activity,
  Volume2,
  Keyboard,
  Eye,
  Bluetooth,
  Flame,
  Award,
  BookOpen,
  CheckCircle,
  AlertCircle,
  WifiOff,
  Github,
  ExternalLink,
} from "lucide-react";

/* ─── Animation Variants ──────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

/* ─── Scroll-triggered section wrapper ────────────────────────────────────── */
interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

const AnimatedSection = memo(function AnimatedSection({
  children,
  className = "",
  id,
  "aria-label": ariaLabel,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
      role="region"
      aria-label={ariaLabel}
    >
      {children}
    </motion.div>
  );
});

/* ─── Feature Card ────────────────────────────────────────────────────────── */
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: "primary" | "secondary" | "tertiary";
}

const FeatureCard = memo(function FeatureCard({
  icon,
  title,
  description,
  accent = "primary",
}: FeatureCardProps) {
  const accentClass =
    accent === "secondary"
      ? "text-secondary"
      : accent === "tertiary"
        ? "text-tertiary"
        : "text-primary";

  return (
    <motion.div
      variants={fadeUp}
      className="glass-panel p-lg rounded-2xl flex flex-col gap-sm hover:border-outline-variant transition-colors"
    >
      <div className={accentClass} aria-hidden="true">
        {icon}
      </div>
      <h4 className="font-title-lg text-title-lg text-on-surface">{title}</h4>
      <p className="font-body-sm text-body-sm text-on-surface-variant">{description}</p>
    </motion.div>
  );
});

/* ─── Accessibility Card ──────────────────────────────────────────────────── */
interface AccessibilityCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
}

const AccessibilityCard = memo(function AccessibilityCard({
  icon,
  title,
  description,
  color = "text-primary",
}: AccessibilityCardProps) {
  return (
    <div className="bg-surface-secondary p-md rounded-xl border border-outline-variant/30 flex gap-sm">
      <div className={`shrink-0 mt-0.5 ${color}`} aria-hidden="true">
        {icon}
      </div>
      <div>
        <h5 className="font-label-md text-label-md text-on-surface mb-xs">{title}</h5>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
});

/* ─── Roadmap data ────────────────────────────────────────────────────────── */
const roadmap = [
  {
    phase: "Phase 1",
    title: "AI Desktop Workspace",
    status: "Live Now",
    statusColor: "text-success bg-success/10 border-success/30",
    description:
      "Real-time hand landmark tracking, contextual sentence building, and voice output via the browser workspace.",
  },
  {
    phase: "Phase 2",
    title: "Mobile Ecosystem",
    status: "In Development",
    statusColor: "text-primary bg-primary/10 border-primary/30",
    description:
      "Portable translation for face-to-face conversations. Fully offline-capable mobile companion app.",
  },
  {
    phase: "Phase 3",
    title: "Smart Haptic Gloves",
    status: "Hardware Testing",
    statusColor: "text-secondary bg-secondary/10 border-secondary/30",
    description:
      "BLE-connected wearable gloves with flex sensors and IMU. No camera required for gesture detection.",
  },
  {
    phase: "Phase 4",
    title: "Global Deployment",
    status: "Future Vision",
    statusColor: "text-tertiary bg-tertiary/10 border-tertiary/30",
    description:
      "Hospital, school, and enterprise accessibility integrations across 40+ countries and 20+ sign languages.",
  },
];

/* ─── Landing Page ────────────────────────────────────────────────────────── */
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-bg-base text-on-surface">
      {/* ── NAVIGATION ──────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 w-full z-50 h-16 flex items-center justify-between px-lg md:px-2xl transition-all duration-300 ${
          scrolled
            ? "bg-surface-primary/90 backdrop-blur-md border-b border-outline-variant/50"
            : "bg-transparent"
        }`}
        role="banner"
      >
        <Link
          to="/"
          className="flex items-center gap-sm cursor-pointer group"
          aria-label="Kinex home"
        >
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center group-hover:scale-105 transition-transform">
            <span
              className="material-symbols-outlined text-on-primary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              view_in_ar
            </span>
          </div>
          <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">
            Kinex
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-lg" aria-label="Marketing navigation">
          {["Platform", "Technology", "Community", "About"].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-md">
          <button className="hidden md:block font-label-md text-label-md text-on-surface hover:text-primary transition-colors">
            Log In
          </button>
          <Link
            to="/translate"
            className="bg-primary text-on-primary font-label-md text-label-md px-md py-sm rounded-lg hover:bg-primary-fixed transition-colors shadow-[0_0_15px_rgba(192,193,255,0.2)]"
          >
            Launch Workspace
          </Link>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-lg md:px-margin overflow-hidden pt-16"
        aria-label="Hero"
      >
        <div className="glow-effect top-1/4 left-1/4" aria-hidden="true" />
        <div
          className="glow-effect bottom-1/4 right-1/4"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle, rgba(69,218,252,0.1) 0%, rgba(9,11,15,0) 70%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-sm bg-surface-secondary border border-outline-variant rounded-full px-md py-xs mb-lg z-10"
          aria-label="Platform announcement"
        >
          <span className="w-2 h-2 rounded-full bg-secondary pulse-border" aria-hidden="true" />
          <span className="font-label-sm text-label-sm text-secondary">
            Kinex Core AI 2.0 — Now Live
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display-xl text-display-xl text-on-surface max-w-4xl tracking-tight mb-md z-10"
        >
          Breaking Communication Barriers{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Through AI
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-body-default text-body-default text-on-surface-variant max-w-2xl mb-xl z-10"
        >
          The world's most advanced sign language interpretation platform. Real-time, highly
          accurate, and designed for seamless human connection.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-md z-10 mb-3xl"
        >
          <Link
            to="/translate"
            className="w-full sm:w-auto bg-primary text-on-primary font-label-md text-label-md px-xl py-md rounded-xl hover:bg-primary-fixed transition-all shadow-[0_0_20px_rgba(192,193,255,0.3)] flex items-center justify-center gap-xs"
          >
            Start Translating <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <button className="w-full sm:w-auto bg-transparent border border-outline-variant text-on-surface font-label-md text-label-md px-xl py-md rounded-xl hover:bg-surface-secondary transition-colors flex items-center justify-center gap-sm">
            <Play size={16} className="text-primary" aria-hidden="true" /> View Demo
          </button>
        </motion.div>

        {/* Product Preview Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative w-full max-w-5xl mx-auto z-20 rounded-2xl p-sm bg-surface-secondary border border-outline-variant shadow-2xl overflow-hidden float-animation"
          aria-label="Interactive product preview"
        >
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-base/80 z-10 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="w-full aspect-video md:aspect-[21/9] bg-cover bg-center rounded-xl relative overflow-hidden flex items-end justify-center pb-xl"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDQJP9c7uH2EblDuw_FNbRTDpfaj-xeaZvipjFRPK4qLgK8FzetqCkeZGk287fwKDPWd25uV9Spbf_pzQ9Hc4_E7LVUQwNcSQ2AE_tVJdFaJRh9pmYJ2XDF8k7Kf3to7IMPn4e5wmmFNBtPoIUVXE0Vo5e30DYNQECfupwHLCBh4FcEtBc2s6OH5573c-nJHwLbEHSYku17tPr6WPUmi_wJu0DcdRMbQr1zzWwfFBOSByRLMCcd1XEA8w')",
            }}
            role="img"
            aria-label="Kinex AI translation workspace demo"
          >
            <div className="relative z-20 w-[90%] md:w-2/3 glass-panel rounded-xl p-md flex items-center justify-between border-t border-white/10 shadow-lg">
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center">
                  <Activity className="text-primary" size={24} aria-hidden="true" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Live Translation
                  </span>
                  <span className="font-title-lg text-title-lg text-on-surface">
                    "Hello, how can I help you today?"
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-sm">
                <button
                  aria-label="Toggle audio"
                  className="w-10 h-10 rounded-full bg-surface-elevated hover:bg-surface-variant flex items-center justify-center transition-colors border border-outline-variant"
                >
                  <Volume2 size={18} className="text-on-surface" aria-hidden="true" />
                </button>
                <div
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shadow-[0_0_10px_rgba(69,218,252,0.5)]"
                  aria-hidden="true"
                >
                  <Activity size={18} className="text-on-secondary" />
                </div>
              </div>
            </div>
            {/* Hand tracking rings */}
            <div
              className="absolute top-1/4 left-1/3 w-36 h-36 border border-secondary/30 rounded-full flex items-center justify-center pointer-events-none"
              aria-hidden="true"
            >
              <div className="w-28 h-28 border border-secondary/50 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-16 h-16 border border-secondary rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── COMMUNICATION STORY ─────────────────────────────────────────── */}
      <AnimatedSection
        className="py-3xl px-lg md:px-margin max-w-[1440px] mx-auto"
        aria-label="The communication barrier challenge"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2xl items-center">
          <motion.div variants={fadeUp} className="flex flex-col gap-md">
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
              The Challenge
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Bridging the Unspoken Divide
            </h2>
            <p className="font-body-default text-body-default text-on-surface-variant leading-relaxed">
              For millions of deaf and hard-of-hearing individuals, daily communication relies on
              sign language — a visual, spatial language with its own grammar, dialects, and
              expressive nuance. Traditional translation systems treat it like isolated gesture
              matching, losing all context.
            </p>
            <p className="font-body-default text-body-default text-on-surface-variant leading-relaxed">
              Kinex changes this. An integrated AI communication layer that empowers both sides of
              every conversation to communicate natively, contextually, and confidently.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="glass-panel p-lg rounded-2xl border border-outline-variant flex flex-col gap-md"
          >
            <div className="flex gap-md">
              <div className="w-10 h-10 rounded-lg bg-error-container/20 flex items-center justify-center text-error shrink-0">
                <AlertCircle size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-title-lg text-title-lg text-on-surface mb-xs">
                  Traditional Limits
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Rigid, isolated gesture classifiers that miss regional dialects, emotional
                  expression, and conversational context.
                </p>
              </div>
            </div>
            <div className="h-px bg-outline-variant/30" aria-hidden="true" />
            <div className="flex gap-md">
              <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                <CheckCircle size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-title-lg text-title-lg text-on-surface mb-xs">
                  The Kinex Approach
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Real-time hand landmark tracking, AI grammar refinement, contextual word
                  prediction, and full sentence synthesis — in one workspace.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ── AI FEATURES BENTO ──────────────────────────────────────────── */}
      <AnimatedSection
        id="platform"
        className="py-3xl px-lg md:px-margin max-w-[1440px] mx-auto"
        aria-label="AI platform features"
      >
        <motion.div variants={fadeUp} className="text-center mb-2xl">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
            Engineered for Precision
          </h2>
          <p className="font-body-default text-body-default text-on-surface-variant max-w-2xl mx-auto">
            Proprietary neural networks process complex spatial movements in under 200ms.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <motion.div
            variants={fadeUp}
            className="md:col-span-2 bg-surface-primary rounded-2xl border border-outline-variant p-lg flex flex-col justify-between overflow-hidden relative group hover:border-primary/50 transition-colors"
          >
            <div className="relative z-10 mb-xl">
              <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center mb-md">
                <Globe className="text-primary" size={20} aria-hidden="true" />
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface mb-xs">
                Contextual Fluency
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
                Kinex understands regional dialects, facial expressions, and conversational context
                to deliver accurate, grammatically refined sentences.
              </p>
            </div>
            <div
              className="h-48 w-full bg-cover bg-center rounded-xl opacity-80 group-hover:opacity-100 transition-opacity"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDliR_GMLsUG-uQCooIIiA5bSTJNsCWOU44znpRHxclcUChSSINtFRWRlqlCYBGDjlMuRScknhXj8qLJRju1PtfKW2h1bDM38_vwBdUOruGP_EhgEXXFvY2mRWfz23MOAHBimk5RIaaY3JACKHfuPBcHHzmHDauMCNxKb-HQca8ISYyJe6bFwXpDCk98QeuI5k0WIGj4SuXF6XqkJfBl5rY5LBcy2q1SaMb4nbl4feFq69ktEW-UTIY3A')",
              }}
              role="img"
              aria-label="Neural network AI visualization"
            >
              <div className="h-full bg-gradient-to-t from-surface-primary to-transparent rounded-xl" />
            </div>
          </motion.div>

          <div className="flex flex-col gap-md">
            <motion.div
              variants={fadeUp}
              className="bg-surface-primary rounded-2xl border border-outline-variant p-lg flex flex-col justify-between hover:border-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center mb-md">
                <Cpu className="text-secondary" size={20} aria-hidden="true" />
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface mb-xs">
                Ultra-Low Latency
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Edge processing ensures translation happens in under 200ms — natural
                conversational pace.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="bg-surface-primary rounded-2xl border border-outline-variant p-lg flex flex-col justify-between hover:border-tertiary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center mb-md">
                <Layers className="text-tertiary" size={20} aria-hidden="true" />
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface mb-xs">
                Platform Agnostic
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Works with existing video conferencing tools and dedicated Kinex smart glove
                hardware.
              </p>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── WORKSPACE PREVIEWS ──────────────────────────────────────────── */}
      <AnimatedSection
        className="py-3xl px-lg md:px-margin max-w-[1440px] mx-auto border-t border-outline-variant/20"
        aria-label="Workspace previews"
      >
        <motion.div variants={fadeUp} className="text-center mb-2xl">
          <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
            Workspace Previews
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm mt-sm">
            Three Spaces. One Platform.
          </h2>
          <p className="font-body-default text-body-default text-on-surface-variant max-w-2xl mx-auto">
            Beyond translation — explore meanings, build vocabulary, and connect smart devices.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Knowledge Preview */}
          <motion.article
            variants={fadeUp}
            className="bg-surface-secondary rounded-2xl border border-outline-variant p-lg flex flex-col hover:border-primary/40 transition-colors"
            aria-label="AI Knowledge Workspace preview"
          >
            <div className="mb-lg">
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-xs block">
                Explore Workspace
              </span>
              <h3 className="font-title-lg text-title-lg text-on-surface mb-sm">
                AI Knowledge Base
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Look up sign vocabulary, pronunciations, contextual definitions, and visual
                examples — instantly and in context.
              </p>
            </div>
            <div className="mt-auto bg-surface-elevated rounded-xl p-md border border-outline-variant/50">
              <div className="flex items-center justify-between mb-sm">
                <span className="font-label-sm text-label-sm text-secondary">
                  Detected: "Welcome"
                </span>
                <span className="text-[11px] text-on-surface-variant/70">98% Confidence</span>
              </div>
              <div className="font-bold text-primary tracking-tight leading-none mb-sm text-4xl">
                Welcome
              </div>
              <div className="flex flex-wrap gap-xs">
                <span className="px-xs py-[2px] rounded bg-surface-variant text-[11px] text-on-surface-variant">
                  Synonyms: Hello, Greet
                </span>
              </div>
            </div>
          </motion.article>

          {/* Learning Preview */}
          <motion.article
            variants={fadeUp}
            className="bg-surface-secondary rounded-2xl border border-outline-variant p-lg flex flex-col hover:border-secondary/40 transition-colors group"
            aria-label="AI Learning Studio preview"
          >
            <div className="mb-lg">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-xs block">
                Learning Studio
              </span>
              <h3 className="font-title-lg text-title-lg text-on-surface mb-sm">
                AI Learning Studio
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Practice gestures with real-time AI feedback. Build vocabulary, complete daily
                challenges, and track your progress over time.
              </p>
            </div>
            <div className="mt-auto bg-surface-elevated rounded-xl p-md border border-outline-variant/50 transform translate-y-1 group-hover:translate-y-0 transition-transform">
              <div className="flex items-center gap-sm mb-xs">
                <BookOpen size={16} className="text-primary" aria-hidden="true" />
                <span className="font-label-sm text-label-sm text-on-surface">
                  Lesson 4: Expressions
                </span>
              </div>
              <div className="w-full bg-surface-primary rounded-full h-2 mb-sm">
                <div
                  className="bg-primary h-2 rounded-full w-[60%]"
                  role="progressbar"
                  aria-valuenow={60}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant/70">
                <span className="flex items-center gap-xs">
                  <Flame size={12} className="text-secondary" aria-hidden="true" /> 4 Day Streak
                </span>
                <span className="flex items-center gap-xs">
                  <Award size={12} className="text-tertiary" aria-hidden="true" /> 340 XP
                </span>
              </div>
            </div>
          </motion.article>

          {/* Device Hub Preview */}
          <motion.article
            variants={fadeUp}
            className="bg-surface-secondary rounded-2xl border border-outline-variant p-lg flex flex-col hover:border-tertiary/40 transition-colors group"
            aria-label="Device Hub preview"
          >
            <div className="mb-lg">
              <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider mb-xs block">
                Device Hub
              </span>
              <h3 className="font-title-lg text-title-lg text-on-surface mb-sm">
                Wearable Ecosystem
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Connect smart gloves, haptic feedback bands, and external cameras. Manage
                calibration, firmware, and live sensor diagnostics.
              </p>
            </div>
            <div className="mt-auto bg-surface-elevated rounded-xl p-md border border-outline-variant/50 flex flex-col gap-sm transform translate-y-1 group-hover:translate-y-0 transition-transform">
              <div className="flex items-center justify-between p-sm rounded-lg bg-surface-primary border border-outline-variant/30">
                <div className="flex items-center gap-sm">
                  <span
                    className="material-symbols-outlined text-secondary text-[16px]"
                    aria-hidden="true"
                  >
                    videocam
                  </span>
                  <span className="text-[12px] font-medium text-on-surface">
                    Primary Camera (Active)
                  </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-success pulse-border" aria-hidden="true" />
              </div>
              <div className="flex items-center justify-between p-sm rounded-lg bg-surface-primary border border-outline-variant/30 opacity-50">
                <div className="flex items-center gap-sm">
                  <Bluetooth size={14} className="text-on-surface-variant" aria-hidden="true" />
                  <span className="text-[12px] font-medium text-on-surface">
                    Haptic Glove (Offline)
                  </span>
                </div>
              </div>
            </div>
          </motion.article>
        </div>
      </AnimatedSection>

      {/* ── TECHNOLOGY SECTION ──────────────────────────────────────────── */}
      <AnimatedSection
        id="technology"
        className="py-3xl px-lg md:px-margin max-w-[1440px] mx-auto"
        aria-label="Technology stack details"
      >
        <motion.div variants={fadeUp} className="text-center mb-2xl">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
            The Underlying Technology
          </h2>
          <p className="font-body-default text-body-default text-on-surface-variant max-w-2xl mx-auto">
            Combining state-of-the-art computer vision with natural language reasoning.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          <FeatureCard
            icon={<span className="material-symbols-outlined text-[24px]">camera</span>}
            title="Computer Vision"
            description="Edge-based hand landmark tracking using MediaPipe — 21 points per hand at 60fps, running locally in the browser."
            accent="primary"
          />
          <FeatureCard
            icon={<Cpu size={24} />}
            title="Context Reasoning AI"
            description="LLM-powered grammar correction and sentence refinement that understands sign language syntax and structure."
            accent="secondary"
          />
          <FeatureCard
            icon={<Volume2 size={24} />}
            title="Speech Synthesis"
            description="Seamless Text-to-Speech voice output with adjustable speed and volume for accessibility preferences."
            accent="tertiary"
          />
          <FeatureCard
            icon={<Globe size={24} />}
            title="Multi-Language Support"
            description="ASL, BSL, Auslan and 20+ sign languages planned. Regional dialect awareness built into the recognition engine."
            accent="primary"
          />
          <FeatureCard
            icon={<Bluetooth size={24} />}
            title="Wearable Integration"
            description="Web Bluetooth API layer for connecting smart gloves with flex sensors, IMU chips, and haptic feedback motors."
            accent="secondary"
          />
          <FeatureCard
            icon={<Layers size={24} />}
            title="Offline Capability"
            description="Core recognition models run locally in-browser. No internet required for basic translation workflows."
            accent="tertiary"
          />
        </div>
      </AnimatedSection>

      {/* ── ACCESSIBILITY SECTION ────────────────────────────────────────── */}
      <AnimatedSection
        className="py-3xl px-lg md:px-margin max-w-[1440px] mx-auto"
        aria-label="Accessibility commitments"
      >
        <div className="bg-surface-primary/30 rounded-3xl p-2xl border border-outline-variant/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2xl items-center">
            <motion.div variants={fadeUp} className="flex flex-col gap-md">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                Accessibility First
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Designed for Everyone, Built Without Compromise
              </h2>
              <p className="font-body-default text-body-default text-on-surface-variant leading-relaxed">
                Accessibility is the foundation of Kinex. Every interaction, animation, and
                feedback mechanism has been engineered for absolute access.
              </p>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <AccessibilityCard
                icon={<Keyboard size={20} />}
                title="Keyboard Navigation"
                description="Fully navigable with custom shortcut bindings and visible focus indicators."
                color="text-primary"
              />
              <AccessibilityCard
                icon={<Eye size={20} />}
                title="Screen Readers"
                description="ARIA live regions announce AI translation updates and confidence changes immediately."
                color="text-secondary"
              />
              <AccessibilityCard
                icon={<Activity size={20} />}
                title="Reduced Motion"
                description="All ambient animations adapt automatically to OS-level prefers-reduced-motion settings."
                color="text-tertiary"
              />
              <AccessibilityCard
                icon={<WifiOff size={20} />}
                title="Offline Vision"
                description="Vision tracking and gesture recognition continue functioning without a network connection."
                color="text-success"
              />
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── FUTURE VISION ───────────────────────────────────────────────── */}
      <AnimatedSection
        className="py-3xl px-lg md:px-margin max-w-[1440px] mx-auto"
        aria-label="Roadmap and future vision"
      >
        <motion.div variants={fadeUp} className="text-center mb-2xl">
          <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
            Future Vision
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm mt-sm">
            Roadmap to Wearable AI
          </h2>
          <p className="font-body-default text-body-default text-on-surface-variant max-w-2xl mx-auto">
            From a browser-based translation tool to a full wearable hardware operating
            ecosystem.
          </p>
        </motion.div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden md:grid md:grid-cols-4 gap-lg relative">
          <div
            className="absolute top-6 left-[12.5%] right-[12.5%] h-px bg-outline-variant/30"
            aria-hidden="true"
          />
          {roadmap.map((item, idx) => (
            <motion.div
              key={item.phase}
              variants={fadeUp}
              className="flex flex-col items-center text-center gap-sm"
            >
              <div
                className="w-12 h-12 rounded-full bg-surface-secondary border-2 border-outline-variant flex items-center justify-center z-10"
                aria-hidden="true"
              >
                <span className="font-label-sm text-label-sm text-primary">{idx + 1}</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {item.phase}
              </span>
              <h4 className="font-label-md text-label-md text-on-surface font-semibold">
                {item.title}
              </h4>
              <span
                className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.statusColor}`}
              >
                {item.status}
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden relative border-l border-outline-variant/30 ml-4 flex flex-col gap-lg">
          {roadmap.map((item) => (
            <motion.div key={item.phase} variants={fadeUp} className="relative pl-8">
              <div
                className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface-secondary border-2 border-primary flex items-center justify-center"
                aria-hidden="true"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest block mb-xs">
                {item.phase}
              </span>
              <h4 className="font-label-md text-label-md text-on-surface font-semibold mb-xs">
                {item.title}
              </h4>
              <span
                className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-sm ${item.statusColor}`}
              >
                {item.status}
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <AnimatedSection
        className="py-3xl px-lg md:px-margin max-w-[1440px] mx-auto border-t border-outline-variant/20"
        aria-label="Call to action"
      >
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center gap-lg text-center max-w-3xl mx-auto"
        >
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Start Communicating Without Barriers
          </h2>
          <p className="font-body-default text-body-default text-on-surface-variant">
            Join the future of accessible communication. Connect your camera, launch the workspace,
            and start building bridges in every conversation.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-md">
            <Link
              to="/translate"
              className="bg-primary text-on-primary font-label-md text-label-md px-xl py-md rounded-xl hover:bg-primary-fixed transition-all shadow-[0_0_25px_rgba(192,193,255,0.4)] flex items-center gap-xs"
            >
              Launch Workspace <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-sm text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors"
            >
              <Github size={18} aria-hidden="true" /> View on GitHub
            </a>
            <button className="flex items-center gap-sm text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors">
              <ExternalLink size={16} aria-hidden="true" /> Documentation
            </button>
          </div>
        </motion.div>
      </AnimatedSection>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer
        className="bg-surface-primary border-t border-outline-variant py-xl px-lg md:px-margin mt-3xl"
        role="contentinfo"
      >
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-sm">
            <div className="w-6 h-6 rounded-md bg-primary-container flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-primary-container text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                view_in_ar
              </span>
            </div>
            <span className="font-label-md text-label-md text-on-surface">Kinex AI</span>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-lg">
            {["Resources", "Community", "Privacy", "Accessibility", "Contact"].map((label) => (
              <a
                key={label}
                href="#"
                className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          <p className="font-body-sm text-body-sm text-on-surface-variant/50 text-center md:text-right">
            v1.0.0 · © 2025 Kinex AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
