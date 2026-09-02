import React, { useState } from 'react';
import { getOptimizedImageUrl, getResponsiveSrcSet, type ImageOptimizationOptions } from '@/utils/cdn.utils';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  optimizationOptions?: ImageOptimizationOptions;
  responsiveWidths?: number[];
  containerClassName?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
  optimizationOptions,
  responsiveWidths,
  className = '',
  containerClassName = '',
  loading = 'lazy',
  decoding = 'async',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = getOptimizedImageUrl(hasError ? fallbackSrc : src, optimizationOptions);
  const srcSet = responsiveWidths ? getResponsiveSrcSet(src, responsiveWidths) : undefined;

  return (
    <div className={`relative overflow-hidden bg-neutral-100 dark:bg-neutral-800 ${containerClassName}`}>
      {/* Smooth Skeleton Placeholder before image is loaded */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200/70 dark:bg-neutral-700/50" />
      )}

      <img
        src={optimizedSrc}
        srcSet={srcSet}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
