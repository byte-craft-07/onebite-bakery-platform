import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  Home,
  Loader2,
  Menu,
  Search,
  Send,
  Smartphone,
  Volume2,
  VolumeX,
} from "lucide-react";

import { useAuth } from "@/contexts/auth.context";
import { UserAvatar } from "@/components/common/UserAvatar";
import { adminOperationsService } from "../services/adminOperations.service";
import {
  PushNotificationService,
  type PushPermissionStatus,
} from "@/services/pushNotification.service";
import {
  getSoundSettings,
  playOrderNotificationSound,
  setSoundEnabled,
  setSoundVolume,
} from "@/utils/sound.util";

export const Topbar: React.FC<{ onMenuToggle: () => void }> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false);
  const [isPushMenuOpen, setIsPushMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [soundSettings, setSoundSettings] = useState(getSoundSettings());

  // Push Notification States
  const [pushSupported, setPushSupported] = useState<boolean>(true);
  const [pushPermission, setPushPermission] = useState<PushPermissionStatus>("default");
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [pushLoading, setPushLoading] = useState<boolean>(false);
  const [pushFeedback, setPushFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const fetchNotifications = async () => {
    try {
      const [list, count] = await Promise.all([
        adminOperationsService.getNotifications(),
        adminOperationsService.getUnreadNotificationCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (_err) {
      // Fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);

    const handleRefresh = () => {
      fetchNotifications();
    };

    const handleSoundChange = () => {
      setSoundSettings(getSoundSettings());
    };

    window.addEventListener("theonlinebakery_refresh_notifications", handleRefresh);
    window.addEventListener("theonlinebakery_sound_settings_changed", handleSoundChange);

    // Initialize Web Push status
    const checkPushStatus = async () => {
      const supported = PushNotificationService.isSupported();
      setPushSupported(supported);
      if (!supported) {
        setPushPermission("unsupported");
        return;
      }
      setPushPermission(PushNotificationService.getPermissionState());
      const sub = await PushNotificationService.getActiveSubscription();
      setIsPushSubscribed(!!sub);
    };

    void checkPushStatus();

    return () => {
      clearInterval(interval);
      window.removeEventListener("theonlinebakery_refresh_notifications", handleRefresh);
      window.removeEventListener("theonlinebakery_sound_settings_changed", handleSoundChange);
    };
  }, []);

  const handleTogglePush = async () => {
    setPushLoading(true);
    setPushFeedback(null);
    try {
      if (isPushSubscribed) {
        const res = await PushNotificationService.unsubscribe();
        if (res.success) {
          setIsPushSubscribed(false);
          setPushFeedback({
            type: "info",
            message: "Push notifications disabled on this device.",
          });
        } else {
          setPushFeedback({
            type: "error",
            message: res.error || "Failed to disable push notifications.",
          });
        }
      } else {
        const res = await PushNotificationService.subscribe();
        if (res.success) {
          setIsPushSubscribed(true);
          setPushPermission(PushNotificationService.getPermissionState());
          setPushFeedback({
            type: "success",
            message: "Push alerts enabled for new orders!",
          });
        } else {
          setPushFeedback({
            type: "error",
            message: res.error || "Failed to enable push notifications.",
          });
        }
      }
    } catch (err: any) {
      setPushFeedback({
        type: "error",
        message: err.message || "Push subscription error.",
      });
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestPush = async () => {
    setPushLoading(true);
    setPushFeedback(null);
    try {
      const res = await PushNotificationService.sendTestPush();
      if (res.success) {
        setPushFeedback({
          type: "success",
          message: res.message || "Test push alert dispatched!",
        });
      } else {
        setPushFeedback({
          type: "error",
          message: res.message || "Failed to send test push alert.",
        });
      }
    } catch (err: any) {
      setPushFeedback({
        type: "error",
        message:
          err.response?.data?.message || err.message || "Test push request failed.",
      });
    } finally {
      setPushLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    await adminOperationsService.markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead && notif.id) {
      await adminOperationsService.markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    setIsNotifOpen(false);

    const orderNum = notif.orderNumber || notif.payload?.orderNumber;
    if (orderNum) {
      navigate(`/admin/orders?search=${encodeURIComponent(orderNum)}`);
    }
  };

  const handleToggleSound = () => {
    const nextState = !soundSettings.soundEnabled;
    setSoundEnabled(nextState);
    if (nextState) {
      void playOrderNotificationSound();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#E5DEC9] bg-[#FFF8EC]/90 backdrop-blur-md px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="lg:hidden p-2 text-[#3B302B]" aria-label="Open Navigation Menu">
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Admin Search */}
        <div className="relative hidden md:block w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders, SKU, customer phone..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                navigate(`/admin/orders?search=${encodeURIComponent((e.target as HTMLInputElement).value.trim())}`);
              }
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E5DEC9] text-xs outline-none bg-white focus:border-[#596B58]"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Web Push Notification Control Toggle & Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPushMenuOpen(!isPushMenuOpen)}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              isPushSubscribed
                ? "bg-[#596B58]/10 text-[#596B58] hover:bg-[#596B58]/20"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
            title={
              isPushSubscribed
                ? "Web Push: Active (Receiving alerts when browser closed/minimized)"
                : "Web Push: Inactive (Click to configure push alerts)"
            }
            aria-label="Web push notification settings"
          >
            <Smartphone className="h-4 w-4" />
            <span className="hidden md:inline text-[11px]">
              {isPushSubscribed ? "Push ON" : "Push OFF"}
            </span>
            {isPushSubscribed && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </button>

          {isPushMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E5DEC9] rounded-2xl shadow-xl p-4 space-y-3 text-xs z-50 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-2">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-[#596B58]" />
                  <span className="font-bold text-[#3B302B]">Web Push Alerts</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isPushSubscribed
                      ? "bg-emerald-100 text-emerald-700"
                      : pushPermission === "denied"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {isPushSubscribed
                    ? "Active"
                    : pushPermission === "denied"
                      ? "Denied"
                      : "Inactive"}
                </span>
              </div>

              <p className="text-[11px] text-[#7A6E65] leading-relaxed">
                Receive instant push notifications for new orders on this device even when the browser tab is closed or running in the background.
              </p>

              {pushFeedback && (
                <div
                  className={`p-2 rounded-xl text-[11px] flex items-start gap-1.5 ${
                    pushFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : pushFeedback.type === "error"
                        ? "bg-red-50 text-red-800 border border-red-200"
                        : "bg-blue-50 text-blue-800 border border-blue-200"
                  }`}
                >
                  {pushFeedback.type === "error" ? (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  )}
                  <span>{pushFeedback.message}</span>
                </div>
              )}

              {!pushSupported ? (
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  Web Push is not supported in this browser environment.
                </div>
              ) : pushPermission === "denied" ? (
                <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px]">
                  Notification permissions are blocked in your browser settings. Please enable them to receive alerts.
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={pushLoading}
                    onClick={handleTogglePush}
                    className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isPushSubscribed
                        ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                        : "bg-[#596B58] text-white hover:bg-[#475746] shadow-sm"
                    }`}
                  >
                    {pushLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isPushSubscribed ? (
                      "Turn Off Push Alerts"
                    ) : (
                      "Enable Push Alerts on This Device"
                    )}
                  </button>

                  {isPushSubscribed && (
                    <button
                      type="button"
                      disabled={pushLoading}
                      onClick={handleTestPush}
                      className="w-full py-1.5 px-3 rounded-xl border border-[#E5DEC9] bg-[#FFF8EC] text-[#596B58] font-semibold text-[11px] hover:bg-[#E5DEC9]/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="h-3 w-3" />
                      <span>Send Test Push Notification</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sound Control Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={handleToggleSound}
            onContextMenu={(e) => {
              e.preventDefault();
              setIsSoundMenuOpen(!isSoundMenuOpen);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              soundSettings.soundEnabled
                ? "bg-[#596B58]/10 text-[#596B58] hover:bg-[#596B58]/20"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
            title={soundSettings.soundEnabled ? "Order Sound: Enabled (Click to mute, right-click for volume)" : "Order Sound: Disabled (Click to enable)"}
            aria-label="Order sound toggle"
          >
            {soundSettings.soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            <span className="hidden md:inline text-[11px]">
              {soundSettings.soundEnabled ? "Sound ON" : "Sound OFF"}
            </span>
          </button>

          {isSoundMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5DEC9] rounded-2xl shadow-xl p-3 space-y-2 text-xs z-50">
              <div className="flex items-center justify-between text-[#3B302B] font-bold">
                <span>Sound Volume</span>
                <span>{Math.round(soundSettings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundSettings.volume}
                onChange={(e) => {
                  const vol = parseFloat(e.target.value);
                  setSoundVolume(vol);
                  void playOrderNotificationSound();
                }}
                className="w-full accent-[#596B58] cursor-pointer"
              />
              <button
                type="button"
                onClick={() => void playOrderNotificationSound()}
                className="w-full py-1 text-center text-[11px] font-semibold text-[#596B58] hover:underline"
              >
                Test Sound Chime
              </button>
            </div>
          )}
        </div>

        {/* View Storefront / Home Page Button */}
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF8EC] border border-[#596B58]/30 text-xs font-bold text-[#596B58] hover:bg-[#596B58] hover:text-white transition-all shadow-2xs"
          title="Return to Customer Storefront Home Page"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Storefront Home</span>
        </Link>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-full text-[#3B302B] hover:bg-[#FFF8EC] transition-colors relative cursor-pointer"
            aria-label="System Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#D9A05B] text-white text-[10px] font-black ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>

          {isNotifOpen ? (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2.5rem)] max-w-xs sm:w-80 bg-white border border-[#E5DEC9] rounded-2xl shadow-xl p-4 space-y-3 text-xs animate-in fade-in z-50">
              <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-2">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-[#3B302B]">Order Alerts & Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#596B58]/10 text-[#596B58] font-black text-[10px]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 ? (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#596B58] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span>Mark all read</span>
                  </button>
                ) : null}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => {
                    const isUnread = notif.isRead === false;
                    const orderNum = notif.orderNumber || notif.payload?.orderNumber;
                    const title = notif.subject || notif.payload?.title || notif.title || "Order Notification";
                    const message = notif.payload?.message || notif.recipient;

                    return (
                      <div
                        key={notif.id || idx}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all cursor-pointer ${
                          isUnread
                            ? "bg-[#FFF8EC] border-[#596B58]/40 font-medium hover:border-[#596B58]"
                            : "bg-white border-[#E5DEC9] text-gray-500 hover:bg-[#FFFDF9]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[#3B302B]">
                          <span className="font-bold truncate pr-1">
                            {title}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {notif.createdAt
                              ? new Date(notif.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A6E65] line-clamp-2">
                          {message}
                        </p>
                        {orderNum && (
                          <div className="pt-1 flex items-center justify-between text-[10px] text-[#596B58] font-bold">
                            <span>#{orderNum}</span>
                            <span className="text-gray-400 font-normal">Click to view</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">No notifications</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* User Badge / Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#FFF8EC] transition-colors cursor-pointer"
          >
            <UserAvatar user={user} size="sm" className="shadow-2xs" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#3B302B] leading-none">{user?.name || "Bakery Admin"}</p>
              <p className="text-[10px] text-[#7A6E65] leading-tight mt-0.5 capitalize">{user?.role || "admin"}</p>
            </div>
          </button>

          {isProfileOpen ? (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5DEC9] rounded-2xl shadow-xl p-2 space-y-1 text-xs animate-in fade-in z-50">
              <div className="p-2 border-b border-[#E5DEC9] text-gray-500">
                Logged in as <strong>{user?.phone || user?.email}</strong>
              </div>
              <Link
                to="/"
                className="block w-full text-left p-2 rounded-lg text-[#596B58] hover:bg-[#FFF8EC] font-semibold"
              >
                Go to Home Page
              </Link>
              <button
                onClick={logout}
                className="w-full text-left p-2 rounded-lg text-red-600 hover:bg-red-50 font-semibold cursor-pointer"
              >
                Log Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
