/**
 * Scroll Memory Utility
 * Preserves scroll position when navigating back from article to feed
 */

const SCROLL_POSITION_KEY = 'morning_pulse_scroll_position';
const SCROLL_TIMESTAMP_KEY = 'morning_pulse_scroll_timestamp';
const SCROLL_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export const saveScrollPosition = (key: string = 'default'): void => {
  if (typeof window === 'undefined') return;
  
  const position = window.scrollY;
  const timestamp = Date.now();
  
  try {
    sessionStorage.setItem(`${SCROLL_POSITION_KEY}_${key}`, position.toString());
    sessionStorage.setItem(`${SCROLL_POSITION_KEY}_${key}_ts`, timestamp.toString());
  } catch (e) {
    // Silently fail if storage is unavailable
    console.warn('Could not save scroll position:', e);
  }
};

export const restoreScrollPosition = (key: string = 'default', immediate: boolean = false): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const positionStr = sessionStorage.getItem(`${SCROLL_POSITION_KEY}_${key}`);
    const timestampStr = sessionStorage.getItem(`${SCROLL_POSITION_KEY}_${key}_ts`);
    
    if (!positionStr || !timestampStr) return;
    
    const position = parseInt(positionStr, 10);
    const timestamp = parseInt(timestampStr, 10);
    
    // Check if position is still valid (not expired)
    if (Date.now() - timestamp > SCROLL_EXPIRY_MS) {
      clearScrollPosition(key);
      return;
    }
    
    if (immediate) {
      window.scrollTo(0, position);
    } else {
      // Smooth scroll after a brief delay to allow page render
      setTimeout(() => {
        window.scrollTo({
          top: position,
          behavior: 'smooth',
        });
      }, 100);
    }
  } catch (e) {
    console.warn('Could not restore scroll position:', e);
  }
};

export const clearScrollPosition = (key: string = 'default'): void => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(`${SCROLL_POSITION_KEY}_${key}`);
    sessionStorage.removeItem(`${SCROLL_POSITION_KEY}_${key}_ts`);
  } catch (e) {
    console.warn('Could not clear scroll position:', e);
  }
};

export const setupScrollMemory = (
  saveKey: string,
  restoreKey: string,
  onNavigateAway?: () => void,
  onNavigateBack?: () => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const handleBeforeUnload = () => {
    saveScrollPosition(saveKey);
  };
  
  const handlePopState = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
    restoreScrollPosition(restoreKey);
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('popstate', handlePopState);
  
  // Save on hash change (navigating away)
  const originalHashChange = window.onhashchange;
  window.onhashchange = (e) => {
    if (onNavigateAway) {
      onNavigateAway();
    }
    saveScrollPosition(saveKey);
    if (originalHashChange) {
      originalHashChange.call(window, e);
    }
  };
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('popstate', handlePopState);
  };
};
