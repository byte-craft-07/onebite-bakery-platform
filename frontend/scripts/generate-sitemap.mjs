import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://onebite-bakery-platform.vercel.app";
const API_URL = process.env.VITE_API_BASE_URL || "https://onebite-bakery-platform.onrender.com/api/v1";

const staticPages = [
  { url: "/", priority: 1.0, changefreq: "daily" },
  { url: "/products", priority: 0.9, changefreq: "daily" },
  { url: "/categories", priority: 0.8, changefreq: "weekly" },
  { url: "/custom-cake", priority: 0.9, changefreq: "weekly" },
  { url: "/combos", priority: 0.85, changefreq: "weekly" },
  { url: "/decorations", priority: 0.8, changefreq: "weekly" },
  { url: "/occasions", priority: 0.75, changefreq: "weekly" },
  { url: "/offers", priority: 0.75, changefreq: "weekly" },
  { url: "/about", priority: 0.6, changefreq: "monthly" },
  { url: "/contact", priority: 0.7, changefreq: "monthly" },
  { url: "/business", priority: 0.6, changefreq: "monthly" },
];

const fallbackCategories = [
  "artisanal-cakes",
  "pastries-tarts",
  "fresh-breads",
  "cookies-biscuits",
  "combos-hampers",
];

const fallbackOccasions = [
  "birthdays",
  "anniversaries",
  "weddings",
  "festivals",
];

const fallbackProducts = [
  "belgian-dark-chocolate-truffle-cake",
  "classic-red-velvet-cream-cheese-cake",
  "fresh-blueberry-cheesecake-tart",
  "almond-croissant-butter-brioche",
  "dutch-choco-lava-molten-cake",
  "artisanal-multigrain-sourdough-loaf",
  "red-velvet-cream-cheese-pastry",
  "fresh-sourdough-whole-wheat-bread",
  "deluxe-party-celebration-box",
  "sweet-morning-breakfast-hamper",
  "golden-metallic-happy-birthday-candle-set",
  "pastel-balloon-arch-decoration-set",
  "acrylic-custom-name-cake-topper",
  "confetti-party-popper-streamer-pack",
];

async function generateSitemap() {
  const today = new Date().toISOString().split("T")[0];
  let categories = [...fallbackCategories];
  let products = [...fallbackProducts];

  try {
    const catRes = await fetch(`${API_URL}/categories`, { signal: AbortSignal.timeout(4000) });
    if (catRes.ok) {
      const data = await catRes.json();
      const list = data?.data?.categories || data?.data?.items || data?.data;
      if (Array.isArray(list) && list.length > 0) {
        categories = list.map((c) => c.slug).filter(Boolean);
      }
    }
  } catch (_e) {
    // Keep fallback categories
  }

  try {
    const prodRes = await fetch(`${API_URL}/products?limit=100`, { signal: AbortSignal.timeout(4000) });
    if (prodRes.ok) {
      const data = await prodRes.json();
      const list = data?.data?.products || data?.data?.items || data?.data;
      if (Array.isArray(list) && list.length > 0) {
        products = list.map((p) => p.slug).filter(Boolean);
      }
    }
  } catch (_e) {
    // Keep fallback products
  }

  const entries = [];

  for (const page of staticPages) {
    entries.push(`  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  for (const catSlug of categories) {
    entries.push(`  <url>
    <loc>${BASE_URL}/categories/${catSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  for (const occSlug of fallbackOccasions) {
    entries.push(`  <url>
    <loc>${BASE_URL}/occasions/${occSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>`);
  }

  for (const prodSlug of products) {
    entries.push(`  <url>
    <loc>${BASE_URL}/products/${prodSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

  const outputPath = path.resolve(__dirname, "../public/sitemap.xml");
  fs.writeFileSync(outputPath, xml, "utf-8");
  console.log(`[Sitemap] Successfully wrote ${entries.length} URLs to ${outputPath}`);
}

generateSitemap();
