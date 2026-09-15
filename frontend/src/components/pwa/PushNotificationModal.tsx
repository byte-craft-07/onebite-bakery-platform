import React, { useEffect, useState } from "react";
import { Bell, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { PushNotificationService } from "@/services/pushNotification.service";

export const PushNotificationModal: React.FC = () => {
  const { showPushModal, setShowPushModal } = usePWA();
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handlePrompt = () => {
      // If permission is default, show modal
      if (
        PushNotificationService.isSupported() &&
        typeof Notification !== "undefined" &&
        Notification.permission === "default"
      ) {
        setShowPushModal(true);
      }
    };

    window.addEventListener("theonlinebakery_prompt_push_permission", handlePrompt);
    return () => {
      window.removeEventListener("theonlinebakery_prompt_push_permission", handlePrompt);
    };
  }, [setShowPushModal]);

  if (!showPushModal) {
    return null;
  }

  const handleEnable = async () => {
    setSubscribing(true);
    setMessage(null);
    try {
      const result = await PushNotificationService.subscribe();
      if (result.success) {
        setMessage("Notifications enabled! You will receive live order updates.");
        setTimeout(() => {
          setShowPushModal(false);
          setMessage(null);
        }, 2000);
      } else {
        setMessage(result.error || "Permission was not granted.");
      }
    } catch {
      setMessage("Failed to enable notifications. You can try again later.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={() => setShowPushModal(false)}
    >
      <div
        className="bg-[#FFF8EC] border border-[#E5DEC9] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowPushModal(false)}
            className="p-1.5 text-[#7A6E65] hover:text-[#3B302B] rounded-xl hover:bg-[#E5DEC9]/40 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-16 w-16 mx-auto rounded-full bg-[#596B58]/10 text-[#596B58] flex items-center justify-center">
          <Bell className="h-8 w-8 text-[#596B58] animate-bounce" />
        </div>

        <div className="space-y-1.5">
          <h3 id="push-modal-title" className="text-lg font-extrabold text-[#3B302B]">
            Get Real-Time Order Updates
          </h3>
          <p className="text-xs text-[#7A6E65] max-w-sm mx-auto leading-relaxed">
            Get instant alerts when your cake is baking, ready for dispatch, and out for delivery right on your device.
            <span className="block text-[11px] text-[#596B58] font-medium mt-1">
              (ऑर्डर कन्फर्मेशन, बेकिंग और डिलीवरी का लाइव अपडेट सीधे फोन पर पाएं)
            </span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#E5DEC9] text-left space-y-2 text-xs text-[#3B302B]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#596B58] shrink-0" />
            <span>Order confirmation & baking progress</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#596B58] shrink-0" />
            <span>Delivery rider assignment & live ETA updates</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#596B58] shrink-0" />
            <span>100% spam-free. Only critical order & account alerts</span>
          </div>
        </div>

        {message && (
          <div className="text-xs font-semibold p-2.5 rounded-xl bg-[#596B58]/10 text-[#596B58]">
            {message}
          </div>
        )}

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleEnable}
            disabled={subscribing}
            className="w-full bg-[#596B58] hover:bg-[#465545] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all active:scale-[0.99] cursor-pointer"
          >
            {subscribing ? "Setting up notifications..." : "Allow Notifications / सूचनाएं चालू करें"}
          </button>
          <button
            type="button"
            onClick={() => setShowPushModal(false)}
            className="w-full bg-transparent hover:bg-[#E5DEC9]/30 text-[#7A6E65] font-semibold text-xs py-2 rounded-xl transition-colors cursor-pointer"
          >
            Not Now / बाद में
          </button>
        </div>
      </div>
    </div>
  );
};
