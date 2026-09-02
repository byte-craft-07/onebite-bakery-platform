import React, { type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-[#596B58] text-[#FFF8EC] hover:bg-[#495948] focus:ring-[#596B58] shadow-xs",
        secondary: "border border-[#596B58] bg-transparent text-[#596B58] hover:bg-[#A8B89A] hover:text-[#3B302B] hover:border-[#A8B89A] focus:ring-[#596B58]",
        outline: "border border-[#E5DEC9] bg-transparent text-[#3B302B] hover:bg-[#F7F2E7] focus:ring-[#596B58]",
        ghost: "bg-transparent hover:bg-[#A8B89A]/20 text-[#3B302B] focus:ring-[#596B58]",
        champagne: "bg-[#D8BE91] text-[#3B302B] hover:bg-[#CBB081] focus:ring-[#D8BE91] shadow-xs font-semibold",
        danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-[#DC2626]",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-base",
        lg: "h-13 px-7 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant,
  size,
  isLoading,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      ) : null}
      {children}
    </button>
  );
};
