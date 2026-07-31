import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Cake, Clock, Award, ShieldCheck } from "lucide-react";

import { CategoryCard, ComboCard, OccasionCard, ReviewCard } from "@/components/cards/DomainCards";
import { ProductCard } from "@/components/cards/ProductCard";
import { Button } from "@/components/ui/Button";
import { MOCK_CATEGORIES, MOCK_COMBOS, MOCK_OCCASIONS, MOCK_PRODUCTS, MOCK_REVIEWS } from "@/data/mockData";
import type { ProductItem } from "@/services/catalog.service";

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#FFF3E6] via-[#FFFBF5] to-[#F9F6F0] border border-[#E8E2D9] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 shadow-sm">
        <div className="space-y-6 max-w-xl text-center md:text-left">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#E67E22]/10 text-[#E67E22] border border-[#E67E22]/30 uppercase tracking-wider">
            Freshly Baked Every Morning
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-[#2C1E16] leading-tight tracking-tight">
            Handcrafted <span className="text-[#E67E22]">Delights</span> for Every Celebration
          </h1>
          <p className="text-base md:text-lg text-[#6E5D4F]">
            From rich Belgian chocolate truffle cakes to fresh daily butter croissants and custom tier cakes — made with love and 100% premium ingredients.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
            <Link to="/products">
              <Button size="lg" className="shadow-md">
                <span>Explore Catalog</span>
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link to="/categories">
              <Button variant="outline" size="lg">
                View Categories
              </Button>
            </Link>
          </div>
        </div>

        <div className="w-full md:w-1/2 aspect-4/3 rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-1 hover:rotate-0 transition-transform duration-500">
          <img
            src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80"
            alt="Artisanal Belgian Truffle Cake"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Featured Categories Section */}
      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-[#2C1E16]">Browse Categories</h2>
            <p className="text-sm text-[#6E5D4F] mt-1">Explore our range of baked goods</p>
          </div>
          <Link to="/categories" className="text-sm font-bold text-[#E67E22] hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-[#2C1E16]">Bestselling Products</h2>
            <p className="text-sm text-[#6E5D4F] mt-1">Our customers' absolute favorite treats</p>
          </div>
          <Link to="/products" className="text-sm font-bold text-[#E67E22] hover:underline flex items-center gap-1">
            <span>View All Products</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_PRODUCTS.map((p) => {
            const productItem: ProductItem = {
              id: p.id,
              name: p.name,
              slug: p.slug,
              description: p.description,
              productType: "NORMAL",
              price: p.price,
              compareAtPrice: p.compareAtPrice,
              sku: `SKU-${p.id}`,
              isEggless: p.isEggless,
              isAvailable: true,
              isBestseller: p.isBestseller,
              mainImage: p.image,
              rating: p.rating,
              reviewCount: p.reviewCount,
            };
            return <ProductCard key={p.id} product={productItem} />;
          })}
        </div>
      </section>

      {/* Celebration Occasions */}
      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-[#2C1E16]">Baking for Occasions</h2>
          <p className="text-sm text-[#6E5D4F] mt-1">Custom tier designs tailored for your milestone events</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_OCCASIONS.map((occasion) => (
            <OccasionCard key={occasion.id} occasion={occasion} />
          ))}
        </div>
      </section>

      {/* Combo Collection */}
      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-[#2C1E16]">Special Celebration Combos</h2>
          <p className="text-sm text-[#6E5D4F] mt-1">Curated party hampers offering unbeatable savings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {MOCK_COMBOS.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      </section>

      {/* Why Choose OneBite */}
      <section className="rounded-3xl bg-[#2C1E16] text-[#FFFBF5] p-10 md:p-16 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-[#E67E22]">Why Choose OneBite Bakery?</h2>
          <p className="text-sm text-[#E8E2D9]/80">We take pride in baking with uncompromised quality and passion.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-3 p-4">
            <Cake className="h-10 w-10 text-[#E67E22] mx-auto" />
            <h3 className="text-lg font-bold">100% Fresh Daily</h3>
            <p className="text-xs text-[#E8E2D9]/70">Baked fresh every single morning using premium ingredients.</p>
          </div>
          <div className="space-y-3 p-4">
            <Award className="h-10 w-10 text-[#E67E22] mx-auto" />
            <h3 className="text-lg font-bold">Artisanal Master Bakers</h3>
            <p className="text-xs text-[#E8E2D9]/70">Crafted by award-winning pastry chefs with years of experience.</p>
          </div>
          <div className="space-y-3 p-4">
            <Clock className="h-10 w-10 text-[#E67E22] mx-auto" />
            <h3 className="text-lg font-bold">Fast Home Delivery</h3>
            <p className="text-xs text-[#E8E2D9]/70">Temperature controlled delivery ensures fresh & pristine cakes.</p>
          </div>
          <div className="space-y-3 p-4">
            <ShieldCheck className="h-10 w-10 text-[#E67E22] mx-auto" />
            <h3 className="text-lg font-bold">100% Eggless Option</h3>
            <p className="text-xs text-[#E8E2D9]/70">Dedicated eggless baking station for your dietary choices.</p>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-[#2C1E16]">Customer Testimonials</h2>
          <p className="text-sm text-[#6E5D4F]">Hear what our community says about their experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {MOCK_REVIEWS.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="rounded-3xl bg-gradient-to-r from-[#E67E22] to-[#D35400] text-white p-12 text-center space-y-6 shadow-xl">
        <h2 className="text-3xl md:text-4xl font-extrabold">Ready to Order Your Special Celebration Cake?</h2>
        <p className="text-base max-w-xl mx-auto text-white/90">
          Browse our full catalog or contact us for custom tier designs tailored to your event.
        </p>
        <Link to="/products" className="inline-block">
          <Button size="lg" className="bg-[#2C1E16] text-white hover:bg-[#1E1713] border-none">
            Browse Full Catalog
          </Button>
        </Link>
      </section>
    </div>
  );
};
