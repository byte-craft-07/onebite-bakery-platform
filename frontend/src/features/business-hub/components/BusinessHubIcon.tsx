import React from "react";
import {
  ShoppingBag,
  MessageCircle,
  Phone,
  MapPin,
  Mail,
  Cake,
  Sparkles,
  Heart,
  Gift,
  Star,
  Info,
  Globe,
  Compass,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Clock,
  ChevronRight,
  QrCode,
  Eye,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Layers,
  Settings,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

import { InstagramIcon, FacebookIcon, YoutubeIcon } from "./SocialIcons";

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  MessageCircle,
  Phone,
  MapPin,
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  Youtube: YoutubeIcon,
  Mail,
  Cake,
  Sparkles,
  Heart,
  Gift,
  Star,
  Info,
  Globe,
  Compass,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Clock,
  ChevronRight,
  QrCode,
  Eye,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Layers,
  Settings,
  AlertCircle,
};

interface BusinessHubIconProps {
  name?: string;
  className?: string;
  defaultIcon?: LucideIcon;
}

export const BusinessHubIcon: React.FC<BusinessHubIconProps> = ({
  name = "",
  className = "w-5 h-5",
  defaultIcon: DefaultIcon = Globe,
}) => {
  if (!name) {
    return <DefaultIcon className={className} />;
  }

  // Look up case-insensitive matching
  const matchingKey = Object.keys(ICON_MAP).find(
    (k) => k.toLowerCase() === name.toLowerCase(),
  );

  const IconComponent = matchingKey ? ICON_MAP[matchingKey] : DefaultIcon;
  return <IconComponent className={className} />;
};
