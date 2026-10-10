import { type ProductItem } from "@/services/catalog.service";
import { type Decoration } from "@/services/decoration.service";

/**
 * Checks if a product belongs to the Decoration category.
 */
export function isDecorationProduct(product: ProductItem): boolean {
  if (product.productType === "DECORATION") return true;

  const catName = (product.categoryId?.name || "").toLowerCase();
  const catSlug = (product.categoryId?.slug || "").toLowerCase();
  if (catName.includes("decor") || catSlug.includes("decor")) return true;

  const name = (product.name || "").toLowerCase();
  const keywords = [
    "candle",
    "balloon",
    "topper",
    "popper",
    "poper",
    "decor",
    "decoration",
    "party hat",
    "party banner",
    "sash",
    "snow spray",
    "sparkler",
    "confetti",
  ];

  return keywords.some((kw) => name.includes(kw));
}

/**
 * Checks if a product belongs to Bakery items (Cakes, Pastries, Breads, Cookies, Tarts, etc.).
 */
export function isBakeryProduct(product: ProductItem): boolean {
  if (isDecorationProduct(product)) return false;

  const catName = (product.categoryId?.name || "").toLowerCase();
  const catSlug = (product.categoryId?.slug || "").toLowerCase();
  const name = (product.name || "").toLowerCase();

  const bakeryTerms = [
    "cake",
    "pastry",
    "bread",
    "cookie",
    "biscuit",
    "tart",
    "muffin",
    "cupcake",
    "brioche",
    "croissant",
    "sourdough",
    "doughnut",
    "donut",
    "loaf",
    "truffle",
    "brownie",
    "sweet",
  ];

  if (bakeryTerms.some((term) => catName.includes(term) || catSlug.includes(term) || name.includes(term))) {
    return true;
  }

  // If productType is NORMAL or CUSTOM_CAKE and not decoration, treat as bakery product
  return product.productType === "NORMAL" || product.productType === "CUSTOM_CAKE" || !product.productType;
}

/**
 * Converts a Decoration entity from decorationService into a standard ProductItem.
 */
export function convertDecorationToProductItem(
  d: Decoration,
  categories?: Array<{ id: string; name: string; slug: string }>,
): ProductItem {
  const catName = (d.category || "Party Decorations").trim();
  const matchedCat = categories?.find(
    (c) =>
      c.name.toLowerCase().trim() === catName.toLowerCase() ||
      c.slug.toLowerCase().trim() === catName.toLowerCase() ||
      c.id === catName,
  );

  const fallbackSlug = catName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    id: d.id || d._id || `decor-${d.slug}`,
    name: d.name,
    slug: d.slug,
    description: d.description || "",
    productType: "DECORATION",
    price: d.price,
    compareAtPrice: d.originalPrice,
    sku: `DEC-${d.slug || d.id}`,
    isEggless: true,
    isAvailable: d.inStock !== false,
    isComingSoon: Boolean(d.isComingSoon),
    categoryId: matchedCat
      ? {
          id: matchedCat.id,
          name: matchedCat.name,
          slug: matchedCat.slug,
        }
      : {
          id: d.category || "decorations",
          name: catName,
          slug: fallbackSlug || "decorations-item",
        },
    mainImage:
      d.image ||
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    images: d.images && d.images.length > 0 ? d.images : [d.image],
    rating: d.rating || 4.8,
    reviewCount: 38,
  };
}

// Kept empty: Strictly NO dummy or mock fallback decorations. Only real database products are displayed.
export const FALLBACK_DECORATIONS: ProductItem[] = [];

export interface RowWiseProductResult {
  orderedProducts: ProductItem[];
  bakeryRowProducts: ProductItem[];
  decorationRowProducts: ProductItem[];
  mixedRemainingProducts: ProductItem[];
  bakeryDisplayProducts: ProductItem[];
  decorationDisplayProducts: ProductItem[];
  mixedDisplayProducts: ProductItem[];
  allDecorationProducts: ProductItem[];
  totalBakeryCount: number;
  totalDecorationCount: number;
  totalProductsCount: number;
  hasMoreBakery: boolean;
  hasMoreDecorations: boolean;
  hasMoreMixed: boolean;
}

/**
 * Organizes products row-wise:
 * - Row 1 & 2 (First 2 rows = 8 items on desktop 4-column grid): Only Bakery Products (Cakes, Pastries, Breads, etc.)
 * - Row 3 (1 row = 4 items on desktop 4-column grid): Only Decoration items (Candles, Balloons, Cake Topper, etc.)
 * - Row 4+ (Remaining items): All products mixed together.
 *
 * Each row/block reserves its final element slot for a ViewMoreCard showing that more products are available.
 */
export function organizeProductsRowWise(
  products: ProductItem[],
  options?: {
    bakerySlots?: number;      // Default 8 (2 rows in 4-column grid)
    decorationSlots?: number;  // Default 4 (1 row in 4-column grid)
    additionalDecorations?: ProductItem[];
  }
): RowWiseProductResult {
  const bakerySlots = options?.bakerySlots ?? 8;
  const decorationSlots = options?.decorationSlots ?? 4;

  const candidateProducts = [...products];
  const existingIds = new Set(candidateProducts.map((p) => p.id));

  // Merge extra decoration items if needed
  if (options?.additionalDecorations && options.additionalDecorations.length > 0) {
    for (const d of options.additionalDecorations) {
      if (!existingIds.has(d.id)) {
        candidateProducts.push(d);
        existingIds.add(d.id);
      }
    }
  }

  // NOTE: Strictly no fallback decorations injected. Only genuine items from database are shown.

  const bakeryPool: ProductItem[] = [];
  const decorationPool: ProductItem[] = [];
  const otherPool: ProductItem[] = [];

  for (const item of candidateProducts) {
    if (isDecorationProduct(item)) {
      decorationPool.push(item);
    } else if (isBakeryProduct(item)) {
      bakeryPool.push(item);
    } else {
      otherPool.push(item);
    }
  }

  // Row 1 & 2: Bakery Products
  const bakeryRowProducts = bakeryPool.slice(0, bakerySlots);
  const remainingBakery = bakeryPool.slice(bakerySlots);

  // Row 3: Decoration Products
  const decorationRowProducts = decorationPool.slice(0, decorationSlots);
  const remainingDecorations = decorationPool.slice(decorationSlots);

  // Row 4+: Mixed Remaining Products (interleaved for a rich variety)
  const mixedRemainingProducts: ProductItem[] = [];
  const maxRem = Math.max(remainingBakery.length, remainingDecorations.length, otherPool.length);
  for (let i = 0; i < maxRem; i++) {
    if (i < remainingBakery.length) mixedRemainingProducts.push(remainingBakery[i]);
    if (i < remainingDecorations.length) mixedRemainingProducts.push(remainingDecorations[i]);
    if (i < otherPool.length) mixedRemainingProducts.push(otherPool[i]);
  }

  const orderedProducts = [
    ...bakeryRowProducts,
    ...decorationRowProducts,
    ...mixedRemainingProducts,
  ];

  // Display items reserving the last slot of each section for ViewMoreCard:
  // - Bakery (2 rows = 8 slots): 7 products + 1 ViewMoreCard in 8th slot
  const bakeryDisplayProducts = bakeryPool.slice(0, Math.max(1, bakerySlots - 1));

  // - Decorations (1 row = 4 slots): 3 products + 1 ViewMoreCard in 4th slot
  const decorationDisplayProducts = decorationPool.slice(0, Math.max(1, decorationSlots - 1));

  // - Mixed (1 row = 4 slots): 3 products + 1 ViewMoreCard in 4th slot
  const mixedDisplayProducts = mixedRemainingProducts.slice(0, 3);

  const totalBakeryCount = bakeryPool.length;
  const totalDecorationCount = decorationPool.length;
  const totalProductsCount = candidateProducts.length;

  return {
    orderedProducts,
    bakeryRowProducts,
    decorationRowProducts,
    mixedRemainingProducts,
    bakeryDisplayProducts,
    decorationDisplayProducts,
    mixedDisplayProducts,
    allDecorationProducts: decorationPool,
    totalBakeryCount,
    totalDecorationCount,
    totalProductsCount,
    hasMoreBakery: totalBakeryCount > bakeryDisplayProducts.length,
    hasMoreDecorations: totalDecorationCount > decorationDisplayProducts.length,
    hasMoreMixed: mixedRemainingProducts.length > mixedDisplayProducts.length || totalProductsCount > 10,
  };
}
