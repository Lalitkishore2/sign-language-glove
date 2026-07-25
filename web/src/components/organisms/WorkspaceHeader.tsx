/**
 * @fileoverview Workspace top header bar — sticky, blurred, with title + status + actions.
 * Matches the header pattern from all Stitch workspace exports.
 */
import { Link, useLocation } from "react-router-dom";

const ROUTE_TITLES: Record<string, string> = {
  "/translate": "Translate",
  "/dataset": "Word and Alphabet Dataset",
  "/settings": "Settings",
};

interface WorkspaceHeaderProps {
  /** Override title for dynamic pages */
  title?: string;
}

export function WorkspaceHeader({ title }: WorkspaceHeaderProps) {
  const location = useLocation();
  const pageTitle = title ?? ROUTE_TITLES[location.pathname] ?? "Kinex Workspace";

  return (
    <header className="hidden md:flex justify-between items-center h-16 px-md w-full bg-surface/80 backdrop-blur-xl border-b border-outline-variant shadow-sm z-40" role="banner">
      {/* Left: Branding + Title */}
      <div className="flex items-center gap-md">
        <span className="font-headline-lg text-headline-lg text-primary tracking-tight">
          Kinex Workspace
        </span>
        <span className="h-4 w-px bg-outline-variant" aria-hidden="true" />
        <h1 className="font-title-lg text-title-lg text-on-surface">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-md">
        <button
          aria-label="View notifications"
          className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100 p-sm rounded-full hover:bg-surface-variant/30"
        >
          <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
        </button>
        <Link
          to="/settings"
          aria-label="Go to settings"
          className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100 p-sm rounded-full hover:bg-surface-variant/30"
        >
          <span className="material-symbols-outlined" aria-hidden="true">settings</span>
        </Link>
        <div className="w-8 h-8 rounded-full bg-surface-secondary border border-outline-variant overflow-hidden cursor-pointer ml-sm" aria-hidden="true">
          <div className="w-full h-full bg-surface-elevated flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>
              person
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
