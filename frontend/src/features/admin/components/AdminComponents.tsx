import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { CustomSelect } from "@/components/ui/FormControls";

// AdminCard
export const AdminCard: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`rounded-2xl border border-[#E5DEC9] bg-white p-6 shadow-xs ${className}`}>
    {title ? <h3 className="text-base font-bold text-[#3B302B] mb-3">{title}</h3> : null}
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
  to?: string;
  onClick?: () => void;
}> = ({ title, value, change, isPositive = true, icon, to, onClick }) => {
  const content = (
    <div
      className={`rounded-2xl border border-[#E5DEC9] bg-white p-6 shadow-xs space-y-3 transition-all ${
        to || onClick
          ? "cursor-pointer hover:border-[#596B58] hover:shadow-md active:scale-[0.99] group"
          : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#7A6E65] group-hover:text-[#3B302B] transition-colors">
          {title}
        </span>
        {icon ? (
          <div className="p-2 rounded-xl bg-[#FFF8EC] text-[#596B58] group-hover:bg-[#596B58]/10 group-hover:scale-105 transition-all">
            {icon}
          </div>
        ) : null}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-[#3B302B] group-hover:text-[#596B58] transition-colors">
          {value}
        </span>
        {change ? (
          <span className={`text-xs font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
            {isPositive ? "+" : ""}{change}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block no-underline">{content}</Link>;
  }

  return content;
};

// AdminStatCardSkeleton
export const AdminStatCardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-[#E5DEC9] bg-white p-6 space-y-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-3 bg-[#E5DEC9]/70 rounded-md w-24" />
      <div className="h-8 w-8 rounded-xl bg-[#FFF8EC]" />
    </div>
    <div className="flex items-baseline justify-between pt-1">
      <div className="h-7 bg-[#E5DEC9]/80 rounded-md w-20" />
      <div className="h-3 bg-[#E5DEC9]/60 rounded-md w-16" />
    </div>
  </div>
);

// AdminPageHeader
export const AdminPageHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
}> = ({ title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5DEC9]">
    <div>
      <h1 className="text-2xl font-extrabold text-[#3B302B] tracking-tight">{title}</h1>
      {description ? <p className="text-xs text-[#7A6E65] mt-1">{description}</p> : null}
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
    {title ? <h3 className="text-base font-bold text-[#3B302B]">{title}</h3> : null}
    {children}
  </div>
);

// AdminToolbar
export const AdminToolbar: React.FC<{
  searchPlaceholder?: string;
  onSearchChange?: (val: string) => void;
  filterOptions?: { label: string; value: string }[];
  onFilterChange?: (val: string) => void;
  filterValue?: string;
  actions?: React.ReactNode;
}> = ({ searchPlaceholder = "Search records...", onSearchChange, filterOptions, onFilterChange, filterValue, actions }) => {
  const [selectedFilter, setSelectedFilter] = React.useState(filterValue || (filterOptions?.[0]?.value ?? ""));

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 bg-white border border-[#E5DEC9] rounded-2xl">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto flex-1">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
          />
        </div>

        {filterOptions && filterOptions.length > 0 ? (
          <div className="w-full sm:w-48">
            <CustomSelect
              value={filterValue !== undefined ? filterValue : selectedFilter}
              onChange={(val) => {
                setSelectedFilter(val);
                onFilterChange?.(val);
              }}
              options={filterOptions}
            />
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">{actions}</div> : null}
    </div>
  );
};

// AdminTable
export const AdminTable: React.FC<{
  headers: string[];
  children: React.ReactNode;
}> = ({ headers, children }) => (
  <div className="overflow-x-auto rounded-2xl border border-[#E5DEC9] bg-white shadow-2xs max-w-full">
    <table className="w-full min-w-[600px] text-left text-xs text-[#3B302B]">
      <thead className="bg-[#FFF8EC] border-b border-[#E5DEC9] text-[#7A6E65] uppercase tracking-wider font-bold">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-3.5 whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E5DEC9]">{children}</tbody>
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
            <div className="h-4 bg-[#E5DEC9]/60 rounded-md w-3/4" />
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
  <div className="py-12 text-center space-y-3 border-2 border-dashed border-[#E5DEC9] rounded-2xl bg-white p-6">
    <AlertCircle className="h-8 w-8 text-[#596B58] mx-auto opacity-70" />
    <h4 className="text-sm font-bold text-[#3B302B]">{title}</h4>
    {description ? <p className="text-xs text-[#7A6E65] max-w-sm mx-auto">{description}</p> : null}
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
      <div className="bg-white rounded-2xl border border-[#E5DEC9] p-6 max-w-md w-full space-y-4 shadow-xl animate-in zoom-in-95">
        <h3 className="text-lg font-bold text-[#3B302B]">{title}</h3>
        <p className="text-xs text-[#7A6E65]">{message}</p>
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
