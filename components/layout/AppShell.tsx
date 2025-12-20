"use client";

import React, { ReactNode } from "react";
import Header from "../ui/common/Header";

const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen retro-bg pb-10">
      <Header />

      <div className="max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 retro-grid pt-8 md:pt-12">
        {children}
      </div>

      <footer className="mt-10 border-t-2 border-border bg-white/85 dark:bg-card/85 backdrop-blur retro-panel">
        <div className="max-w-[1200px] mx-auto px-4 py-6 text-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="retro-chip text-xs uppercase tracking-wide">Lumera Lend</span>
            <span className="text-muted-foreground">Stake and manage LUME with confidence.</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>Docs</span>
            <span className="opacity-60">·</span>
            <span>Support</span>
            <span className="opacity-60">·</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
