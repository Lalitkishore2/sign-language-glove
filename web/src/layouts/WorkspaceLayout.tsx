/**
 * @fileoverview Workspace Layout — shared shell for all /translate, /knowledge, /learning, etc.
 * Contains the fixed 72px Sidebar and sticky top header. Children render in the content area.
 */
import React from "react";
import { Sidebar } from "@/components/organisms/Sidebar";
import { WorkspaceHeader } from "@/components/organisms/WorkspaceHeader";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  /** Optional header title override */
  headerTitle?: string;
  /** Whether content should be full height (no inner scrolling). Default false. */
  fullHeight?: boolean;
}

export function WorkspaceLayout({ children, headerTitle, fullHeight }: WorkspaceLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-base text-on-surface font-body-default">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-[72px] h-full overflow-hidden">
        <WorkspaceHeader title={headerTitle} />

        <main
          className={
            fullHeight
              ? "flex-1 flex flex-col overflow-hidden"
              : "flex-1 overflow-y-auto"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
