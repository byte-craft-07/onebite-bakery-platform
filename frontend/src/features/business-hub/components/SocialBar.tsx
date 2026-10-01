import React from "react";
import { MessageCircle } from "lucide-react";

import { businessHubService, type BusinessHubSocial } from "@/services/businessHub.service";
import { InstagramIcon, FacebookIcon, YoutubeIcon } from "./SocialIcons";

interface SocialBarProps {
  social?: BusinessHubSocial;
  whatsappNumber?: string;
  businessName: string;
}

export const SocialBar: React.FC<SocialBarProps> = ({
  social = {},
  whatsappNumber,
  businessName,
}) => {
  const platforms: Array<{
    name: string;
    url?: string;
    icon: React.ReactNode;
    colorClass: string;
    eventType: "instagram" | "whatsapp" | "share";
  }> = [
    {
      name: "Instagram",
      url: social.instagram,
      icon: <InstagramIcon className="w-5 h-5" />,
      colorClass: "hover:bg-[#E1306C] hover:text-white",
      eventType: "instagram",
    },
    {
      name: "Facebook",
      url: social.facebook,
      icon: <FacebookIcon className="w-5 h-5" />,
      colorClass: "hover:bg-[#1877F2] hover:text-white",
      eventType: "share",
    },
    {
      name: "YouTube",
      url: social.youtube,
      icon: <YoutubeIcon className="w-5 h-5" />,
      colorClass: "hover:bg-[#FF0000] hover:text-white",
      eventType: "share",
    },
    {
      name: "WhatsApp",
      url:
        social.whatsapp ||
        (whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}` : undefined),
      icon: <MessageCircle className="w-5 h-5" />,
      colorClass: "hover:bg-[#25D366] hover:text-white",
      eventType: "whatsapp",
    },
  ];

  const activePlatforms = platforms.filter((p) => Boolean(p.url));

  if (activePlatforms.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-2" aria-label="Social Profiles">
      {activePlatforms.map((p) => (
        <a
          key={p.name}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => businessHubService.trackEvent(p.eventType)}
          aria-label={`${businessName} on ${p.name}`}
          className={`w-11 h-11 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 ${p.colorClass}`}
        >
          {p.icon}
        </a>
      ))}
    </div>
  );
};
