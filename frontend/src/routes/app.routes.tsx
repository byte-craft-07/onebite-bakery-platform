import React, { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AdminLayout } from "@/features/admin/layout/AdminLayout";
import { AdminRoute, GuestRoute, ProtectedRoute } from "@/routes/guards";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { BakeryLoader } from "@/components/common/BakeryLoader";
import { lazyRetry } from "@/utils/lazyRetry";

// Loading Fallback Component with smooth bakery animation
const PageLoader: React.FC = () => (
  <BakeryLoader
    fullScreen={false}
    message="Loading page..."
    subtext="Preparing fresh treats"
    size="md"
  />
);

// Public Pages (Lazy Loaded)
const HomePage = lazyRetry(() => import("@/pages/public/HomePage").then((m) => ({ default: m.HomePage })));
const ProductsListingPage = lazyRetry(() => import("@/pages/public/ProductsListingPage").then((m) => ({ default: m.ProductsListingPage })));
const ProductDetailsPage = lazyRetry(() => import("@/pages/public/ProductDetailsPage").then((m) => ({ default: m.ProductDetailsPage })));
const CategoriesPage = lazyRetry(() => import("@/pages/public/CategoriesPage").then((m) => ({ default: m.CategoriesPage })));
const OccasionsPage = lazyRetry(() => import("@/pages/public/OccasionsPage").then((m) => ({ default: m.OccasionsPage })));
const CustomCakePage = lazyRetry(() => import("@/pages/public/CustomCakePage").then((m) => ({ default: m.CustomCakePage })));
const CombosPage = lazyRetry(() => import("@/pages/public/CombosPage").then((m) => ({ default: m.CombosPage })));
const DecorationShopPage = lazyRetry(() => import("@/pages/public/DecorationShopPage").then((m) => ({ default: m.DecorationShopPage })));
const OffersPage = lazyRetry(() => import("@/pages/public/OffersPage").then((m) => ({ default: m.OffersPage })));
const AboutPage = lazyRetry(() => import("@/pages/public/InformationPages").then((m) => ({ default: m.AboutPage })));
const ContactPage = lazyRetry(() => import("@/pages/public/InformationPages").then((m) => ({ default: m.ContactPage })));
const CartPage = lazyRetry(() => import("@/pages/customer/CartPage").then((m) => ({ default: m.CartPage })));
const RazorpayDemoPage = lazyRetry(() => import("@/pages/public/RazorpayDemoPage").then((m) => ({ default: m.RazorpayDemoPage })));
const NotFoundPage = lazyRetry(() => import("@/pages/public/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

// Customer Protected Pages (Lazy Loaded)
const CustomerDashboardPage = lazyRetry(() => import("@/pages/customer/CustomerDashboardPage").then((m) => ({ default: m.CustomerDashboardPage })));
const CustomerProfilePage = lazyRetry(() => import("@/pages/customer/CustomerProfilePage").then((m) => ({ default: m.CustomerProfilePage })));
const CustomerAddressesPage = lazyRetry(() => import("@/pages/customer/CustomerAddressesPage").then((m) => ({ default: m.CustomerAddressesPage })));
const CustomerCelebrationsPage = lazyRetry(() => import("@/pages/customer/CustomerCelebrationsPage").then((m) => ({ default: m.CustomerCelebrationsPage })));
const CustomerSupportPage = lazyRetry(() => import("@/pages/customer/CustomerSupportPage").then((m) => ({ default: m.CustomerSupportPage })));
const OrdersHistoryPage = lazyRetry(() => import("@/pages/customer/OrdersPages").then((m) => ({ default: m.OrdersHistoryPage })));
const OrderDetailsPage = lazyRetry(() => import("@/pages/customer/OrdersPages").then((m) => ({ default: m.OrderDetailsPage })));
const FavoritesPage = lazyRetry(() => import("@/pages/customer/FavoritesPage").then((m) => ({ default: m.FavoritesPage })));
const CustomerNotificationsPage = lazyRetry(() => import("@/pages/customer/CustomerNotificationsPage").then((m) => ({ default: m.CustomerNotificationsPage })));
const CustomerSettingsPage = lazyRetry(() => import("@/pages/customer/CustomerSettingsPage").then((m) => ({ default: m.CustomerSettingsPage })));
const CustomerSecurityPage = lazyRetry(() => import("@/pages/customer/CustomerSecurityPage").then((m) => ({ default: m.CustomerSecurityPage })));
const CheckoutPage = lazyRetry(() => import("@/pages/customer/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const PaymentPage = lazyRetry(() => import("@/pages/customer/PaymentPages").then((m) => ({ default: m.PaymentPage })));
const OrderSuccessPage = lazyRetry(() => import("@/pages/customer/PaymentPages").then((m) => ({ default: m.OrderSuccessPage })));
const OrderFailurePage = lazyRetry(() => import("@/pages/customer/PaymentPages").then((m) => ({ default: m.OrderFailurePage })));

// Auth & Status Pages (Lazy Loaded)
const CustomerAuthContainer = lazyRetry(() => import("@/pages/auth/CustomerAuthContainer").then((m) => ({ default: m.CustomerAuthContainer })));
const AuthCallbackPage = lazyRetry(() => import("@/pages/auth/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage })));
const UnauthorizedPage = lazyRetry(() => import("@/pages/auth/StatusPages").then((m) => ({ default: m.UnauthorizedPage })));
const SessionExpiredPage = lazyRetry(() => import("@/pages/auth/StatusPages").then((m) => ({ default: m.SessionExpiredPage })));

// Admin Pages (Lazy Loaded)
const AdminDashboardShell = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminDashboardShell })));
const AdminMainBranchOrdersPage = lazyRetry(() => import("@/features/admin/pages/AdminMainBranchOrdersPage").then((m) => ({ default: m.AdminMainBranchOrdersPage })));
const AdminAdminsPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminAdminsPage })));
const AdminBannersPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminBannersPage })));
const AdminBranchManagementPage = lazyRetry(() => import("@/features/admin/pages/AdminBranchManagementPage").then((m) => ({ default: m.AdminBranchManagementPage })));
const AdminBranchMatrixPage = lazyRetry(() => import("@/features/admin/pages/AdminBranchMatrixPage").then((m) => ({ default: m.AdminBranchMatrixPage })));
const BranchAdminDashboardPage = lazyRetry(() => import("@/features/admin/pages/BranchAdminDashboardPage").then((m) => ({ default: m.BranchAdminDashboardPage })));
const BranchAdminProductsPage = lazyRetry(() => import("@/features/admin/pages/BranchAdminProductsPage").then((m) => ({ default: m.BranchAdminProductsPage })));
const BranchAdminOrdersPage = lazyRetry(() => import("@/features/admin/pages/BranchAdminOrdersPage").then((m) => ({ default: m.BranchAdminOrdersPage })));
const AdminCatalogPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminCatalogPage })));
const AdminCombosPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminCombosPage })));
const AdminCustomCakePage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminCustomCakePage })));
const AdminCategoryPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminCategoryPage })));
const AdminOccasionPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminOccasionPage })));
const AdminCouponsPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminCouponsPage })));
const AdminVillagesPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminVillagesPage })));
const AdminOrdersPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminOrdersPage })));
const AdminCustomersPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminCustomersPage })));
const AdminReviewsPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminReviewsPage })));
const AdminPaymentsPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminPaymentsPage })));
const AdminNotificationsPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminNotificationsPage })));
const AdminMediaPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminMediaPage })));
const AdminAnalyticsPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminAnalyticsPage })));
const AdminReportsPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminReportsPage })));
const AdminSettingsPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminSettingsPage })));
const AdminLogsPage = lazyRetry(() => import("@/features/admin").then((m) => ({ default: m.AdminLogsPage })));
const AdminSecurityPage = lazyRetry(() => import("@/features/admin/pages/AdminSecurityPage").then((m) => ({ default: m.AdminSecurityPage })));
const DeliveryAgentDashboardPage = lazyRetry(() => import("@/features/delivery/pages/DeliveryAgentDashboardPage").then((m) => ({ default: m.DeliveryAgentDashboardPage })));

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
            <Route path="payment-demo" element={<RazorpayDemoPage />} />
            <Route path="razorpay-test" element={<RazorpayDemoPage />} />

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

          {/* Guest Auth Routes & Aliases */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth" element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route index element={<CustomerAuthContainer />} />
              <Route path="login" element={<CustomerAuthContainer />} />
            </Route>
          </Route>
          <Route path="/customer/auth" element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route index element={<CustomerAuthContainer />} />
            </Route>
          </Route>
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />

          {/* Status Pages */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/session-expired" element={<SessionExpiredPage />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardShell />} />
              <Route path="main-branch-orders" element={<AdminMainBranchOrdersPage />} />
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
              <Route path="reviews" element={<AdminReviewsPage />} />
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
