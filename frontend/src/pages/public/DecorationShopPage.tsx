import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  PartyPopper,
  Search,
  Settings,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

import { ProductCard } from "@/components/product/ProductCard";
import { toast } from "@/contexts/toast.context";
import { useAuth } from "@/contexts/auth.context";
import { decorationService, type Decoration } from "@/services/decoration.service";
import { catalogService, type CategoryItem } from "@/services/catalog.service";
import { convertDecorationToProductItem } from "@/utils/productGridUtils";
import { SEOHead } from "@/components/seo";

export const DecorationShopPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "branch_admin";

  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CategoryItem[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [instantOnly, setInstantOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [decoCats, catalogCats] = await Promise.allSettled([
          decorationService.getDecorationCategories(),
          catalogService.getCategories(),
        ]);
        const set = new Set<string>();
        if (decoCats.status === "fulfilled" && Array.isArray(decoCats.value)) {
          decoCats.value.forEach((c) => c && set.add(c.trim()));
        }
        if (catalogCats.status === "fulfilled" && Array.isArray(catalogCats.value)) {
          setCatalogCategories(catalogCats.value);
          catalogCats.value.forEach((c: any) => {
            const name = typeof c === "string" ? c : c?.name;
            if (name) set.add(name.trim());
          });
        }
        if (set.size > 0) {
          setAvailableCategories(Array.from(set));
        }
      } catch {
        // ignore
      }
    };
    void loadCategories();
  }, []);

  const fetchDecorations = async (category: string = "ALL") => {
    setIsLoading(true);
    try {
      const data = await decorationService.getDecorations(category);
      setDecorations(data);
    } catch (_err) {
      toast.error("Error", "Could not load party decorations from database.");
      setDecorations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDecorations(selectedCategory);
  }, [selectedCategory]);

  const categories = useMemo(() => {
    const list = new Set<string>();
    availableCategories.forEach((c) => list.add(c));
    decorations.forEach((d) => {
      if (d.category) list.add(d.category);
    });
    return ["ALL", ...Array.from(list)];
  }, [availableCategories, decorations]);

  const productItems = useMemo(() => {
    return decorations
      .filter((d) => {
        if (instantOnly && d.isInstantAvailable === false) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (d.name || "").toLowerCase().includes(q);
          const matchNameHi = (d.nameHi || "").toLowerCase().includes(q);
          const matchDesc = (d.description || "").toLowerCase().includes(q);
          const matchCat = (d.category || "").toLowerCase().includes(q);
          return matchName || matchNameHi || matchDesc || matchCat;
        }
        return true;
      })
      .map((item) => convertDecorationToProductItem(item, catalogCategories));
  }, [decorations, catalogCategories, instantOnly, searchQuery]);

  return (
    <div className="space-y-6 pb-16">
      <SEOHead
        title="Celebration Party Decoration Shop | Candles, Balloons & Toppers"
        description="Complete your celebration with food-grade metallic candles, custom acrylic cake toppers, pastel balloons, and confetti party poppers from OneBite Bakery. Fast delivery in Hamirpur."
        canonicalPath="/decorations"
        breadcrumbs={[{ name: "Decorations", url: "/decorations" }]}
      />

      {/* Top Nav & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Products</span>
          </Link>

          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <Link to="/" className="hover:text-[#596B58] transition-colors">Home</Link>
            <span className="text-gray-300">/</span>
            <span className="text-[#3B302B] font-bold" aria-current="page">Decorations</span>
          </nav>
        </div>

        {isAdmin && (
          <Link
            to="/admin/decorations"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#596B58] text-white hover:bg-[#495948] text-xs font-bold transition-all shadow-xs"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Admin CRUD Panel</span>
          </Link>
        )}
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FFF8EC] via-[#FFF8EC] to-[#FFF8EC] border border-[#E5DEC9] p-6 sm:p-10 text-center space-y-4 shadow-xs relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#596B58]/10 text-[#596B58] text-xs font-bold uppercase tracking-wider">
          <PartyPopper className="h-4 w-4" />
          <span>Party Decoration Accessories</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#3B302B]">
          Celebration Party Decoration Shop
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6E65] max-w-2xl mx-auto">
          Complete your bakery order with premium food-grade candles, acrylic toppers, pastel balloons, and confetti party poppers. Click any item to view full details, multi-photo gallery, or order directly!
        </p>

        {/* Search & Instant Delivery Filter Bar */}
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <div className="relative w-full flex-1">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candles, balloons, toppers, sprays..."
              className="w-full pl-9 pr-8 py-2 rounded-full bg-white border border-[#E5DEC9] text-xs sm:text-sm focus:outline-none focus:border-[#596B58]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setInstantOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              instantOnly
                ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                : "bg-white text-[#3B302B] border-[#E5DEC9] hover:bg-[#FFF8EC]"
            }`}
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Instant Delivery</span>
          </button>
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#596B58] text-white shadow-xs"
                      : "bg-white text-[#7A6E65] hover:bg-[#E5DEC9]/40 border border-[#E5DEC9]"
                  }`}
                >
                  {cat === "ALL" ? "All Items" : cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Grid / Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-[#E5DEC9] bg-white overflow-hidden p-4 space-y-3 animate-pulse"
            >
              <div className="aspect-square bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded-md w-3/4" />
              <div className="h-3 bg-gray-200 rounded-md w-1/2" />
              <div className="h-8 bg-gray-200 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : productItems.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#E5DEC9] space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-[#596B58]/10 flex items-center justify-center text-[#596B58]">
            <PartyPopper className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-[#3B302B]">No decoration items found</h3>
          <p className="text-xs text-[#7A6E65] max-w-sm mx-auto">
            {searchQuery
              ? `No decorations matched "${searchQuery}".`
              : selectedCategory !== "ALL"
              ? "No items currently available in this category."
              : "Party decorations will be updated soon."}
          </p>
          {isAdmin && (
            <Link
              to="/admin/decorations"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#596B58] text-white text-xs font-bold hover:bg-[#495948] transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              <span>Add Items in Admin</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {productItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
