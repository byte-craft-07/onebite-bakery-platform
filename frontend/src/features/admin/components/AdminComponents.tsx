import React from "react";
import { AlertCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/Button";

// AdminCard
export const AdminCard: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`rounded-2xl border border-[#E8E2D9] bg-white p-6 shadow-xs ${className}`}>
    {title ? <h3 className="text-base font-bold text-[#2C1E16] mb-3">{title}</h3> : null}
    {children}
  </div>
);

// AdminStatCard
export const AdminStatCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}> = ({ title, value, change, isPositive = true, icon }) => (
  <AdminCard className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-[#6E5D4F]">{title}</span>
      {icon ? <div className="p-2 rounded-xl bg-[#FFF3E6] text-[#E67E22]">{icon}</div> : null}
    </div>
    <div className="flex items-baseline justify-between">
      <span className="text-2xl font-extrabold text-[#2C1E16]">{value}</span>
      {change ? (
        <span className={`text-xs font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
          {isPositive ? "+" : ""}{change}
        </span>
      ) : null}
    </div>
  </AdminCard>
);

// AdminStatCardSkeleton
export const AdminStatCardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-[#E8E2D9] bg-white p-6 space-y-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-3 bg-[#E8E2D9]/70 rounded-md w-24" />
      <div className="h-8 w-8 rounded-xl bg-[#FFF3E6]" />
    </div>
    <div className="flex items-baseline justify-between pt-1">
      <div className="h-7 bg-[#E8E2D9]/80 rounded-md w-20" />
      <div className="h-3 bg-[#E8E2D9]/60 rounded-md w-16" />
    </div>
  </div>
);

// AdminPageHeader
export const AdminPageHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
}> = ({ title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D9]">
    <div>
      <h1 className="text-2xl font-extrabold text-[#2C1E16] tracking-tight">{title}</h1>
      {description ? <p className="text-xs text-[#6E5D4F] mt-1">{description}</p> : null}
    </div>
    {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
  </div>
);

// AdminSection
export const AdminSection: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = "" }) => (
  <div className={`space-y-4 ${className}`}>
    {title ? <h3 className="text-base font-bold text-[#2C1E16]">{title}</h3> : null}
    {children}
  </div>
);

// AdminToolbar
export const AdminToolbar: React.FC<{
  searchPlaceholder?: string;
  onSearchChange?: (val: string) => void;
  actions?: React.ReactNode;
}> = ({ searchPlaceholder = "Search records...", onSearchChange, actions }) => (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border border-[#E8E2D9] rounded-2xl">
    <div className="relative w-full sm:w-80">
      <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder={searchPlaceholder}
        onChange={(e) => onSearchChange?.(e.target.value)}
        className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E8E2D9] text-xs outline-none focus:border-[#E67E22]"
      />
    </div>
    {actions ? <div className="flex items-center gap-3 w-full sm:w-auto">{actions}</div> : null}
  </div>
);

// AdminTable
export const AdminTable: React.FC<{
  headers: string[];
  children: React.ReactNode;
}> = ({ headers, children }) => (
  <div className="overflow-x-auto rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs max-w-full">
    <table className="w-full min-w-[600px] text-left text-xs text-[#2C1E16]">
      <thead className="bg-[#FFF3E6] border-b border-[#E8E2D9] text-[#6E5D4F] uppercase tracking-wider font-bold">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-3.5 whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E8E2D9]">{children}</tbody>
    </table>
  </div>
);

// AdminTableSkeleton
export const AdminTableSkeleton: React.FC<{ columns: number; rows?: number }> = ({ columns, rows = 4 }) => (
  <>
    {Array.from({ length: rows }).map((_, rIdx) => (
      <tr key={rIdx} className="animate-pulse">
        {Array.from({ length: columns }).map((_, cIdx) => (
          <td key={cIdx} className="px-4 py-4">
            <div className="h-4 bg-[#E8E2D9]/60 rounded-md w-3/4" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// AdminEmptyState
export const AdminEmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="py-12 text-center space-y-3 border-2 border-dashed border-[#E8E2D9] rounded-2xl bg-white p-6">
    <AlertCircle className="h-8 w-8 text-[#E67E22] mx-auto opacity-70" />
    <h4 className="text-sm font-bold text-[#2C1E16]">{title}</h4>
    {description ? <p className="text-xs text-[#6E5D4F] max-w-sm mx-auto">{description}</p> : null}
    {action ? <div className="pt-2">{action}</div> : null}
  </div>
);

// AdminConfirmDialog
export const AdminConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  isDanger?: boolean;
}> = ({ isOpen, title, message, onConfirm, onCancel, confirmLabel = "Confirm", isDanger = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 max-w-md w-full space-y-4 shadow-xl animate-in zoom-in-95">
        <h3 className="text-lg font-bold text-[#2C1E16]">{title}</h3>
        <p className="text-xs text-[#6E5D4F]">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={isDanger ? "danger" : "primary"} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
