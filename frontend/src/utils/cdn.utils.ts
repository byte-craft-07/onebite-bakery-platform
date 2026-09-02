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
 * Transforms an image URL to use CDN-level resizing and auto-format (WebP/AVIF)
 * if using Cloudinary, ImageKit, or custom CDN.
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

  const { width, height, quality = 80, format = 'auto' } = options;

  // 1. Cloudinary optimization
  if (url.includes('res.cloudinary.com')) {
    const transformations: string[] = [`f_${format}`, `q_${quality}`];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`, 'c_fill');

    const transformString = transformations.join(',');
    return url.replace('/upload/', `/upload/${transformString}/`);
  }

  // 2. ImageKit optimization
  if (url.includes('ik.imagekit.io')) {
    const params: string[] = [`f-${format}`, `q-${quality}`];
    if (width) params.push(`w-${width}`);
    if (height) params.push(`h-${height}`);

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tr=${params.join(',')}`;
  }

  // 3. Unsplash optimization
  if (url.includes('images.unsplash.com')) {
    const separator = url.includes('?') ? '&' : '?';
    const params = new URLSearchParams();
    params.set('auto', 'format');
    params.set('fit', 'crop');
    params.set('q', quality.toString());
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());

    return `${url}${separator}${params.toString()}`;
  }

  // 4. Local uploads from backend / static assets
  return url;
}

/**
 * Generates a responsive srcset string for high-DPI (Retina) and mobile displays.
 */
export function getResponsiveSrcSet(url: string, widths: number[] = [320, 640, 960, 1200]): string {
  if (!url || url.startsWith('data:') || url.endsWith('.svg')) {
    return '';
  }

  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}
