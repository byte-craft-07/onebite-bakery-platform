import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "@/contexts/auth.context";
import { AdminCatalogPage, MediaUploader, ProductFormModal } from "@/features/admin";
import { adminCatalogService } from "@/features/admin/services/adminCatalog.service";

describe("Admin Catalog Management & Media Uploader Tests", () => {
  it("renders MediaUploader component with dropzone prompt", () => {
    render(
      <MediaUploader value="" onChange={() => {}} />
    );

    expect(screen.getByText("Click to upload or drag image file")).toBeDefined();
  });

  it("renders ProductFormModal form modal", () => {
    render(
      <ProductFormModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />
    );

    expect(screen.getByText("Create New Product")).toBeDefined();
    expect(screen.getByLabelText("Product Name")).toBeDefined();
    expect(screen.getByLabelText("SKU Code")).toBeDefined();
  });

  it("renders AdminCatalogPage product table layout", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminCatalogPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Catalog & Inventory Management")).toBeDefined();
    expect(screen.getByText("Add New Product")).toBeDefined();
  });

  it("tests adminCatalogService method definitions", () => {
    expect(typeof adminCatalogService.createProduct).toBe("function");
    expect(typeof adminCatalogService.updateProduct).toBe("function");
    expect(typeof adminCatalogService.deleteProduct).toBe("function");
    expect(typeof adminCatalogService.uploadMedia).toBe("function");
  });
});
