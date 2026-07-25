/**
 * @fileoverview Workspace Sidebar navigation — 72px icon-only rail.
 * Active state is driven by the current route, matching Stitch export exactly.
 */
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/utils";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Translate", path: "/translate", icon: "translate" },
  { label: "Smart Glove", path: "/glove", icon: "sensors" },
  { label: "Dataset", path: "/dataset", icon: "inventory_2" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <nav
      aria-label="Main workspace navigation"
      className="fixed left-0 top-0 h-full w-[72px] bg-surface-secondary border-r border-outline-variant flex flex-col items-center py-lg gap-md z-50"
    >
      {/* Logo */}
      <div className="mb-lg flex flex-col items-center justify-center w-full">
        <Link to="/" aria-label="Kinex Home">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center hover:scale-105 transition-transform">
            <span
              className="material-symbols-outlined text-on-primary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              view_in_ar
            </span>
          </div>
        </Link>
      </div>

      {/* Nav Links */}
      <div className="flex flex-col gap-sm w-full px-sm flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "w-full aspect-square flex flex-col items-center justify-center rounded-xl scale-95 active:scale-90 transition-all group cursor-pointer",
                isActive
                  ? "text-secondary bg-secondary-container/10"
                  : "text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
              )}
            >
              <span
                className="material-symbols-outlined mb-1"
                aria-hidden="true"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span className="font-label-sm text-label-sm truncate w-full text-center px-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Profile Avatar */}
      <div className="pb-sm w-full px-sm">
        <Link
          to="/settings"
          aria-label="Profile and settings"
          className="w-full aspect-square flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant/50 transition-colors rounded-xl cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-surface-elevated border border-outline-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }} aria-hidden="true">
              person
            </span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
