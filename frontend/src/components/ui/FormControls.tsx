import React, { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

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
