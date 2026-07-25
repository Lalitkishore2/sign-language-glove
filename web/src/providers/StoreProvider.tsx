/**
 * @fileoverview Optional context wrapper to manage Zustand store state initialization / hydration.
 */
import React from "react";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Can be used to inject static server state, initialize indexdb hydration etc.
  return <>{children}</>;
}
