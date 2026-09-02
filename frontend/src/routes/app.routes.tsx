import React, { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AdminLayout } from "@/features/admin/layout/AdminLayout";
import { AdminRoute, GuestRoute, ProtectedRoute } from "@/routes/guards";
import { ScrollToTop } from "@/components/common/ScrollToTop";

// Loading Fallback Component with smooth pulse
const PageLoader: React.FC = () => (
  <div className="flex min-h-[50vh] w-full items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E5DEC9] border-t-[#596B58]" />
      <span className="text-xs font-semibold tracking-wide text-[#7A6E65]">Loading page...</span>
    </div>
  </div>
);

// Public Pages (Lazy Loaded)
const HomePage = lazy(() => import("@/pages/public/HomePage").then((m) => ({ default: m.HomePage })));
const ProductsListingPage = lazy(() => import("@/pages/public/ProductsListingPage").then((m) => ({ default: m.ProductsListingPage })));
const ProductDetailsPage = lazy(() => import("@/pages/public/ProductDetailsPage").then((m) => ({ default: m.ProductDetailsPage })));
const CategoriesPage = lazy(() => import("@/pages/public/CategoriesPage").then((m) => ({ default: m.CategoriesPage })));
const OccasionsPage = lazy(() => import("@/pages/public/OccasionsPage").then((m) => ({ default: m.OccasionsPage })));
const CustomCakePage = lazy(() => import("@/pages/public/CustomCakePage").then((m) => ({ default: m.CustomCakePage })));
const CombosPage = lazy(() => import("@/pages/public/CombosPage").then((m) => ({ default: m.CombosPage })));
const DecorationShopPage = lazy(() => import("@/pages/public/DecorationShopPage").then((m) => ({ default: m.DecorationShopPage })));
const OffersPage = lazy(() => import("@/pages/public/OffersPage").then((m) => ({ default: m.OffersPage })));
const AboutPage = lazy(() => import("@/pages/public/InformationPages").then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import("@/pages/public/InformationPages").then((m) => ({ default: m.ContactPage })));
const CartPage = lazy(() => import("@/pages/customer/CartPage").then((m) => ({ default: m.CartPage })));
const NotFoundPage = lazy(() => import("@/pages/public/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

// Customer Protected Pages (Lazy Loaded)
const CustomerDashboardPage = lazy(() => import("@/pages/customer/CustomerDashboardPage").then((m) => ({ default: m.CustomerDashboardPage })));
const CustomerProfilePage = lazy(() => import("@/pages/customer/CustomerProfilePage").then((m) => ({ default: m.CustomerProfilePage })));
const CustomerAddressesPage = lazy(() => import("@/pages/customer/CustomerAddressesPage").then((m) => ({ default: m.CustomerAddressesPage })));
const CustomerCelebrationsPage = lazy(() => import("@/pages/customer/CustomerCelebrationsPage").then((m) => ({ default: m.CustomerCelebrationsPage })));
const CustomerSupportPage = lazy(() => import("@/pages/customer/CustomerSupportPage").then((m) => ({ default: m.CustomerSupportPage })));
const OrdersHistoryPage = lazy(() => import("@/pages/customer/OrdersPages").then((m) => ({ default: m.OrdersHistoryPage })));
const OrderDetailsPage = lazy(() => import("@/pages/customer/OrdersPages").then((m) => ({ default: m.OrderDetailsPage })));
const FavoritesPage = lazy(() => import("@/pages/customer/FavoritesPage").then((m) => ({ default: m.FavoritesPage })));
const CustomerNotificationsPage = lazy(() => import("@/pages/customer/CustomerNotificationsPage").then((m) => ({ default: m.CustomerNotificationsPage })));
const CustomerSettingsPage = lazy(() => import("@/pages/customer/CustomerSettingsPage").then((m) => ({ default: m.CustomerSettingsPage })));
const CustomerSecurityPage = lazy(() => import("@/pages/customer/CustomerSecurityPage").then((m) => ({ default: m.CustomerSecurityPage })));
const CheckoutPage = lazy(() => import("@/pages/customer/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const PaymentPage = lazy(() => import("@/pages/customer/PaymentPages").then((m) => ({ default: m.PaymentPage })));
const OrderSuccessPage = lazy(() => import("@/pages/customer/PaymentPages").then((m) => ({ default: m.OrderSuccessPage })));
const OrderFailurePage = lazy(() => import("@/pages/customer/PaymentPages").then((m) => ({ default: m.OrderFailurePage })));

// Auth & Status Pages (Lazy Loaded)
const CustomerAuthContainer = lazy(() => import("@/pages/auth/CustomerAuthContainer").then((m) => ({ default: m.CustomerAuthContainer })));
const UnauthorizedPage = lazy(() => import("@/pages/auth/StatusPages").then((m) => ({ default: m.UnauthorizedPage })));
const SessionExpiredPage = lazy(() => import("@/pages/auth/StatusPages").then((m) => ({ default: m.SessionExpiredPage })));

// Admin Pages (Lazy Loaded)
const AdminDashboardShell = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminDashboardShell })));
const AdminAdminsPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminAdminsPage })));
const AdminBannersPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminBannersPage })));
const AdminBranchManagementPage = lazy(() => import("@/features/admin/pages/AdminBranchManagementPage").then((m) => ({ default: m.AdminBranchManagementPage })));
const AdminBranchMatrixPage = lazy(() => import("@/features/admin/pages/AdminBranchMatrixPage").then((m) => ({ default: m.AdminBranchMatrixPage })));
const BranchAdminDashboardPage = lazy(() => import("@/features/admin/pages/BranchAdminDashboardPage").then((m) => ({ default: m.BranchAdminDashboardPage })));
const BranchAdminProductsPage = lazy(() => import("@/features/admin/pages/BranchAdminProductsPage").then((m) => ({ default: m.BranchAdminProductsPage })));
const BranchAdminOrdersPage = lazy(() => import("@/features/admin/pages/BranchAdminOrdersPage").then((m) => ({ default: m.BranchAdminOrdersPage })));
const AdminCatalogPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminCatalogPage })));
const AdminCombosPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminCombosPage })));
const AdminCustomCakePage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminCustomCakePage })));
const AdminCategoryPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminCategoryPage })));
const AdminOccasionPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminOccasionPage })));
const AdminCouponsPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminCouponsPage })));
const AdminVillagesPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminVillagesPage })));
const AdminOrdersPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminOrdersPage })));
const AdminCustomersPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminCustomersPage })));
const AdminPaymentsPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminPaymentsPage })));
const AdminNotificationsPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminNotificationsPage })));
const AdminMediaPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminMediaPage })));
const AdminAnalyticsPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminAnalyticsPage })));
const AdminReportsPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminReportsPage })));
const AdminSettingsPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminSettingsPage })));
const AdminLogsPage = lazy(() => import("@/features/admin").then((m) => ({ default: m.AdminLogsPage })));
const AdminSecurityPage = lazy(() => import("@/features/admin/pages/AdminSecurityPage").then((m) => ({ default: m.AdminSecurityPage })));
const DeliveryAgentDashboardPage = lazy(() => import("@/features/delivery/pages/DeliveryAgentDashboardPage").then((m) => ({ default: m.DeliveryAgentDashboardPage })));

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
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
            <Route path="offers" element={<OffersPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />

            {/* Cart Route */}
            <Route path="cart" element={<CartPage />} />

            {/* Protected Customer Account & Order Routes */}
            <Route path="customer" element={<ProtectedRoute />}>
              <Route index element={<Navigate to="/customer/dashboard" replace />} />
              <Route path="dashboard" element={<CustomerDashboardPage />} />
              <Route path="profile" element={<CustomerProfilePage />} />
              <Route path="addresses" element={<CustomerAddressesPage />} />
              <Route path="celebrations" element={<CustomerCelebrationsPage />} />
              <Route path="support" element={<CustomerSupportPage />} />
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
              <Route path="team" element={<AdminAdminsPage />} />
              <Route path="admins" element={<AdminAdminsPage />} />
              <Route path="banners" element={<AdminBannersPage />} />
              <Route path="branches" element={<AdminBranchManagementPage />} />
              <Route path="branch-matrix" element={<AdminBranchMatrixPage />} />
              <Route path="branch/dashboard" element={<BranchAdminDashboardPage />} />
              <Route path="branch/products" element={<BranchAdminProductsPage />} />
              <Route path="branch/orders" element={<BranchAdminOrdersPage />} />
              <Route path="catalog" element={<AdminCatalogPage />} />
              <Route path="combos" element={<AdminCombosPage />} />
              <Route path="custom-cakes" element={<AdminCustomCakePage />} />
              <Route path="categories" element={<AdminCategoryPage />} />

              <Route path="occasions" element={<AdminOccasionPage />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="villages" element={<AdminVillagesPage />} />
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

          {/* Delivery Agent Routes */}
          <Route path="/agent" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/agent/dashboard" replace />} />
              <Route path="dashboard" element={<DeliveryAgentDashboardPage />} />
              <Route path="orders" element={<DeliveryAgentDashboardPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
