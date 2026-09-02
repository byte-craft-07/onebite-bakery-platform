import React, { useState } from "react";
import { User as UserIcon } from "lucide-react";
import type { UserProfileResponse } from "@/services/auth.service";

export interface UserAvatarProps {
  user?: UserProfileResponse | {
    name?: string;
    email?: string;
    phone?: string;
    profileImage?: string;
  } | null;
  src?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  fallbackName?: string;
}

const sizeClasses: Record<NonNullable<UserAvatarProps["size"]>, {
  container: string;
  icon: string;
  text: string;
}> = {
  xs: { container: "h-6 w-6 text-[10px]", icon: "h-3.5 w-3.5", text: "text-[10px]" },
  sm: { container: "h-8 w-8 text-xs", icon: "h-4 w-4", text: "text-xs font-bold" },
  md: { container: "h-10 w-10 text-sm", icon: "h-5 w-5", text: "text-sm font-bold" },
  lg: { container: "h-12 w-12 text-base", icon: "h-6 w-6", text: "text-base font-extrabold" },
  xl: { container: "h-16 w-16 text-xl", icon: "h-8 w-8", text: "text-2xl font-extrabold" },
  "2xl": { container: "h-20 w-20 text-2xl", icon: "h-10 w-10", text: "text-3xl font-extrabold" },
};

/**
 * Returns a high-quality avatar URL based on email or name
 */
export const getAvatarFromEmailOrName = (name?: string, email?: string): string => {
  const seed = name?.trim() || email?.split("@")[0]?.trim() || "Customer";
  // UI Avatars generator with bakery-themed Deep Sage color (#596B58)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=596B58&color=FFF8EC&bold=true&size=256&rounded=true`;
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  src,
  alt,
  size = "md",
  className = "",
  fallbackName,
}) => {
  const [imageError, setImageError] = useState(false);

  const displayName = user?.name || fallbackName || (user?.email ? user.email.split("@")[0] : "") || "Customer";
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";

  // Determine image source priority:
  // 1. Direct src prop
  // 2. user.profileImage
  // 3. Email/Name generated avatar
  const resolvedSrc = src || user?.profileImage || (user?.email || user?.name ? getAvatarFromEmailOrName(user?.name, user?.email) : null);

  const { container, icon, text } = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-[#596B58] text-[#FFF8EC] select-none shrink-0 ${container} ${className}`}
      title={displayName}
    >
      {resolvedSrc && !imageError ? (
        <img
          src={resolvedSrc}
          alt={alt || displayName}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover rounded-full transition-opacity duration-200"
          loading="lazy"
        />
      ) : initial ? (
        <span className={`font-bold leading-none ${text}`}>
          {initial}
        </span>
      ) : (
        <UserIcon className={`${icon} opacity-90`} />
      )}
    </div>
  );
};
