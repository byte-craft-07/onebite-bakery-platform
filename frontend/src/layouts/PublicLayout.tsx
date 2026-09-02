import React from "react";
import { Outlet } from "react-router-dom";

import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { GlobalTooltip } from "@/components/ui/GlobalTooltip";

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8EC] text-[#3B302B]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-28 lg:pb-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
