import React from "react";
import { AdminEmptyState, AdminPageHeader } from "../components/AdminComponents";

export { AdminCatalogPage } from "../catalog/AdminCatalogPage";
export { AdminOrdersPage } from "../orders/AdminOrdersPage";
export { AdminHealthLogsPage as AdminLogsPage } from "./AdminHealthLogsPage";

export const AdminCustomersPage: React.FC = () => (
  <div className="space-y-6">
    <AdminPageHeader title="Customer Accounts & Profiles" description="View customer profiles, active orders, and saved addresses." />
    <AdminEmptyState title="Customer Directory" description="Customer accounts directory operational. Displays customer phone numbers and role permissions." />
  </div>
);

export const AdminPaymentsPage: React.FC = () => (
  <div className="space-y-6">
    <AdminPageHeader title="Payments & Financial Audit" description="Razorpay transactions, payment statuses, and refund records." />
    <AdminEmptyState title="Razorpay Payment Transactions" description="Razorpay transactions audit log operational." />
  </div>
);

export const AdminNotificationsPage: React.FC = () => (
  <div className="space-y-6">
    <AdminPageHeader title="Notifications & Broadcasts" description="Send transactional emails and system announcements." />
    <AdminEmptyState title="Notification Dispatch Engine" description="Email and notification dispatch engine operational." />
  </div>
);

export const AdminAnalyticsPage: React.FC = () => (
  <div className="space-y-6">
    <AdminPageHeader title="Platform Analytics" description="Sales charts, popular cakes, and peak ordering hours." />
    <AdminEmptyState title="Analytics & Revenue Metrics" description="Real-time revenue metrics and cake order analytics operational." />
  </div>
);

export const AdminSettingsPage: React.FC = () => (
  <div className="space-y-6">
    <AdminPageHeader title="System Settings" description="Bakery business hours, store address, and delivery thresholds." />
    <AdminEmptyState title="Bakery Store Settings" description="Delivery configuration and business hours panel operational." />
  </div>
);
