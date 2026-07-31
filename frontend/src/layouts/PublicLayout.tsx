import React from "react";
import { Outlet } from "react-router-dom";

import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF5] text-[#2C1E16]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
