/**
 * Lazy Loading Utility for Mobile Images
 * Implements intersection observer for efficient image loading
 */

export const lazyLoadImage = (imgElement: HTMLImageElement): () => void => {
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without IntersectionObserver
    imgElement.src = imgElement.dataset.src || '';
    imgElement.classList.add('loaded');
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.classList.add('loaded');
            img.classList.remove('mobile-image-lazy');
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: '50px', // Start loading 50px before image enters viewport
    }
  );

  observer.observe(imgElement);

  return () => {
    observer.unobserve(imgElement);
  };
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
