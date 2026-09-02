import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Eye,
  FileText,
  KeyRound,
  Lock,
  RefreshCcw,
  Shield,
  ShieldCheck,
  UserX,
} from "lucide-react";

import { Badge } from "@/components/ui/DisplayComponents";
import { AdminCard, AdminPageHeader, AdminTable, AdminToolbar } from "../components/AdminComponents";
import { auditLogService, type AdminAuditLog } from "@/services/auditLog.service";

export const AdminSecurityPage: React.FC = () => {
  const [auditLogs] = useState<AdminAuditLog[]>(() => auditLogService.getAdminAuditLogs());
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesModule = selectedModule === "ALL" || log.targetModule === selectedModule;
    const matchesQuery =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Admin Security Dashboard & Audit Trail"
        description="Monitor system security health, failed login attempts, blocked IP addresses, and critical admin operation audit logs."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Security Health Score</span>
            <ShieldCheck className="h-5 w-5 text-[#27AE60]" />
          </div>
          <p className="text-2xl font-extrabold text-[#27AE60]">100% EXCELLENT</p>
          <p className="text-[11px] text-gray-400">Helmet Headers & Encrypted JWT Active</p>
        </AdminCard>

        <AdminCard className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Failed Login Attempts (24h)</span>
            <UserX className="h-5 w-5 text-[#596B58]" />
          </div>
          <p className="text-2xl font-extrabold text-[#3B302B]">0 Failed</p>
          <p className="text-[11px] text-gray-400">Brute-Force Rate Limiting Active</p>
        </AdminCard>

        <AdminCard className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Active Admin Sessions</span>
            <KeyRound className="h-5 w-5 text-[#3498DB]" />
          </div>
          <p className="text-2xl font-extrabold text-[#3498DB]">1 Super Admin</p>
          <p className="text-[11px] text-gray-400">RBAC Role Enforcement Active</p>
        </AdminCard>

        <AdminCard className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Blocked Suspicious IPs</span>
            <Shield className="h-5 w-5 text-[#27AE60]" />
          </div>
          <p className="text-2xl font-extrabold text-[#27AE60]">0 Threat IPs</p>
          <p className="text-[11px] text-gray-400">NoSQL Query Sanitizer Active</p>
        </AdminCard>
      </div>

      {/* Module Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5DEC9] pb-4">
        {["ALL", "PRODUCTS", "ORDERS", "CUSTOMERS", "PAYMENTS", "SETTINGS"].map((mod) => (
          <button
            key={mod}
            onClick={() => setSelectedModule(mod)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              selectedModule === mod
                ? "bg-[#596B58] text-white shadow-xs"
                : "bg-white border border-[#E5DEC9] text-[#3B302B] hover:bg-[#FFF8EC]"
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      <AdminToolbar
        searchPlaceholder="Search action, admin name, or details..."
        onSearchChange={setSearchQuery}
      />

      {/* Audit Logs Table */}
      <AdminCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-[#E5DEC9] bg-[#FFF8EC] flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-sm text-[#3B302B]">
            <FileText className="h-4 w-4 text-[#596B58]" />
            <span>Admin Operation Audit Trail ({filteredLogs.length})</span>
          </div>
          <span className="text-xs text-gray-400">Immutable Cryptographic Audit Storage</span>
        </div>

        <AdminTable headers={["Timestamp", "Admin User", "Target Module", "Action Code", "Operation Details", "IP Address"]}>
          {filteredLogs.map((log) => (
            <tr key={log.id} className="hover:bg-[#FFF8EC]/50 transition-colors text-xs">
              <td className="px-4 py-3 text-gray-500 font-mono">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3 font-bold text-[#3B302B]">
                {log.adminName}
              </td>
              <td className="px-4 py-3">
                <Badge variant="primary">{log.targetModule}</Badge>
              </td>
              <td className="px-4 py-3 font-mono font-bold text-[#596B58]">
                {log.action}
              </td>
              <td className="px-4 py-3 text-[#7A6E65] max-w-xs truncate">
                {log.details}
              </td>
              <td className="px-4 py-3 font-mono text-gray-400">
                {log.ipAddress}
              </td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>
    </div>
  );
};
