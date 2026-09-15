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

    expect(screen.getByText("Upload from Device")).toBeDefined();
  });

  it("renders ProductFormModal form modal", () => {
    render(
      <ProductFormModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />
    );

    expect(screen.getByText("Create New Product")).toBeDefined();
    expect(screen.getByPlaceholderText(/Belgian Truffle Cake/i)).toBeDefined();
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
    expect(screen.queryByText("Add New Product")).toBeNull();
    expect(screen.getByText("Actions")).toBeDefined();
  });

  it("tests adminCatalogService method definitions", () => {
    expect(typeof adminCatalogService.createProduct).toBe("function");
    expect(typeof adminCatalogService.updateProduct).toBe("function");
    expect(typeof adminCatalogService.deleteProduct).toBe("function");
    expect(typeof adminCatalogService.uploadMedia).toBe("function");
  });
});
