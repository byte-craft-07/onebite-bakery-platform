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
 * Resolves the display label for a product's weight, pack, or piece count
 * (e.g. "500g", "1kg", "50 Pcs", "Pack of 2", "1 Pack", "1 Pc", "1 Set").
 */
export function getProductUnitLabel(item: any): string {
  if (!item) return "500g";

  // 1. Direct unit or weight property
  if (typeof item.unit === "string" && item.unit.trim()) {
    return item.unit.trim();
  }
  if (typeof item.weight === "string" && item.weight.trim()) {
    return item.weight.trim();
  }

  // 2. Weight options array (match item's base price first, otherwise first option)
  if (Array.isArray(item.weightOptions) && item.weightOptions.length > 0) {
    const matchedByPrice = item.weightOptions.find(
      (w: any) =>
        w &&
        typeof w.weight === "string" &&
        w.weight.trim() &&
        Number(w.price) === Number(item.price),
    );
    if (matchedByPrice) {
      return matchedByPrice.weight.trim();
    }
    const firstValid = item.weightOptions.find(
      (w: any) => w && typeof w.weight === "string" && w.weight.trim(),
    );
    if (firstValid) {
      return firstValid.weight.trim();
    }
  }

  // 3. Customization weight (for cart / checkout / order items)
  if (item.customization) {
    if (typeof item.customization.weight === "string" && item.customization.weight.trim()) {
      return item.customization.weight.trim();
    }
    if (item.customization.weightKg !== undefined && item.customization.weightKg !== null) {
      return `${item.customization.weightKg}kg`;
    }
  }

  // 4. Extract explicit weight / pack / pcs from name or shortDescription
  const rawName = String(item.name || item.productName || item.title || "").trim();
  const rawDesc = String(item.shortDescription || item.description || "").trim();

  const extractFromText = (text: string): string | null => {
    if (!text) return null;

    // Match parenthesized pack/pcs/weight first, e.g. "(50 Pcs)", "(Pack of 2)", "(500g)", "(Box of 6)"
    const parenMatch = text.match(
      /\(\s*(\d+(?:\.\d+)?\s*(?:kg|g|gm|gms|gram|grams|ml|ltr|l|pcs|pc|pieces|piece|pack|packs|set|sets|slice|slices|box)|(?:pack|box|set)\s+of\s+\d+(?:\s*(?:pcs|pc|pieces))?)\s*\)/i,
    );
    if (parenMatch?.[1]) {
      return parenMatch[1].trim();
    }

    // Match "Pack of N", "Box of N", "Set of N"
    const packOfMatch = text.match(
      /\b((?:pack|box|set)\s+of\s+\d+(?:\s*(?:pcs|pc|pieces))?)\b/i,
    );
    if (packOfMatch?.[1]) {
      return packOfMatch[1]
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    // Match numeric weight or piece count, e.g. "500g", "1kg", "1.5 kg", "50 Pcs", "6 pcs", "250 gm"
    const unitMatch = text.match(
      /\b(\d+(?:\.\d+)?\s*(?:kg|g|gm|gms|gram|grams|ml|ltr|pcs|pc|pieces|piece|packs|pack|sets|set|slices|slice))\b/i,
    );
    if (unitMatch?.[1]) {
      const val = unitMatch[1].trim();
      return val
        .replace(/\bpcs\b/i, "Pcs")
        .replace(/\bpc\b/i, "Pc")
        .replace(/\bpack\b/i, "Pack")
        .replace(/\bpacks\b/i, "Packs")
        .replace(/\bset\b/i, "Set")
        .replace(/\bsets\b/i, "Sets");
    }

    return null;
  };

  const fromName = extractFromText(rawName);
  if (fromName) return fromName;

  const fromDesc = extractFromText(rawDesc);
  if (fromDesc) return fromDesc;

  // 5. Smart category / productType fallback
  const nameLower = rawName.toLowerCase();
  const catName = String(
    item.categoryId?.name || item.category || "",
  ).toLowerCase();
  const catSlug = String(item.categoryId?.slug || "").toLowerCase();
  const combinedText = `${nameLower} ${catName} ${catSlug}`;

  if (
    item.productType === "COMBO" ||
    combinedText.includes("combo") ||
    combinedText.includes("hamper")
  ) {
    return "1 Combo Pack";
  }

  if (
    item.productType === "DECORATION" ||
    isDecorationProduct(item as ProductItem)
  ) {
    if (
      nameLower.includes("topper") ||
      nameLower.includes("sash") ||
      nameLower.includes("banner") ||
      nameLower.includes("cap") ||
      nameLower.includes("hat") ||
      nameLower.includes("crown") ||
      nameLower.includes("knife")
    ) {
      return "1 Pc";
    }
    if (nameLower.includes("set")) {
      return "1 Set";
    }
    return "1 Pack";
  }

  if (
    combinedText.includes("pastry") ||
    combinedText.includes("pastries") ||
    combinedText.includes("tart") ||
    combinedText.includes("cupcake") ||
    combinedText.includes("muffin") ||
    combinedText.includes("croissant") ||
    combinedText.includes("donut") ||
    combinedText.includes("doughnut") ||
    combinedText.includes("brownie") ||
    combinedText.includes("slice") ||
    combinedText.includes("lava") ||
    combinedText.includes("puff") ||
    combinedText.includes("patty") ||
    combinedText.includes("roll")
  ) {
    if (nameLower.includes("pack") || nameLower.includes("box")) {
      return "1 Pack";
    }
    return "1 Pc";
  }

  if (
    combinedText.includes("cookie") ||
    combinedText.includes("biscuit") ||
    combinedText.includes("biscotti") ||
    combinedText.includes("macaron") ||
    combinedText.includes("rusk") ||
    combinedText.includes("khari")
  ) {
    return "1 Pack";
  }

  if (
    combinedText.includes("bread") ||
    combinedText.includes("loaf") ||
    combinedText.includes("sourdough") ||
    combinedText.includes("brioche") ||
    combinedText.includes("bun") ||
    combinedText.includes("pav")
  ) {
    return "1 Pack";
  }

  if (combinedText.includes("pizza") || combinedText.includes("burger")) {
    return "1 Pc";
  }

  // Default for cakes
  return "500g";
}

/**
 * Checks whether a product is a standard multi-weight cake (500g / 1kg / 2kg)
 * vs a unit/pack/pcs product (pastry, bread, cookie, decoration, combo).
 */
export function isMultiWeightCakeProduct(product: any): boolean {
  if (!product) return false;
  if (product.productType === "DECORATION" || product.productType === "COMBO") {
    return false;
  }
  if (isDecorationProduct(product as ProductItem)) {
    return false;
  }

  const nameLower = String(product.name || "").toLowerCase();
  const catName = String(product.categoryId?.name || product.category || "").toLowerCase();
  const catSlug = String(product.categoryId?.slug || "").toLowerCase();
  const combined = `${nameLower} ${catName} ${catSlug}`;

  const nonCakeTerms = [
    "pastry",
    "pastries",
    "tart",
    "cupcake",
    "muffin",
    "croissant",
    "donut",
    "doughnut",
    "brownie",
    "cookie",
    "biscuit",
    "biscotti",
    "macaron",
    "bread",
    "loaf",
    "sourdough",
    "brioche",
    "lava",
    "pizza",
    "burger",
    "puff",
    "patty",
  ];
  if (nonCakeTerms.some((term) => combined.includes(term))) {
    return false;
  }

  // If name explicitly specifies a pack or pcs count, it's sold by pack/pcs
  if (/\b(\d+\s*(?:pcs|pc|pack|packs|set|sets)|(?:pack|box|set)\s+of\s+\d+)\b/i.test(nameLower)) {
    return false;
  }

  return true;
}

/**
 * Returns the selectable weight / pack / pcs options for a product.
 */
export function getProductDefaultOptions(product: ProductItem | null | undefined): Array<{
  weight: string;
  serves?: string;
  price: number;
  compareAtPrice: number;
}> {
  if (!product) return [];

  if (Array.isArray(product.weightOptions) && product.weightOptions.length > 0) {
    return product.weightOptions.map((w) => ({
      weight: w.weight,
      serves: w.serves || undefined,
      price: Number(w.price),
      compareAtPrice: w.compareAtPrice
        ? Number(w.compareAtPrice)
        : Math.round(Number(w.price) * 1.18),
    }));
  }

  const baseP = Number(product.price) || 499;
  const baseC =
    product.compareAtPrice && product.compareAtPrice > baseP
      ? product.compareAtPrice
      : Math.round(baseP * 1.2);

  if (isMultiWeightCakeProduct(product)) {
    const unitLabel = getProductUnitLabel(product);
    const firstWeight =
      /^\d+(?:\.\d+)?\s*(?:g|gm|kg)$/i.test(unitLabel) ? unitLabel : "500g";

    if (firstWeight.toLowerCase().replace(/\s+/g, "") === "1kg") {
      return [
        { weight: "1kg", serves: "8-12 Servings", price: baseP, compareAtPrice: baseC },
        { weight: "1.5kg", serves: "12-16 Servings", price: Math.round(baseP * 1.45), compareAtPrice: Math.round(baseC * 1.45) },
        { weight: "2kg", serves: "16-20 Servings", price: Math.round(baseP * 1.85), compareAtPrice: Math.round(baseC * 1.85) },
      ];
    }

    return [
      { weight: "500g", serves: "4-6 Servings", price: baseP, compareAtPrice: baseC },
      { weight: "1kg", serves: "8-12 Servings", price: Math.round(baseP * 1.8), compareAtPrice: Math.round(baseC * 1.8) },
      { weight: "2kg", serves: "16-20 Servings", price: Math.round(baseP * 3.4), compareAtPrice: Math.round(baseC * 3.4) },
    ];
  }

  const unitLabel = getProductUnitLabel(product);
  return [
    {
      weight: unitLabel,
      serves: undefined,
      price: baseP,
      compareAtPrice: baseC,
    },
  ];
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

  const unitLabel = getProductUnitLabel({
    ...d,
    productType: "DECORATION",
  });

  const mainImg =
    d.image ||
    (Array.isArray(d.images) && d.images.length > 0 ? d.images[0] : "") ||
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80";

  const rawImages = Array.isArray(d.images) ? d.images.filter(Boolean) : [];
  const allImgs = Array.from(new Set([mainImg, ...rawImages].filter(Boolean)));

  const resolvedWeightOptions =
    Array.isArray(d.weightOptions) && d.weightOptions.length > 0
      ? d.weightOptions.map((w) => ({
          weight: w.weight || unitLabel,
          serves: w.serves || catName,
          price: Number(w.price) || d.price,
          compareAtPrice: w.compareAtPrice ? Number(w.compareAtPrice) : d.originalPrice,
        }))
      : [
          {
            weight: unitLabel,
            serves: catName,
            price: d.price,
            compareAtPrice: d.originalPrice,
          },
        ];

  const stockQty =
    typeof d.stockQuantity === "number"
      ? d.stockQuantity
      : d.inStock !== false
      ? 99
      : 0;

  return {
    id: d.id || d._id || `decor-${d.slug}`,
    name: d.name,
    ...(d.nameHi ? { nameHi: d.nameHi } : {}),
    slug: d.slug,
    description: d.description || "",
    ...(d.descriptionHi ? { descriptionHi: d.descriptionHi } : {}),
    shortDescription: d.description || "",
    ...(d.descriptionHi ? { shortDescriptionHi: d.descriptionHi } : {}),
    productType: "DECORATION",
    price: d.price,
    compareAtPrice: d.originalPrice,
    unit: unitLabel,
    weight: unitLabel,
    weightOptions: resolvedWeightOptions,
    sku: d.sku || `DEC-${d.slug || d.id}`,
    isEggless: d.isEggless !== false,
    isInstantAvailable: d.isInstantAvailable !== false,
    isAvailable: d.inStock !== false && stockQty > 0,
    isComingSoon: Boolean(d.isComingSoon),
    stockQuantity: stockQty,
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
    mainImage: mainImg,
    images: allImgs,
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
