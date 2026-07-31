import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { CategoryCard, ComboCard, OccasionCard, ReviewCard } from "@/components/cards/DomainCards";
import { ProductCard } from "@/components/cards/ProductCard";
import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { AuthProvider } from "@/contexts/auth.context";
import { MOCK_CATEGORIES, MOCK_COMBOS, MOCK_OCCASIONS, MOCK_PRODUCTS, MOCK_REVIEWS } from "@/data/mockData";
import { CategoriesPage } from "@/pages/public/CategoriesPage";
import { HomePage } from "@/pages/public/HomePage";
import { AboutPage, ContactPage } from "@/pages/public/InformationPages";
import { OccasionsPage } from "@/pages/public/OccasionsPage";
import { ProductDetailsPage } from "@/pages/public/ProductDetailsPage";
import { ProductsListingPage } from "@/pages/public/ProductsListingPage";

describe("Public Customer Experience Components & Pages", () => {
  it("renders Navbar and Footer navigation components", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Navbar />
          <Footer />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getAllByText("OneBite")[0]).toBeDefined();
    expect(screen.getByText("Quick Links")).toBeDefined();
  });

  it("renders ProductCard, CategoryCard, OccasionCard, ComboCard, and ReviewCard", () => {
    render(
      <MemoryRouter>
        <ProductCard product={MOCK_PRODUCTS[0]!} />
        <CategoryCard category={MOCK_CATEGORIES[0]!} />
        <OccasionCard occasion={MOCK_OCCASIONS[0]!} />
        <ComboCard combo={MOCK_COMBOS[0]!} />
        <ReviewCard review={MOCK_REVIEWS[0]!} />
      </MemoryRouter>,
    );

    expect(screen.getByText(MOCK_PRODUCTS[0]!.name)).toBeDefined();
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

    expect(screen.getByText("Freshly Baked Every Morning")).toBeDefined();
    expect(screen.getByText("Browse Categories")).toBeDefined();
    expect(screen.getByText("Bestselling Products")).toBeDefined();
    expect(screen.getByText("Ready to Order Your Special Celebration Cake?")).toBeDefined();
  });

  it("renders ProductsListingPage and ProductDetailsPage", () => {
    render(
      <MemoryRouter>
        <ProductsListingPage />
        <ProductDetailsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Our Bakery Catalog")).toBeDefined();
    expect(screen.getByText("Back to Products")).toBeDefined();
  });

  it("renders CategoriesPage, OccasionsPage, AboutPage, and ContactPage", () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
        <OccasionsPage />
        <AboutPage />
        <ContactPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Product Categories")).toBeDefined();
    expect(screen.getByText("Celebration Occasions")).toBeDefined();
    expect(screen.getByText("Our Story & Craft")).toBeDefined();
    expect(screen.getByText("Get in Touch")).toBeDefined();
  });
});
