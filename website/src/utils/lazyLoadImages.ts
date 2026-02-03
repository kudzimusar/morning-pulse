/**
 * Lazy Loading Utility for Mobile Images
 * Implements intersection observer for efficient image loading
 * Supports both <img> elements and divs with background images
 */

export const lazyLoadImage = (
  element: HTMLElement,
  onLoad?: () => void
): IntersectionObserver | null => {
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without IntersectionObserver - load immediately
    if (onLoad) {
      onLoad();
    }
    return null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (onLoad) {
            onLoad();
          }
          observer.unobserve(element);
        }
      });
    },
    {
      rootMargin: '50px', // Start loading 50px before element enters viewport
    }
  );

  observer.observe(element);

  return observer;
};

export const initLazyLoading = (container?: HTMLElement): () => void => {
  const targetContainer = container || document;
  const images = targetContainer.querySelectorAll<HTMLImageElement>(
    'img[data-src].mobile-image-lazy'
  );

  const cleanupFunctions: (() => void)[] = [];

  images.forEach((img) => {
    const cleanup = lazyLoadImage(img);
    cleanupFunctions.push(cleanup);
  });

  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
};
