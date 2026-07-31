import React, { type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

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
          <label htmlFor={inputId} className="block text-sm font-medium text-[#2C1E16]">
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full h-11 px-4 rounded-lg border border-[#E8E2D9] bg-white text-[#2C1E16] placeholder:text-[#9C8C7E] focus:outline-none focus:ring-2 focus:ring-[#E67E22] focus:border-transparent transition-colors disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            className,
          )}
          {...props}
        />
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>
    );
  },
);
Input.displayName = "Input";

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
          <label htmlFor={textareaId} className="block text-sm font-medium text-[#2C1E16]">
            {label}
          </label>
        ) : null}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "w-full p-4 rounded-lg border border-[#E8E2D9] bg-white text-[#2C1E16] placeholder:text-[#9C8C7E] focus:outline-none focus:ring-2 focus:ring-[#E67E22] focus:border-transparent transition-colors disabled:opacity-50 min-h-[100px]",
            error && "border-red-500 focus:ring-red-500",
            className,
          )}
          {...props}
        />
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
