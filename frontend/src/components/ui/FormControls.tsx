import React, { useEffect, useRef, useState, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { cn } from "@/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="w-full space-y-1">
        {label ? (
          <label htmlFor={inputId} className="block text-sm font-semibold text-[#3B302B]">
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full h-11 px-4 rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] placeholder:text-[#7A6E65] focus:outline-none focus:ring-2 focus:ring-[#596B58]/30 focus:border-[#596B58] shadow-2xs transition-all disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            className,
          )}
          {...props}
        />
        {error ? <p className="text-xs text-red-500 font-medium">{error}</p> : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export interface CustomSelectOption {
  label: string;
  value: string;
  hint?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<CustomSelectOption>;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  icon?: React.ReactNode;
  id?: string;
  name?: string;
  required?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  className,
  buttonClassName,
  dropdownClassName,
  error,
  disabled = false,
  searchable,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && (searchable || options.length > 7)) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, searchable, options.length]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const shouldShowSearch = searchable ?? (options.length > 7);

  const filteredOptions = searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.hint && opt.hint.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
    } else if (e.key === "ArrowDown" && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full space-y-1.5", className)} onKeyDown={handleKeyDown}>
      {label ? (
        <label className="block text-xs font-bold text-[#3B302B] tracking-tight">
          {label}
        </label>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) setSearchQuery("");
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "w-full h-11 px-3.5 rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] text-xs font-semibold flex items-center justify-between shadow-2xs transition-all text-left",
          disabled ? "opacity-60 cursor-not-allowed bg-[#FAF7F0] hover:border-[#E5DEC9]" : "cursor-pointer hover:border-[#596B58]",
          isOpen && "border-[#596B58] ring-2 ring-[#596B58]/20 shadow-xs",
          error && "border-red-500",
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2 truncate min-w-0 pr-2">
          {icon ? <span className="text-[#596B58] shrink-0">{icon}</span> : null}
          {selectedOption ? (
            <span className="truncate text-xs font-semibold text-[#3B302B]">
              {selectedOption.label}
            </span>
          ) : (
            <span className="truncate text-xs font-medium text-[#7A6E65]">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#596B58] shrink-0 ml-1.5 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && !disabled ? (
        <div
          className={cn(
            "absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl border border-[#E5DEC9] bg-white shadow-xl py-1.5 max-h-60 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150",
            dropdownClassName
          )}
          role="listbox"
        >
          {shouldShowSearch ? (
            <div className="p-2 border-b border-[#E5DEC9]/60 shrink-0 bg-[#FFFDF9]">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#7A6E65]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white border border-[#E5DEC9] text-[#3B302B] placeholder:text-[#7A6E65] focus:outline-none focus:border-[#596B58] focus:ring-1 focus:ring-[#596B58]/30"
                />
              </div>
            </div>
          ) : null}

          <div className="overflow-y-auto max-h-52 py-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs text-[#7A6E65] italic">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "w-[calc(100%-8px)] mx-1 px-3 py-2 text-left text-xs font-semibold flex items-center justify-between rounded-xl transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#596B58] text-white font-bold shadow-xs"
                        : "text-[#3B302B] hover:bg-[#FFF8EC] hover:text-[#596B58] active:bg-[#F3EAD8]"
                    )}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.hint ? (
                        <span className={cn("text-[10px] mt-0.5", isSelected ? "text-white/80" : "text-[#7A6E65]")}>
                          {opt.hint}
                        </span>
                      ) : null}
                    </div>
                    {isSelected ? (
                      <Check className="h-4 w-4 text-white shrink-0 ml-1.5" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-500 font-medium">{error}</p> : null}
    </div>
  );
};

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ label: string; value: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, children, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="w-full space-y-1">
        {label ? (
          <label htmlFor={selectId} className="block text-sm font-semibold text-[#3B302B]">
            {label}
          </label>
        ) : null}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "w-full h-11 px-4 rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] font-medium outline-none focus:ring-2 focus:ring-[#596B58]/30 focus:border-[#596B58] shadow-2xs transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg_xmlns=%27http://www.w3.org/2000/svg%27_viewBox=%270_0_24_24%27_fill=%27none%27_stroke=%27%23596B58%27_stroke-width=%272.5%27_stroke-linecap=%27round%27_stroke-linejoin=%27round%27%3e%3cpolyline_points=%276_9_12_15_18_9%27/%3e%3c/svg%3e')] bg-[length:1.1rem] bg-[right_0.85rem_center] bg-no-repeat pr-10",
            error && "border-red-500 focus:ring-red-500",
            className,
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="p-3 bg-white text-[#3B302B] font-medium">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? <p className="text-xs text-red-500 font-medium">{error}</p> : null}
      </div>
    );
  },
);
Select.displayName = "Select";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="w-full space-y-1">
        {label ? (
          <label htmlFor={textareaId} className="block text-sm font-semibold text-[#3B302B]">
            {label}
          </label>
        ) : null}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "w-full p-4 rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] placeholder:text-[#7A6E65] focus:outline-none focus:ring-2 focus:ring-[#596B58]/30 focus:border-[#596B58] shadow-2xs transition-all disabled:opacity-50 min-h-[100px]",
            error && "border-red-500 focus:ring-red-500",
            className,
          )}
          {...props}
        />
        {error ? <p className="text-xs text-red-500 font-medium">{error}</p> : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
