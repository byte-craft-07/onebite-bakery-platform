import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import {
  AdminAnalyticsPage,
  AdminCatalogPage,
  AdminCategoryPage,
  AdminCustomersPage,
  AdminDashboardShell,
  AdminLayout,
  AdminLogsPage,
  AdminMediaPage,
  AdminNotificationsPage,
  AdminOccasionPage,
  AdminOrdersPage,
  AdminPaymentsPage,
  AdminReportsPage,
  AdminSettingsPage,
} from "@/features/admin";
import { AdminSecurityPage } from "@/features/admin/pages/AdminSecurityPage";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { CustomerAuthContainer } from "@/pages/auth/CustomerAuthContainer";
import { SessionExpiredPage, UnauthorizedPage } from "@/pages/auth/StatusPages";
import { CartPage } from "@/pages/customer/CartPage";
import { CheckoutPage } from "@/pages/customer/CheckoutPage";
import { CustomerDashboardPage } from "@/pages/customer/CustomerDashboardPage";
import { CustomerNotificationsPage } from "@/pages/customer/CustomerNotificationsPage";
import { CustomerProfilePage } from "@/pages/customer/CustomerProfilePage";
import { CustomerSecurityPage } from "@/pages/customer/CustomerSecurityPage";
import { CustomerSettingsPage } from "@/pages/customer/CustomerSettingsPage";
import { FavoritesPage } from "@/pages/customer/FavoritesPage";
import { OrderDetailsPage, OrdersHistoryPage } from "@/pages/customer/OrdersPages";
import { OrderFailurePage, OrderSuccessPage, PaymentPage } from "@/pages/customer/PaymentPages";
import { CategoriesPage } from "@/pages/public/CategoriesPage";
import { CombosPage } from "@/pages/public/CombosPage";
import { CustomCakePage } from "@/pages/public/CustomCakePage";
import { DecorationShopPage } from "@/pages/public/DecorationShopPage";
import { HomePage } from "@/pages/public/HomePage";
import { AboutPage, ContactPage } from "@/pages/public/InformationPages";
import { NotFoundPage } from "@/pages/public/NotFoundPage";
import { OccasionsPage } from "@/pages/public/OccasionsPage";
import { ProductDetailsPage } from "@/pages/public/ProductDetailsPage";
import { ProductsListingPage } from "@/pages/public/ProductsListingPage";
import { AdminRoute, GuestRoute, ProtectedRoute } from "@/routes/guards";

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
          <Route path="categories/:slug" element={<ProductsListingPage />} />
          <Route path="occasions" element={<OccasionsPage />} />
          <Route path="occasions/:slug" element={<ProductsListingPage />} />
          <Route path="custom-cake" element={<CustomCakePage />} />
          <Route path="combos" element={<CombosPage />} />
          <Route path="decorations" element={<DecorationShopPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />

          {/* Cart Route */}
          <Route path="cart" element={<CartPage />} />

          {/* Protected Customer Account & Order Routes */}
          <Route path="customer" element={<ProtectedRoute />}>
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboardPage />} />
            <Route path="profile" element={<CustomerProfilePage />} />
            <Route path="orders" element={<OrdersHistoryPage />} />
            <Route path="orders/:id" element={<OrderDetailsPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="notifications" element={<CustomerNotificationsPage />} />
            <Route path="settings" element={<CustomerSettingsPage />} />
            <Route path="security" element={<CustomerSecurityPage />} />
          </Route>

          <Route path="checkout" element={<ProtectedRoute />}>
            <Route index element={<CheckoutPage />} />
          </Route>
          <Route path="payment/:orderId" element={<ProtectedRoute />}>
            <Route index element={<PaymentPage />} />
          </Route>
          <Route path="order/success/:orderId" element={<OrderSuccessPage />} />
          <Route path="order/failure/:orderId" element={<OrderFailurePage />} />

          {/* 404 Inside Layout */}
          <Route path="*" element={<NotFoundPage />} />
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
            <Route path="categories" element={<AdminCategoryPage />} />
            <Route path="occasions" element={<AdminOccasionPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="media" element={<AdminMediaPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="logs" element={<AdminLogsPage />} />
            <Route path="security" element={<AdminSecurityPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
