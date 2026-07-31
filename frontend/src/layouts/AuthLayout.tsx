import React from "react";
import { Outlet } from "react-router-dom";

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5] p-6">
      <div className="w-full max-w-md bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#E67E22]">OneBite Bakery</h1>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export const MinimalLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Outlet />
    </div>
  );
};
