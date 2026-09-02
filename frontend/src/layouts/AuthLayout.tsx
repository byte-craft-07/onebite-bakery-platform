import React from "react";
import { Outlet } from "react-router-dom";

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#18181b] p-4 sm:p-6">
      <div className="w-full max-w-[440px]">
        <Outlet />
      </div>
    </div>
  );
};

export const MinimalLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#18181b]">
      <Outlet />
    </div>
  );
};
