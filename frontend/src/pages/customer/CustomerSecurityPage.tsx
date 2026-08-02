import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  KeyRound,
  Laptop,
  LogOut,
  ShieldCheck,
  Smartphone,
  UserCheck,
} from "lucide-react";

import { Badge, Card } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/auth.context";
import { auditLogService, type SecurityEvent, type UserSession } from "@/services/auditLog.service";

export const CustomerSecurityPage: React.FC = () => {
  const { user, logout } = useAuth();

  const [sessions, setSessions] = useState<UserSession[]>(() => auditLogService.getUserSessions());
  const [securityEvents] = useState<SecurityEvent[]>(() => auditLogService.getSecurityEvents());
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleRevokeSession = (id: string) => {
    const updated = auditLogService.revokeSession(id);
    setSessions(updated);
    setStatusMsg("Active device session revoked successfully.");
  };

  const handleRevokeAllOther = () => {
    const updated = auditLogService.revokeAllOtherSessions();
    setSessions(updated);
    setStatusMsg("All other active device sessions logged out.");
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      <Link to="/customer/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6E5D4F] hover:text-[#E67E22]">
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Customer Dashboard</span>
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[#27AE60] font-extrabold text-sm uppercase tracking-wider">
          <ShieldCheck className="h-5 w-5" />
          <span>Account Security Center &bull; 100% Encrypted</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#2C1E16]">Account Security & Connected Devices</h1>
        <p className="text-sm text-[#6E5D4F]">
          Manage your active login sessions, connected Google accounts, and security event logs.
        </p>
      </div>

      {statusMsg ? (
        <div className="p-4 bg-green-50 text-green-800 text-xs font-semibold rounded-2xl border border-green-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#27AE60]" />
          <span>{statusMsg}</span>
        </div>
      ) : null}

      {/* Account Identity Card */}
      <Card className="space-y-6">
        <h3 className="text-lg font-bold text-[#2C1E16]">Primary Authentication Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#FFFBF5] border border-[#E8E2D9] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6E5D4F]">Connected Google Account</span>
              <Badge variant="success">Verified</Badge>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="h-10 w-10 rounded-full bg-[#E67E22]/10 flex items-center justify-center text-[#E67E22] font-bold">
                G
              </div>
              <div>
                <p className="text-sm font-bold text-[#2C1E16]">{user?.email || "customer.google@onebitebakery.in"}</p>
                <p className="text-xs text-gray-400">OAuth 2.0 Identity Services</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFBF5] border border-[#E8E2D9] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6E5D4F]">Mobile Number Verification</span>
              <Badge variant="primary">Active OTP</Badge>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="h-10 w-10 rounded-full bg-[#27AE60]/10 flex items-center justify-center text-[#27AE60]">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#2C1E16]">+91 {user?.phone || "9876543210"}</p>
                <p className="text-xs text-gray-400">1-Step OTP Verification</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Login Sessions */}
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#2C1E16]">Active Device Sessions ({sessions.length})</h3>
            <p className="text-xs text-[#6E5D4F]">Devices currently authenticated to your OneBite account.</p>
          </div>
          {sessions.length > 1 ? (
            <Button size="sm" variant="outline" onClick={handleRevokeAllOther} className="border-red-300 text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-1.5" />
              <span>Logout from All Other Devices</span>
            </Button>
          ) : null}
        </div>

        <div className="divide-y divide-[#E8E2D9]">
          {sessions.map((sess) => (
            <div key={sess.id} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#FFF3E6] text-[#E67E22]">
                  {sess.deviceType === "MOBILE" ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#2C1E16]">{sess.deviceName}</h4>
                    {sess.isCurrent ? <Badge variant="success">This Device</Badge> : null}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {sess.ipAddress} &bull; {sess.lastActive}
                  </p>
                </div>
              </div>

              {!sess.isCurrent ? (
                <button
                  onClick={() => handleRevokeSession(sess.id)}
                  className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Revoke Access
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Security Activity Logs */}
      <Card className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#2C1E16]">Recent Security Events & Login History</h3>
          <p className="text-xs text-[#6E5D4F]">Audit trail of recent account logins and authorization requests.</p>
        </div>

        <div className="divide-y divide-[#E8E2D9]">
          {securityEvents.map((evt) => (
            <div key={evt.id} className="py-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-[#2C1E16]">{evt.eventType.replace(/_/g, " ")}</p>
                  <p className="text-gray-400">{evt.device} &bull; {evt.location}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={evt.status === "SUCCESS" ? "success" : "warning"}>{evt.status}</Badge>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(evt.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Emergency Account Logout */}
      <div className="text-center pt-4">
        <Button onClick={logout} variant="outline" className="border-red-400 text-red-600 hover:bg-red-50">
          <LogOut className="h-4 w-4 mr-2" />
          <span>Logout of OneBite Account Now</span>
        </Button>
      </div>
    </div>
  );
};
