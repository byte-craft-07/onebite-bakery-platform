import React from "react";
import { AdminEmptyState, AdminPageHeader } from "../components/AdminComponents";

export { AdminCatalogPage } from "../catalog/AdminCatalogPage";

export const AdminOrdersPage: React.FC = () => (
  <div className="space-y-6">
    <AdminPageHeader title="Order Management & Dispatch" description="Monitor customer orders, update baking stages, and dispatch drivers." />
    <AdminEmptyState title="Order Dispatch Engine" description="Order management workflows will be implemented in Milestone 26C." />
  </div>
);

export const AdminCustomersPage: React.FC = () => (
  <div className="space-y-6">
    <AdminPageHeader title="Customer Accounts & Profiles" description="View customer profiles, active orders, and saved addresses." />
    <AdminEmptyState title="Customer Directory" description="Customer management module foundation ready." />
  </div>
);

export const AdminPaymentsPage: React.FC = () => (
  <div className="space-y-6">
    <AdminPageHeader title="Payments & Financial Audit" description="Razorpay transactions, payment statuses, and refund records." />
    <AdminEmptyState title="Payment Records" description="Razorpay transactions log ready." />
  </div>
);

export const AdminNotificationsPage: React.FC = () => (
  <div className="space-y-6">
    <AdminPageHeader title="Notifications & Broadcasts" description="Send transactional emails and system announcements." />
    <AdminEmptyState title="Notification Engine" description="Notification foundation ready." />
  </div>
);

export const AdminAnalyticsPage: React.FC = () => (
  <div className="space-y-6">
    <AdminPageHeader title="Platform Analytics" description="Sales charts, popular cakes, and peak ordering hours." />
    <AdminEmptyState title="Analytics Overview" description="Analytics module foundation ready." />
  </div>
);

export const AdminSettingsPage: React.FC = () => (
  <div className="space-y-6">
    <AdminPageHeader title="System Settings" description="Bakery business hours, store address, and tax configuration." />
    <AdminEmptyState title="Platform Settings" description="Settings panel foundation ready." />
  </div>
);

export const AdminLogsPage: React.FC = () => (
  <div className="space-y-6">
    <AdminPageHeader title="Audit & Activity Logs" description="Track administrator activity, login sessions, and database changes." />
    <AdminEmptyState title="Platform Audit Logs" description="Audit log viewer foundation ready." />
  </div>
);
