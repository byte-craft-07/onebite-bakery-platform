import { buildProductShareUrl } from "./buildProductShareUrl";

export interface ShareableProductInfo {
  id?: string;
  name: string;
  slug?: string;
  price?: number;
  description?: string;
  productType?: string;
  categoryName?: string;
  mainImage?: string;
}

export interface ShareMessageBundle {
  title: string;
  text: string;
  fullMessage: string;
  url: string;
  priceText?: string;
}

/**
 * Builds formatted product share messages dynamically
 */
export function buildShareMessage(
  product: ShareableProductInfo,
  customBaseUrl?: string,
): ShareMessageBundle {
  const slugOrId = product.slug || product.id || product.name;
  const productUrl = buildProductShareUrl(slugOrId, customBaseUrl);
  const name = product.name?.trim() || "Delicious Bakery Treat";
  const price = typeof product.price === "number" ? `₹${product.price}` : undefined;
  const type = product.productType?.toUpperCase() || "";
  const cat = product.categoryName?.toLowerCase() || "";

  let emoji = "🍰";
  let leadText = `Check out this delicious ${name} from Onebite Bakery!`;

  if (type === "CUSTOM_CAKE" || cat.includes("custom") || cat.includes("birthday")) {
    emoji = "🎂";
    leadText = `Looking for a handcrafted celebration cake? Check out "${name}" from Onebite Bakery!`;
  } else if (type === "COMBO" || cat.includes("combo") || cat.includes("party")) {
    emoji = "🎉";
    leadText = `This "${name}" celebration combo from Onebite Bakery looks perfect for our special party!`;
  } else if (cat.includes("pastr") || cat.includes("dessert") || cat.includes("tart")) {
    emoji = "🧁";
    leadText = `Check out this freshly baked ${name} from Onebite Bakery!`;
  }

  // Multi-line full message suitable for WhatsApp / Telegram / Clipboard
  const messageLines: string[] = [
    `${emoji} ${leadText}`,
  ];

  if (price) {
    messageLines.push(`Price: ${price}`);
  }

  messageLines.push(`Order fresh online here:\n${productUrl}`);

  const fullMessage = messageLines.join("\n\n");

  return {
    title: `Onebite Bakery — ${name}`,
    text: `Check out this delicious ${name} from Onebite Bakery 🍰`,
    fullMessage,
    url: productUrl,
    priceText: price,
  };
}
