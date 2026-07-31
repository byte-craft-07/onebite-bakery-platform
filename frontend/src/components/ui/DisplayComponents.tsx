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
        "rounded-2xl border border-[#E8E2D9] bg-white p-6 shadow-[0_4px_16px_rgba(44,30,22,0.08)] transition-all hover:shadow-[0_12px_32px_rgba(44,30,22,0.12)]",
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
  variant?: "success" | "warning" | "danger" | "neutral" | "primary";
  className?: string;
}> = ({ children, variant = "primary", className }) => {
  const variantStyles = {
    primary: "bg-[#FFF3E6] text-[#E67E22] border-[#E67E22]/30",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
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
        "animate-pulse rounded-md bg-[#E8E2D9]/60",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E8E2D9] max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          {title ? <h3 className="text-xl font-bold text-[#2C1E16]">{title}</h3> : <div />}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
          >
            &times;
          </button>
        </div>
        {children}
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
      <div className="bg-white h-full max-w-md w-full p-6 border-l border-[#E8E2D9] shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="flex justify-between items-center mb-6">
          {title ? <h3 className="text-xl font-bold text-[#2C1E16]">{title}</h3> : <div />}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
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
    <div className="text-center p-12 border-2 border-dashed border-[#E8E2D9] rounded-2xl bg-[#FFFBF5]">
      <h3 className="text-lg font-bold text-[#2C1E16] mb-1">{title}</h3>
      {description ? <p className="text-sm text-[#6E5D4F] mb-4">{description}</p> : null}
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
          className="px-4 py-2 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      ) : null}
    </div>
  );
};
