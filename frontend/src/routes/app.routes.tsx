import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { CustomerAuthContainer } from "@/pages/auth/CustomerAuthContainer";
import { SessionExpiredPage, UnauthorizedPage } from "@/pages/auth/StatusPages";
import { CustomerProfilePage } from "@/pages/customer/CustomerProfilePage";
import { CategoriesPage } from "@/pages/public/CategoriesPage";
import { HomePage } from "@/pages/public/HomePage";
import { AboutPage, ContactPage } from "@/pages/public/InformationPages";
import { OccasionsPage } from "@/pages/public/OccasionsPage";
import { ProductDetailsPage } from "@/pages/public/ProductDetailsPage";
import { ProductsListingPage } from "@/pages/public/ProductsListingPage";
import { AdminRoute, GuestRoute, ProtectedRoute } from "@/routes/guards";

const AdminDashboardPage: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#2C1E16]">Platform Administration</h1>
    <p className="text-[#6E5D4F]">Overview of bakery orders, catalog management, and platform analytics.</p>
  </div>
);

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

          {/* Protected Customer Account Routes */}
          <Route path="customer" element={<ProtectedRoute />}>
            <Route path="profile" element={<CustomerProfilePage />} />
          </Route>
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
            <Route index element={<AdminDashboardPage />} />
          </Route>
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
