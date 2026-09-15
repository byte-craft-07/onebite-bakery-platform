/**
 * CDN Image utilities to handle automatic format conversion (WebP/AVIF),
 * responsive scaling, and CDN optimization (Cloudinary / ImageKit / local).
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
}

/**
 * Transforms an image URL to use CDN-level resizing, WebP/AVIF auto-formatting,
 * and high-efficiency compression (Unsplash / Cloudinary / ImageKit).
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) {
    return '/placeholder-product.svg';
  }

  // Already a data URL, SVG or relative placeholder
  if (url.startsWith('data:') || url.endsWith('.svg')) {
    return url;
  }

  const { width = 400, height, quality = 75, format = 'auto' } = options;

  // 1. Unsplash optimization (parse and clean existing query params)
  if (url.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('q', quality.toString());
      if (width) urlObj.searchParams.set('w', width.toString());
      if (height) urlObj.searchParams.set('h', height.toString());
      return urlObj.toString();
    } catch {
      const base = url.split('?')[0];
      return `${base}?auto=format&fit=crop&w=${width}&q=${quality}${height ? `&h=${height}` : ''}`;
    }
  }

  // 2. Cloudinary optimization
  if (url.includes('res.cloudinary.com')) {
    const transformations: string[] = [`f_${format}`, `q_${quality}`];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`, 'c_fill');

    const transformString = transformations.join(',');
    return url.replace('/upload/', `/upload/${transformString}/`);
  }

  // 3. ImageKit optimization
  if (url.includes('ik.imagekit.io')) {
    const params: string[] = [`f-${format}`, `q-${quality}`];
    if (width) params.push(`w-${width}`);
    if (height) params.push(`h-${height}`);

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tr=${params.join(',')}`;
  }

  // 4. Local uploads from backend / static assets
  return url;
}

/**
 * Generates a responsive srcset string for high-DPI (Retina) and mobile displays.
 */
export function getResponsiveSrcSet(url: string, widths: number[] = [280, 400, 600, 800]): string {
  if (!url || url.startsWith('data:') || url.endsWith('.svg')) {
    return '';
  }

  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w, quality: 75 })} ${w}w`)
    .join(', ');
}
