/**
 * @fileoverview A minimal, unstyled layout wrapper for clean, focused pages (e.g., auth, errors).
 */
import React from "react";

interface BlankLayoutProps {
  children: React.ReactNode;
}

export function BlankLayout({ children }: BlankLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base text-on-surface p-lg">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
