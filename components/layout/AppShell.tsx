"use client";

import React, { ReactNode } from "react";
import Header from "../ui/common/Header";

const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen retro-bg pb-10">
      <Header />

      <div className="max-w-[1100px] mx-auto p-4 md:p-6 lg:p-8 retro-grid pt-8 md:pt-12">
        {children}
      </div>
    </div>
  );
};

export default AppShell;
