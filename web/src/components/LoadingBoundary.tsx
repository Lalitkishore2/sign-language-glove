/**
 * @fileoverview Reusable loading spinner boundary overlay.
 */
import React from "react";

interface LoadingBoundaryProps {
  children?: React.ReactNode;
  isLoading: boolean;
}

export function LoadingBoundary({ children, isLoading }: LoadingBoundaryProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-xl bg-surface-primary rounded-xl border border-outline-variant/30">
        <span className="material-symbols-outlined text-primary text-[32px] animate-spin mb-sm">
          progress_activity
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">Loading workspace...</span>
      </div>
    );
  }

  return <>{children}</>;
}
