import React, { useEffect, useMemo } from "react";
import { SITE_CONFIG } from "./seo.constants";
import type { SEOProps } from "./seo.types";
import { buildBreadcrumbSchema, normalizeCanonicalUrl } from "./seo.utils";

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description = SITE_CONFIG.defaultDescription,
  canonicalPath,
  canonicalUrl,
  ogType = "website",
  ogImage = SITE_CONFIG.defaultImage,
  ogImageAlt,
  twitterCard = "summary_large_image",
  noindex = false,
  nofollow = false,
  breadcrumbs,
  structuredData,
}) => {
  // Format formatted document title
  const fullTitle = useMemo(() => {
    if (!title) return SITE_CONFIG.defaultTitle;
    if (title.toLowerCase().includes("onebite bakery") || title.toLowerCase().includes("onebite")) {
      return title;
    }
    return `${title} | ${SITE_CONFIG.name}`;
  }, [title]);

  // Determine canonical URL
  const resolvedCanonicalUrl = useMemo(() => {
    if (canonicalUrl) return normalizeCanonicalUrl(canonicalUrl);
    if (canonicalPath) return normalizeCanonicalUrl(canonicalPath);
    return normalizeCanonicalUrl();
  }, [canonicalUrl, canonicalPath]);

  // Ensure absolute image URL
  const fullOgImage = useMemo(() => {
    if (!ogImage) return SITE_CONFIG.defaultImage;
    if (ogImage.startsWith("http://") || ogImage.startsWith("https://")) {
      return ogImage;
    }
    return `${SITE_CONFIG.domain}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`;
  }, [ogImage]);

  // Robots directive
  const robotsContent = useMemo(() => {
    if (noindex) {
      return nofollow ? "noindex, nofollow" : "noindex, follow";
    }
    return "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  }, [noindex, nofollow]);

  // Combine structured data
  const finalStructuredData = useMemo(() => {
    const list: any[] = [];
    if (breadcrumbs && breadcrumbs.length > 0) {
      list.push(buildBreadcrumbSchema(breadcrumbs));
    }
    if (structuredData) {
      if (Array.isArray(structuredData)) {
        list.push(...structuredData);
      } else {
        list.push(structuredData);
      }
    }
    return list;
  }, [breadcrumbs, structuredData]);

  // Imperative DOM fallback for dynamic client transitions and testing
  useEffect(() => {
    if (typeof document === "undefined") return;

    // 1. Update Title
    document.title = fullTitle;

    // Helper for <meta> tags
    const setMetaTag = (attribute: "name" | "property", value: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, value);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Helper for <link> tags
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // 2. Standard Meta Tags
    setMetaTag("name", "description", description);
    setMetaTag("name", "robots", robotsContent);

    // 3. Canonical Tag
    if (!noindex) {
      setLinkTag("canonical", resolvedCanonicalUrl);
    } else {
      const canonicalTag = document.querySelector('link[rel="canonical"]');
      if (canonicalTag) canonicalTag.remove();
    }

    // 4. Open Graph Tags
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", resolvedCanonicalUrl);
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:image", fullOgImage);
    setMetaTag("property", "og:site_name", SITE_CONFIG.name);
    setMetaTag("property", "og:locale", "en_IN");
    if (ogImageAlt || title) {
      setMetaTag("property", "og:image:alt", ogImageAlt || fullTitle);
    }

    // 5. Twitter Card Tags
    setMetaTag("name", "twitter:card", twitterCard);
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", fullOgImage);
    if (ogImageAlt || title) {
      setMetaTag("name", "twitter:image:alt", ogImageAlt || fullTitle);
    }

    // 6. JSON-LD Scripts
    const SCRIPT_ID = "onebite-seo-ldjson";
    let scriptTag = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (finalStructuredData.length > 0) {
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.id = SCRIPT_ID;
        scriptTag.type = "application/ld+json";
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(
        finalStructuredData.length === 1 ? finalStructuredData[0] : finalStructuredData,
        null,
        2
      );
    } else if (scriptTag) {
      scriptTag.remove();
    }

    return () => {
      // Optional cleanup on component unmount
    };
  }, [fullTitle, description, resolvedCanonicalUrl, robotsContent, noindex, ogType, fullOgImage, ogImageAlt, twitterCard, finalStructuredData]);

  return (
    <>
      {/* React 19 Document Metadata Hoisting */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent} />
      {!noindex && <link rel="canonical" href={resolvedCanonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={resolvedCanonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content={SITE_CONFIG.name} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:image:alt" content={ogImageAlt || fullTitle} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      <meta name="twitter:image:alt" content={ogImageAlt || fullTitle} />

      {/* Structured Data Script Tag */}
      {finalStructuredData.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              finalStructuredData.length === 1 ? finalStructuredData[0] : finalStructuredData
            ),
          }}
        />
      )}
    </>
  );
};
