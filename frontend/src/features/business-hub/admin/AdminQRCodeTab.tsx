import React, { useEffect, useRef, useState } from "react";
import { QrCode, Download, Copy, Check, ExternalLink, Printer } from "lucide-react";
import { toast } from "@/contexts/toast.context";

interface AdminQRCodeTabProps {
  businessName: string;
  tagline: string;
  publicUrl: string;
}

export const AdminQRCodeTab: React.FC<AdminQRCodeTabProps> = ({
  businessName,
  tagline,
  publicUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState<number>(300);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${publicUrl}`
      : `https://onebitebakery.in${publicUrl}`;

  // Draw QR code onto HTML5 canvas using standard QR API + branding
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";
    // High-resolution QR code image
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize * 2}x${qrSize * 2}&data=${encodeURIComponent(
      fullUrl,
    )}&margin=15&color=3B-30-2B`;

    qrImg.onload = () => {
      canvas.width = qrSize * 2;
      canvas.height = qrSize * 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw white background
      ctx.fillStyle = "#FFFFFF";
      ctx.roundRect
        ? ctx.roundRect(0, 0, canvas.width, canvas.height, 24)
        : ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.fill();

      // Draw QR matrix
      ctx.drawImage(qrImg, 0, 0, canvas.width, canvas.height);

      // Draw center cake emoji / logo badge
      const badgeSize = Math.floor(canvas.width * 0.18);
      const center = canvas.width / 2;
      ctx.fillStyle = "#FFF8EC";
      ctx.beginPath();
      ctx.arc(center, center, badgeSize / 2 + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#3B302B";
      ctx.stroke();

      ctx.font = `${Math.floor(badgeSize * 0.7)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎂", center, center + 2);
    };
  }, [fullUrl, qrSize]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Copied to clipboard!", fullUrl);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed", "Could not copy URL.");
    }
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${businessName.toLowerCase().replace(/\s+/g, "_")}_qr_code.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Downloaded!", "QR Code PNG saved.");
  };

  const handleDownloadSvg = () => {
    // Generate clean SVG download link from QR server
    const svgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=svg&data=${encodeURIComponent(
      fullUrl,
    )}&margin=15&color=3B-30-2B`;
    window.open(svgUrl, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-600" />
            Digital Hub QR Code Studio
          </h3>
          <p className="text-xs text-stone-400">
            Print this QR code on cake boxes, counter stands, flyers, and table tents so customers can scan and immediately access everything.
          </p>
        </div>

        {/* URL Display Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-stone-50 rounded-2xl border border-stone-200">
          <input
            type="text"
            readOnly
            value={fullUrl}
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-stone-700 font-mono focus:outline-hidden select-all"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#3B302B] text-white rounded-xl text-xs font-semibold hover:bg-[#28211D] transition-transform active:scale-95 cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold hover:bg-stone-50 transition-colors"
            >
              <span>Test</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* QR Code Canvas Preview & Card */}
        <div className="flex flex-col items-center justify-center p-8 bg-[#FDFBF7] rounded-3xl border border-[#EFE8DF] space-y-4">
          <div className="text-center space-y-1">
            <h4 className="text-base font-extrabold text-[#3B302B]">
              {businessName}
            </h4>
            <p className="text-xs text-stone-500 max-w-xs">{tagline}</p>
          </div>

          <div className="p-3 bg-white rounded-3xl shadow-md border border-stone-200">
            <canvas
              ref={canvasRef}
              style={{ width: `${qrSize}px`, height: `${qrSize}px` }}
              className="rounded-2xl"
            />
          </div>

          <p className="text-xs font-semibold text-stone-500">
            Scan with any phone camera to open Business Hub
          </p>

          {/* Action Download Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B302B] hover:bg-[#28211D] text-white text-xs font-bold transition-transform active:scale-95 shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download SVG</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Poster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
