import React from "react";

import { cn } from "@/utils/cn";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E5DEC9] bg-white p-6 shadow-[0_2px_12px_rgba(59,48,43,0.05)] transition-all hover:shadow-[0_8px_24px_rgba(59,48,43,0.09)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "neutral" | "primary" | "bestseller" | "new" | "premium" | "customizable";
  className?: string;
}> = ({ children, variant = "primary", className }) => {
  const variantStyles = {
    primary: "bg-[#596B58] text-[#FFF8EC] border-[#596B58]",
    bestseller: "bg-[#596B58] text-[#FFF8EC] border-[#596B58]",
    new: "bg-[#A8B89A] text-[#3B302B] border-[#A8B89A]",
    premium: "bg-[#D8BE91] text-[#3B302B] border-[#D8BE91]",
    customizable: "bg-[#FFF8EC] text-[#596B58] border-[#596B58]",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-[#F7F2E7] text-[#3B302B] border-[#E5DEC9]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#E5DEC9]/60",
        className,
      )}
      {...props}
    />
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-[#E5DEC9] max-w-lg w-full p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#E5DEC9] shrink-0">
          {title ? <h3 className="text-lg sm:text-xl font-bold text-[#3B302B]">{title}</h3> : <div />}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#3B302B] text-2xl font-bold p-1 leading-none cursor-pointer rounded-lg hover:bg-gray-100 transition-colors"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 sm:pr-1.5 space-y-4 custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

export const Drawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="bg-white h-full max-w-md w-full p-6 border-l border-[#E5DEC9] shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="flex justify-between items-center mb-6">
          {title ? <h3 className="text-xl font-bold text-[#3B302B]">{title}</h3> : <div />}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#3B302B] text-2xl font-bold"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => {
  return (
    <div className="text-center p-12 border-2 border-dashed border-[#E5DEC9] rounded-2xl bg-[#FFF8EC]">
      <h3 className="text-lg font-bold text-[#3B302B] mb-1">{title}</h3>
      {description ? <p className="text-sm text-[#7A6E65] mb-4">{description}</p> : null}
      {action}
    </div>
  );
};

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = "Failed to load data.", onRetry }) => {
  return (
    <div className="text-center p-8 bg-red-50 border border-red-200 rounded-xl text-red-800">
      <p className="font-semibold mb-3">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      ) : null}
    </div>
  );
};
