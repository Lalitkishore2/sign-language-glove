/**
 * @fileoverview Layout for marketing, onboarding, or informational pages.
 * Implements a transparent blurred navigation header and footer.
 */
import React from "react";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Marketing Sticky Header */}
      <header className="fixed top-0 w-full z-50 glass-panel border-b-0 h-16 flex items-center justify-between px-lg md:px-2xl transition-all duration-300">
        <div className="flex items-center gap-sm cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
              cards
            </span>
          </div>
          <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">Kinex</span>
        </div>
        <nav className="hidden md:flex items-center gap-lg">
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Platform</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Solutions</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Enterprise</a>
        </nav>
        <div className="flex items-center gap-md">
          <button className="hidden md:block font-label-md text-label-md text-on-surface hover:text-primary transition-colors">Log In</button>
          <button className="bg-primary text-on-primary font-label-md text-label-md px-md py-sm rounded-lg hover:bg-primary-fixed transition-colors shadow-[0_0_15px_rgba(192,193,255,0.2)]">Get Started</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 pt-3xl">
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="bg-surface-primary border-t border-outline-variant py-xl px-lg md:px-margin mt-3xl">
        <div className="max-w-max-width mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-sm">
            <div className="w-6 h-6 rounded-md bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                cards
              </span>
            </div>
            <span className="font-label-md text-label-md text-on-surface">Kinex AI</span>
          </div>
          <div className="flex gap-lg">
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Contact</a>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant/50">© 2024 Kinex. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
