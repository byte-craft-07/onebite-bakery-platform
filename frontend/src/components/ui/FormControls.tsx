import React, { useEffect, useRef, useState, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Check, ChevronDown } from "lucide-react";

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
          <label htmlFor={inputId} className="block text-sm font-semibold text-[#2C1E16]">
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full h-11 px-4 rounded-xl border border-[#E8E2D9] bg-white text-[#2C1E16] placeholder:text-[#9C8C7E] focus:outline-none focus:ring-2 focus:ring-[#E67E22]/50 focus:border-[#E67E22] shadow-2xs transition-all disabled:opacity-50",
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

export interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  className?: string;
  error?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  className,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative w-full space-y-1">
      {label ? <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]">{label}</label> : null}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 px-3.5 rounded-xl border border-[#E8E2D9] bg-white text-[#2C1E16] text-xs font-semibold flex items-center justify-between shadow-2xs transition-all cursor-pointer hover:border-[#E67E22]",
          isOpen && "border-[#E67E22] ring-2 ring-[#E67E22]/30",
          error && "border-red-500",
          className
        )}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={cn("h-4 w-4 text-[#E67E22] shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen ? (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-2xl border border-[#E8E2D9] bg-white shadow-xl py-1.5 overflow-hidden animate-in fade-in zoom-in-95">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer",
                  isSelected
                    ? "bg-[#FFF3E6] text-[#E67E22]"
                    : "text-[#2C1E16] hover:bg-[#FFFBF5] hover:text-[#E67E22]"
                )}
              >
                <span>{opt.label}</span>
                {isSelected ? <Check className="h-3.5 w-3.5 text-[#E67E22]" /> : null}
              </button>
            );
          })}
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
          <label htmlFor={selectId} className="block text-sm font-semibold text-[#2C1E16]">
            {label}
          </label>
        ) : null}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "w-full h-11 px-4 rounded-xl border border-[#E8E2D9] bg-white text-[#2C1E16] font-medium outline-none focus:ring-2 focus:ring-[#E67E22]/50 focus:border-[#E67E22] shadow-2xs transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg_xmlns=%27http://www.w3.org/2000/svg%27_viewBox=%270_0_24_24%27_fill=%27none%27_stroke=%27%23E67E22%27_stroke-width=%272.5%27_stroke-linecap=%27round%27_stroke-linejoin=%27round%27%3e%3cpolyline_points=%276_9_12_15_18_9%27/%3e%3c/svg%3e')] bg-[length:1.1rem] bg-[right_0.85rem_center] bg-no-repeat pr-10",
            error && "border-red-500 focus:ring-red-500",
            className,
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="p-3 bg-white text-[#2C1E16] font-medium">
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
          <label htmlFor={textareaId} className="block text-sm font-semibold text-[#2C1E16]">
            {label}
          </label>
        ) : null}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "w-full p-4 rounded-xl border border-[#E8E2D9] bg-white text-[#2C1E16] placeholder:text-[#9C8C7E] focus:outline-none focus:ring-2 focus:ring-[#E67E22]/50 focus:border-[#E67E22] shadow-2xs transition-all disabled:opacity-50 min-h-[100px]",
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
