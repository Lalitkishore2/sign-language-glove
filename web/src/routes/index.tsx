/**
 * @fileoverview Application router configuration.
 * Workspace routes are lazy-loaded for optimal code-splitting.
 * Each route is wrapped in Suspense with a branded loading fallback.
 */
import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

/* ── Lazy page imports ────────────────────────────────────────────────────── */
const LandingPage = lazy(() =>
  import("@/features/landing/LandingPage").then((m) => ({ default: m.LandingPage }))
);
const TranslatePage = lazy(() =>
  import("@/features/translate/TranslatePage").then((m) => ({ default: m.TranslatePage }))
);
const DatasetPage = lazy(() =>
  import("@/features/translate/DatasetPage").then((m) => ({ default: m.DatasetPage }))
);
const SettingsPage = lazy(() =>
  import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const GlovePage = lazy(() =>
  import("@/features/device/GlovePage").then((m) => ({ default: m.GlovePage }))
);

/* ── Route-level loading fallback ─────────────────────────────────────────── */
function PageLoader() {
  return (
    <div
      className="flex items-center justify-center w-full h-screen bg-bg-base"
      role="status"
      aria-label="Loading page"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-md">
        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center animate-pulse">
          <span
            className="material-symbols-outlined text-on-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            view_in_ar
          </span>
        </div>
        <p className="font-label-sm text-label-sm text-on-surface-variant">Loading…</p>
      </div>
    </div>
  );
}

/* ── Suspense wrapper helper ──────────────────────────────────────────────── */
function withSuspense(Component: React.ComponentType): React.ReactElement {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

/* ── Router definition ────────────────────────────────────────────────────── */
export const AppRouter = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(LandingPage),
  },
  {
    path: "/translate",
    element: withSuspense(TranslatePage),
  },
  {
    path: "/glove",
    element: withSuspense(GlovePage),
  },
  {
    path: "/dataset",
    element: withSuspense(DatasetPage),
  },
  {
    path: "/settings",
    element: withSuspense(SettingsPage),
  },
]);
