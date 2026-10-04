export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface SEOProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: "summary" | "summary_large_image";
  noindex?: boolean;
  nofollow?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}
