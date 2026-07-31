import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import {
  AdminAnalyticsPage,
  AdminCatalogPage,
  AdminCustomersPage,
  AdminDashboardShell,
  AdminLayout,
  AdminLogsPage,
  AdminNotificationsPage,
  AdminOrdersPage,
  AdminPaymentsPage,
  AdminSettingsPage,
} from "@/features/admin";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { CustomerAuthContainer } from "@/pages/auth/CustomerAuthContainer";
import { SessionExpiredPage, UnauthorizedPage } from "@/pages/auth/StatusPages";
import { CartPage } from "@/pages/customer/CartPage";
import { CheckoutPage } from "@/pages/customer/CheckoutPage";
import { CustomerProfilePage } from "@/pages/customer/CustomerProfilePage";
import { FavoritesPage } from "@/pages/customer/FavoritesPage";
import { OrderDetailsPage, OrdersHistoryPage } from "@/pages/customer/OrdersPages";
import { OrderFailurePage, OrderSuccessPage, PaymentPage } from "@/pages/customer/PaymentPages";
import { CategoriesPage } from "@/pages/public/CategoriesPage";
import { HomePage } from "@/pages/public/HomePage";
import { AboutPage, ContactPage } from "@/pages/public/InformationPages";
import { OccasionsPage } from "@/pages/public/OccasionsPage";
import { ProductDetailsPage } from "@/pages/public/ProductDetailsPage";
import { ProductsListingPage } from "@/pages/public/ProductsListingPage";
import { AdminRoute, GuestRoute, ProtectedRoute } from "@/routes/guards";

const NotFoundPage: React.FC = () => (
  <div className="py-16 text-center space-y-4">
    <h1 className="text-5xl font-extrabold text-[#E67E22]">404</h1>
    <p className="text-lg text-[#6E5D4F]">Page not found.</p>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Website Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsListingPage />} />
          <Route path="products/:slug" element={<ProductDetailsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="occasions" element={<OccasionsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />

          {/* Cart Route */}
          <Route path="cart" element={<CartPage />} />

          {/* Protected Customer Account & Order Routes */}
          <Route path="customer" element={<ProtectedRoute />}>
            <Route path="profile" element={<CustomerProfilePage />} />
            <Route path="orders" element={<OrdersHistoryPage />} />
            <Route path="orders/:id" element={<OrderDetailsPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
          </Route>

          <Route path="checkout" element={<ProtectedRoute />}>
            <Route index element={<CheckoutPage />} />
          </Route>
          <Route path="payment/:orderId" element={<ProtectedRoute />}>
            <Route index element={<PaymentPage />} />
          </Route>
          <Route path="order/success/:orderId" element={<OrderSuccessPage />} />
          <Route path="order/failure/:orderId" element={<OrderFailurePage />} />
        </Route>

        {/* Guest Auth Routes */}
        <Route path="/auth" element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<CustomerAuthContainer />} />
          </Route>
        </Route>

        {/* Status Pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/session-expired" element={<SessionExpiredPage />} />

        {/* Admin Protected Routes */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardShell />} />
            <Route path="catalog" element={<AdminCatalogPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="logs" element={<AdminLogsPage />} />
          </Route>
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
