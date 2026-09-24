export interface SecurityEvent {
  id: string;
  eventType: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT" | "PASSWORD_CHANGE" | "GOOGLE_AUTH" | "SESSION_REVOKED";
  timestamp: string;
  ipAddress: string;
  device: string;
  location: string;
  status: "SUCCESS" | "SUSPICIOUS" | "BLOCKED";
}

export interface UserSession {
  id: string;
  deviceName: string;
  deviceType: "DESKTOP" | "MOBILE" | "TABLET";
  browser: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetModule: "PRODUCTS" | "ORDERS" | "CUSTOMERS" | "PAYMENTS" | "SETTINGS" | "MEDIA";
  details: string;
  timestamp: string;
  ipAddress: string;
}

const LOCAL_SESSIONS_KEY = "onebitebakery_user_active_sessions";
const LOCAL_SEC_EVENTS_KEY = "onebitebakery_user_security_events";
const LOCAL_AUDIT_LOGS_KEY = "onebitebakery_admin_audit_logs";

const INITIAL_SESSIONS: UserSession[] = [
  {
    id: "sess-current",
    deviceName: "Chrome on Windows 11",
    deviceType: "DESKTOP",
    browser: "Chrome 122.0",
    ipAddress: "103.24.12.89 (New Delhi, India)",
    lastActive: "Active Now",
    isCurrent: true,
  },
  {
    id: "sess-mobile-1",
    deviceName: "Onebite Bakery Mobile App (Android 14)",
    deviceType: "MOBILE",
    browser: "Chrome Mobile 121.0",
    ipAddress: "103.24.12.92 (New Delhi, India)",
    lastActive: "2 hours ago",
    isCurrent: false,
  },
];

const INITIAL_EVENTS: SecurityEvent[] = [
  {
    id: "evt-1",
    eventType: "GOOGLE_AUTH",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    ipAddress: "103.24.12.89",
    device: "Chrome 122.0 (Windows)",
    location: "New Delhi, India",
    status: "SUCCESS",
  },
  {
    id: "evt-2",
    eventType: "LOGIN_SUCCESS",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    ipAddress: "103.24.12.89",
    device: "Chrome Mobile (Android)",
    location: "New Delhi, India",
    status: "SUCCESS",
  },
];

const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: "audit-101",
    adminId: "adm-01",
    adminName: "Ajay Kumar (Super Admin)",
    action: "UPDATE_PRODUCT_PRICE",
    targetModule: "PRODUCTS",
    details: "Updated price of 'Belgian Truffle Cake' to ₹649 (5% discount active)",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    ipAddress: "103.24.12.89",
  },
  {
    id: "audit-102",
    adminId: "adm-01",
    adminName: "Ajay Kumar (Super Admin)",
    action: "DISPATCH_BROADCAST_NOTIFICATION",
    targetModule: "SETTINGS",
    details: "Dispatched promotional banner notification to 1,240 active customers",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    ipAddress: "103.24.12.89",
  },
  {
    id: "audit-103",
    adminId: "adm-01",
    adminName: "Ajay Kumar (Super Admin)",
    action: "UPDATE_ORDER_STAGE",
    targetModule: "ORDERS",
    details: "Changed status of Order #OB-98210 to PREPARING",
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    ipAddress: "103.24.12.89",
  },
];

export const auditLogService = {
  getUserSessions(): UserSession[] {
    try {
      const stored = localStorage.getItem(LOCAL_SESSIONS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (_e) {
      // Ignore
    }
    return INITIAL_SESSIONS;
  },

  revokeSession(sessionId: string): UserSession[] {
    const updated = this.getUserSessions().filter((s) => s.id !== sessionId);
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(updated));
    return updated;
  },

  revokeAllOtherSessions(): UserSession[] {
    const updated = this.getUserSessions().filter((s) => s.isCurrent);
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(updated));
    return updated;
  },

  getSecurityEvents(): SecurityEvent[] {
    try {
      const stored = localStorage.getItem(LOCAL_SEC_EVENTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (_e) {
      // Ignore
    }
    return INITIAL_EVENTS;
  },

  getAdminAuditLogs(): AdminAuditLog[] {
    try {
      const stored = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (_e) {
      // Ignore
    }
    return INITIAL_AUDIT_LOGS;
  },

  logAdminAction(action: string, module: AdminAuditLog["targetModule"], details: string): void {
    const logs = this.getAdminAuditLogs();
    const newLog: AdminAuditLog = {
      id: `audit-${Date.now()}`,
      adminId: "adm-01",
      adminName: "Ajay Kumar (Super Admin)",
      action,
      targetModule: module,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: "103.24.12.89",
    };
    const updated = [newLog, ...logs];
    localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(updated));
  },
};
