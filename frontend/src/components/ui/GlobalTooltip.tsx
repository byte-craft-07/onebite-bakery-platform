import React, { useEffect, useState } from "react";

interface TooltipState {
  text: string;
  x: number;
  y: number;
  isBelow: boolean;
}

export const GlobalTooltip: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("[data-tooltip], [title], button, a, input, select");
      if (!target) {
        setTooltip(null);
        return;
      }

      const dataTooltip = target.getAttribute("data-tooltip");
      const titleAttr = target.getAttribute("title");
      const ariaLabel = target.getAttribute("aria-label");

      let text = dataTooltip || titleAttr || ariaLabel;

      if (!text && target.tagName === "BUTTON") {
        text = target.textContent?.trim() || "Interactive Button";
      } else if (!text && target.tagName === "A") {
        text = target.textContent?.trim() || "Navigation Link";
      }

      if (text && text.trim() && text.length < 80) {
        const rect = target.getBoundingClientRect();
        // If element is near top edge (< 60px), show tooltip below element
        const isBelow = rect.top < 60;
        const x = Math.max(20, Math.min(window.innerWidth - 20, rect.left + rect.width / 2));
        const y = isBelow ? Math.min(window.innerHeight - 30, rect.bottom + 8) : Math.max(10, rect.top - 8);

        setTooltip({
          text: text.trim(),
          x,
          y,
          isBelow,
        });
      }
    };

    const handleMouseOut = () => {
      setTooltip(null);
    };

    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  if (!tooltip) return null;

  return (
    <div
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform: tooltip.isBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
      }}
      className="fixed z-[99999] pointer-events-none px-3 py-1.5 bg-[#2C1E16] text-[#FFFBF5] text-xs font-semibold rounded-xl shadow-2xl border border-[#E67E22]/60 animate-in fade-in zoom-in-95"
    >
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-[#E67E22] animate-ping" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#E67E22] -ml-3" />
        <span>{tooltip.text}</span>
      </div>
    </div>
  );
};
