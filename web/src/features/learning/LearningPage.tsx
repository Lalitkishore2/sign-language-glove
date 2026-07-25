/**
 * @fileoverview AI Learning Studio — Screen 04.
 * Today's Goal · Continue Learning · AI Coach · Daily Challenges · Accuracy Trend.
 * All progress data is placeholder — no real model or progression backend.
 */
import { memo } from "react";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Lesson {
  icon: string;
  color: string;
  title: string;
  sub: string;
}

interface Challenge {
  label: string;
  done: boolean;
}

interface AccuracyPoint {
  day: string;
  pct: number;
}

/* ─── Sample data ─────────────────────────────────────────────────────────── */
const LESSONS: Lesson[] = [
  { icon: "restaurant", color: "text-secondary", title: "Food & Dining", sub: "Lesson 3 of 5" },
  { icon: "work", color: "text-tertiary", title: "Workplace Basics", sub: "Lesson 1 of 4" },
];

const CHALLENGES: Challenge[] = [
  { label: "Translate 5 phrases", done: true },
  { label: "Achieve 95% accuracy", done: false },
  { label: "Complete Medical Quiz", done: false },
];

const ACCURACY_POINTS: AccuracyPoint[] = [
  { day: "M", pct: 40 },
  { day: "T", pct: 60 },
  { day: "W", pct: 55 },
  { day: "T", pct: 80 },
  { day: "F", pct: 92 },
];

/* ─── Today's Goal Card ────────────────────────────────────────────────────── */
const TodaysGoalCard = memo(function TodaysGoalCard() {
  const progress = 60;
  return (
    <div className="bg-surface-secondary border border-surface-container-high rounded-xl p-lg relative overflow-hidden flex flex-col justify-between min-h-[240px]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-md">
        <div>
          <h2 className="font-title-lg text-title-lg text-on-surface mb-2">Today's Goal</h2>
          <p className="font-body-default text-body-default text-on-surface-variant">
            Mastering Medical Terminology Gestures
          </p>
        </div>
        <div className="bg-primary/20 text-primary px-3 py-1 rounded-full font-label-sm text-label-sm border border-primary/30 shrink-0">
          45 Min Session
        </div>
      </div>
      <div className="relative z-10 mt-8">
        <div className="flex justify-between items-end mb-2">
          <span className="font-label-md text-label-md text-on-surface">Progress</span>
          <span className="font-label-md text-label-md text-primary">{progress}%</span>
        </div>
        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Session progress: ${progress}%`}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <button className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2 rounded-xl hover:bg-primary-fixed transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">play_arrow</span>
            Start Session
          </button>
          <button className="bg-transparent border border-outline-variant text-on-surface font-label-md text-label-md px-6 py-2 rounded-xl hover:bg-surface-container-high transition-colors">
            Review Terms
          </button>
        </div>
      </div>
    </div>
  );
});

/* ─── Continue Learning Card ────────────────────────────────────────────────── */
const ContinueLearningCard = memo(function ContinueLearningCard() {
  return (
    <div className="bg-surface-secondary border border-surface-container-high rounded-xl p-md flex flex-col">
      <h3 className="font-label-md text-label-md text-on-surface-variant mb-4 uppercase tracking-wider">
        Continue Learning
      </h3>
      <ul className="flex flex-col gap-3 flex-1 justify-center" role="list">
        {LESSONS.map((lesson) => (
          <li key={lesson.title} role="listitem">
            <button
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer border border-transparent hover:border-outline-variant text-left w-full"
              aria-label={`Continue ${lesson.title}, ${lesson.sub}`}
            >
              <div
                className={`w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center ${lesson.color}`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">{lesson.icon}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-label-md text-label-md text-on-surface">{lesson.title}</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{lesson.sub}</p>
              </div>
              <span className="material-symbols-outlined text-outline-variant" aria-hidden="true">
                chevron_right
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});

/* ─── AI Coach Card ─────────────────────────────────────────────────────────── */
const AICoachCard = memo(function AICoachCard() {
  return (
    <div className="bg-surface-secondary border border-secondary/30 rounded-xl p-md relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" aria-hidden="true" />
      <h3 className="font-label-md text-label-md text-secondary mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">auto_awesome</span>
        AI Coach
      </h3>
      <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/50 relative z-10">
        <p className="font-body-sm text-body-sm text-on-surface mb-3 leading-relaxed">
          Based on your recent translations, I suggest practicing{" "}
          <strong className="text-secondary font-medium">Temporal Indicators</strong> (past/future
          tense). You struggled slightly in yesterday's conversation.
        </p>
        <button className="text-secondary font-label-md text-label-md hover:text-secondary-fixed transition-colors flex items-center gap-1">
          Practice Now
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
        </button>
      </div>
    </div>
  );
});

/* ─── Daily Challenges Card ─────────────────────────────────────────────────── */
const DailyChallengesCard = memo(function DailyChallengesCard() {
  return (
    <div className="bg-surface-secondary border border-surface-container-high rounded-xl p-md">
      <h3 className="font-label-md text-label-md text-on-surface-variant mb-4 uppercase tracking-wider">
        Daily Challenges
      </h3>
      <ul className="flex flex-col gap-3" role="list" aria-label="Daily challenge checklist">
        {CHALLENGES.map((ch) => (
          <li
            key={ch.label}
            role="listitem"
            className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant/30"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                  ch.done
                    ? "border-success/50 text-success bg-success/10"
                    : "border-outline-variant text-outline-variant"
                }`}
                aria-hidden="true"
              >
                {ch.done && (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                )}
              </div>
              <span
                className={`font-body-sm text-body-sm text-on-surface ${!ch.done ? "opacity-70" : ""}`}
              >
                {ch.label}
              </span>
            </div>
            {ch.done && (
              <span className="sr-only">Completed</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
});

/* ─── Accuracy Trend Card ────────────────────────────────────────────────────── */
const AccuracyTrendCard = memo(function AccuracyTrendCard() {
  return (
    <div className="bg-surface-secondary border border-surface-container-high rounded-xl p-md flex-1 flex flex-col">
      <h3 className="font-label-md text-label-md text-on-surface-variant mb-4 uppercase tracking-wider">
        Accuracy Trend
      </h3>
      <div
        className="flex-1 flex flex-col"
        role="img"
        aria-label="Weekly accuracy bar chart"
      >
        <div className="flex items-end justify-between gap-2 flex-1">
          {ACCURACY_POINTS.map((pt, idx) => (
            <div
              key={`${pt.day}-${idx}`}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="font-label-sm text-label-sm text-on-surface-variant/60 text-[10px]">
                {pt.pct}%
              </span>
              <div
                className="w-full rounded-t-sm transition-all hover:brightness-110 min-h-[4px]"
                style={{
                  height: `${Math.max(pt.pct, 4)}px`,
                  maxHeight: "120px",
                  background: `rgba(192, 193, 255, ${0.3 + idx * 0.15})`,
                }}
                role="presentation"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 border-t border-surface-container-high pt-2">
          {ACCURACY_POINTS.map((pt, idx) => (
            <span
              key={`label-${idx}`}
              className="flex-1 text-center font-label-sm text-label-sm text-on-surface-variant text-[11px]"
            >
              {pt.day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

/* ─── Learning Page ──────────────────────────────────────────────────────────── */
export function LearningPage() {
  return (
    <WorkspaceLayout headerTitle="AI Learning Studio">
      <div className="flex-1 p-md md:p-lg overflow-y-auto">
        <div className="max-w-[1440px] mx-auto">
          <header className="mb-xl">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
              AI Learning Studio
            </h1>
            <p className="font-body-default text-body-default text-on-surface-variant mt-1">
              Your personalized sign language learning path.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-md md:gap-lg">
            {/* Primary Column (left, 8/12) */}
            <div className="col-span-1 md:col-span-8 flex flex-col gap-md md:gap-lg">
              <TodaysGoalCard />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md md:gap-lg">
                <ContinueLearningCard />
                <AICoachCard />
              </div>
            </div>

            {/* Stats Column (right, 4/12) */}
            <div className="col-span-1 md:col-span-4 flex flex-col gap-md md:gap-lg">
              <DailyChallengesCard />
              <AccuracyTrendCard />
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
