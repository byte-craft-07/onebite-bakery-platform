import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { CategoriesPage } from "@/pages/public/CategoriesPage";
import { HomePage } from "@/pages/public/HomePage";
import { AboutPage, ContactPage } from "@/pages/public/InformationPages";
import { OccasionsPage } from "@/pages/public/OccasionsPage";
import { ProductDetailsPage } from "@/pages/public/ProductDetailsPage";
import { ProductsListingPage } from "@/pages/public/ProductsListingPage";
import { AdminRoute, GuestRoute } from "@/routes/guards";

const LoginPage: React.FC = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-center text-[#2C1E16]">Customer Authentication</h2>
    <p className="text-sm text-center text-[#6E5D4F]">Enter your phone number to receive a verification OTP.</p>
  </div>
);

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
        </Route>

        {/* Guest Auth Routes */}
        <Route path="/auth" element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
          </Route>
        </Route>

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
