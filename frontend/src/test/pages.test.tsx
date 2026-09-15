import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { CategoryCard, ComboCard, OccasionCard, ReviewCard } from "@/components/cards/DomainCards";
import { ProductCard } from "@/components/cards/ProductCard";
import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { AuthProvider } from "@/contexts/auth.context";
import { PWAProvider } from "@/contexts/pwa.context";
import { MOCK_CATEGORIES, MOCK_COMBOS, MOCK_OCCASIONS, MOCK_PRODUCTS, MOCK_REVIEWS } from "@/data/mockData";
import { CategoriesPage } from "@/pages/public/CategoriesPage";
import { HomePage } from "@/pages/public/HomePage";
import { AboutPage, ContactPage } from "@/pages/public/InformationPages";
import { OccasionsPage } from "@/pages/public/OccasionsPage";
import { ProductDetailsPage } from "@/pages/public/ProductDetailsPage";
import { ProductsListingPage } from "@/pages/public/ProductsListingPage";
import { catalogService, type ProductItem } from "@/services/catalog.service";

const sampleProductItem: ProductItem = {
  id: MOCK_PRODUCTS[0]!.id,
  name: MOCK_PRODUCTS[0]!.name,
  slug: MOCK_PRODUCTS[0]!.slug,
  description: MOCK_PRODUCTS[0]!.description,
  productType: "NORMAL",
  price: MOCK_PRODUCTS[0]!.price,
  compareAtPrice: MOCK_PRODUCTS[0]!.compareAtPrice,
  sku: "SKU-TRUFFLE-01",
  isEggless: true,
  isAvailable: true,
  mainImage: MOCK_PRODUCTS[0]!.image,
  rating: 4.9,
  reviewCount: 128,
};

describe("Product Discovery Components & Catalog Service Tests", () => {
  it("renders Navbar and Footer navigation components", () => {
    render(
      <AuthProvider>
        <PWAProvider>
          <MemoryRouter>
            <Navbar />
            <Footer />
          </MemoryRouter>
        </PWAProvider>
      </AuthProvider>,
    );

    expect(screen.getAllByText("The Online Bakery")[0]).toBeDefined();
    expect(screen.getByText("Quick Links")).toBeDefined();
  });

  it("renders ProductCard, CategoryCard, OccasionCard, ComboCard, and ReviewCard", () => {
    render(
      <MemoryRouter>
        <ProductCard product={sampleProductItem} />
        <CategoryCard category={MOCK_CATEGORIES[0]!} />
        <OccasionCard occasion={MOCK_OCCASIONS[0]!} />
        <ComboCard combo={MOCK_COMBOS[0]!} />
        <ReviewCard review={MOCK_REVIEWS[0]!} />
      </MemoryRouter>,
    );

    expect(screen.getByText(sampleProductItem.name)).toBeDefined();
    expect(screen.getByText(MOCK_CATEGORIES[0]!.name)).toBeDefined();
    expect(screen.getByText(MOCK_OCCASIONS[0]!.name)).toBeDefined();
    expect(screen.getByText(MOCK_COMBOS[0]!.title)).toBeDefined();
    expect(screen.getByText(MOCK_REVIEWS[0]!.name)).toBeDefined();
  });

  it("renders HomePage with Hero, Categories, Bestsellers, and CTA sections", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Browse Categories")).toBeDefined();
    expect(screen.getByText("All Bakery & Party Products")).toBeDefined();
    expect(screen.getByText("Special Celebration Combos")).toBeDefined();
  });

  it("renders ProductsListingPage and ProductDetailsPage", () => {
    render(
      <MemoryRouter>
        <ProductsListingPage />
        <ProductDetailsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Our Bakery Catalog")).toBeDefined();
  });

  it("tests catalogService method definitions", () => {
    expect(typeof catalogService.searchProducts).toBe("function");
    expect(typeof catalogService.getProductBySlug).toBe("function");
    expect(typeof catalogService.getCategories).toBe("function");
    expect(typeof catalogService.getOccasions).toBe("function");
  });
});
