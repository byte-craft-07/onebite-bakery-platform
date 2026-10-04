import { SITE_CONFIG } from "./seo.constants";
import type { BreadcrumbItem, FAQItem } from "./seo.types";

/**
 * Normalizes any relative or absolute URL to a canonical production URL.
 * Strips social tracking parameters (utm_*, fbclid, gclid, etc.), strips trailing slashes,
 * and normalizes casing to prevent duplicate indexing penalties.
 */
export function normalizeCanonicalUrl(input?: string): string {
  if (!input) {
    if (typeof window !== "undefined") {
      input = window.location.pathname;
    } else {
      return SITE_CONFIG.domain;
    }
  }

  let pathname = "";
  try {
    if (input.startsWith("http://") || input.startsWith("https://")) {
      const parsed = new URL(input);
      pathname = parsed.pathname;
    } else {
      pathname = input.split("?")[0].split("#")[0];
    }
  } catch {
    pathname = "/";
  }

  // Ensure leading slash
  if (!pathname.startsWith("/")) {
    pathname = "/" + pathname;
  }

  // Remove trailing slash unless it's root '/'
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  // Lowercase standard routes
  pathname = pathname.toLowerCase();

  return `${SITE_CONFIG.domain}${pathname}`;
}

/**
 * Generates valid Schema.org LocalBusiness / Bakery structured data using genuine business information.
 */
export function buildLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": `${SITE_CONFIG.domain}/#bakery`,
    "name": SITE_CONFIG.name,
    "legalName": SITE_CONFIG.legalName,
    "url": SITE_CONFIG.domain,
    "logo": SITE_CONFIG.logoUrl,
    "image": [
      SITE_CONFIG.defaultImage,
      SITE_CONFIG.logoUrl,
    ],
    "description": SITE_CONFIG.defaultDescription,
    "telephone": SITE_CONFIG.contact.telephone,
    "email": SITE_CONFIG.contact.email,
    "priceRange": SITE_CONFIG.contact.priceRange,
    "servesCuisine": SITE_CONFIG.contact.servesCuisine,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": SITE_CONFIG.contact.address.streetAddress,
      "addressLocality": SITE_CONFIG.contact.address.addressLocality,
      "addressRegion": SITE_CONFIG.contact.address.addressRegion,
      "postalCode": SITE_CONFIG.contact.address.postalCode,
      "addressCountry": SITE_CONFIG.contact.address.addressCountry,
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": SITE_CONFIG.contact.geo.latitude,
      "longitude": SITE_CONFIG.contact.geo.longitude,
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        "opens": "08:00",
        "closes": "22:00",
      },
    ],
    "hasMap": `https://maps.google.com/?q=${SITE_CONFIG.contact.geo.latitude},${SITE_CONFIG.contact.geo.longitude}`,
    "sameAs": [
      SITE_CONFIG.social.facebook,
      SITE_CONFIG.social.instagram,
    ],
    "currenciesAccepted": "INR",
    "paymentAccepted": "Cash, Credit Card, Debit Card, UPI, Net Banking",
  };
}

/**
 * Generates valid Schema.org Product structured data.
 * Reviews and ratings are only included if genuine numbers exist in the database.
 */
export function buildProductSchema(product: {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  mainImage?: string;
  images?: string[];
  isAvailable?: boolean;
  stockQuantity?: number;
  rating?: number;
  reviewCount?: number;
  sku?: string;
}) {
  const productUrl = `${SITE_CONFIG.domain}/products/${product.slug || product.id}`;
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.mainImage
    ? [product.mainImage]
    : [SITE_CONFIG.defaultImage];

  const inStock = product.isAvailable !== false && (product.stockQuantity === undefined || product.stockQuantity > 0);

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    "name": product.name,
    "description": product.description || `Order ${product.name} freshly baked online from OneBite Bakery.`,
    "image": images,
    "sku": product.sku || `OB-${(product.slug || product.id).toUpperCase().slice(0, 10)}`,
    "brand": {
      "@type": "Brand",
      "name": SITE_CONFIG.name,
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "INR",
      "price": product.price,
      "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Bakery",
        "name": SITE_CONFIG.name,
      },
    },
  };

  // Only include genuine ratings if available and valid
  if (product.rating && product.rating > 0 && product.reviewCount && product.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": Number(product.rating).toFixed(1),
      "reviewCount": Math.max(1, product.reviewCount),
      "bestRating": "5",
      "worstRating": "1",
    };
  }

  return schema;
}

/**
 * Generates BreadcrumbList structured data for rich breadcrumb trail navigation in Google SERPs.
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  const elements: Array<{
    "@type": string;
    position: number;
    name: string;
    item: string;
  }> = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": SITE_CONFIG.domain,
    },
  ];

  items.forEach((item, index) => {
    elements.push({
      "@type": "ListItem",
      "position": index + 2,
      "name": item.name,
      "item": item.url.startsWith("http") ? item.url : `${SITE_CONFIG.domain}${item.url}`,
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": elements,
  };
}

/**
 * Generates FAQPage schema for pages containing visible customer questions and answers.
 */
export function buildFAQSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}

/**
 * Generates ItemList schema for category and collection landing pages.
 */
export function buildCollectionSchema(
  collectionName: string,
  collectionDescription: string,
  items: Array<{ name: string; url: string; image?: string; price?: number }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": collectionName,
    "description": collectionDescription,
    "url": `${SITE_CONFIG.domain}/categories`,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": items.slice(0, 24).map((item, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": item.name,
        "url": item.url.startsWith("http") ? item.url : `${SITE_CONFIG.domain}${item.url}`,
        ...(item.image ? { "image": item.image } : {}),
      })),
    },
  };
}
