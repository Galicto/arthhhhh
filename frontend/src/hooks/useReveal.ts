import { useRef, useEffect, useState, useCallback } from 'react';

interface RevealOptions {
  /** Delay in ms before the animation starts once visible */
  delay?: number;
  /** Threshold for IntersectionObserver (0-1) */
  threshold?: number;
  /** Only trigger once */
  once?: boolean;
}

/**
 * Returns a ref + boolean for triggering scroll-reveal animations.
 * Attach `ref` to the element, use `isVisible` to toggle CSS classes.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(opts?: RevealOptions) {
  const { delay = 0, threshold = 0.15, once = true } = opts ?? {};
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold, once]);

  return { ref, isVisible };
}

/**
 * Generates staggered reveal props for a list of items.
 * Returns an array of { ref, isVisible } for each index.
 */
export function useStaggerReveal<T extends HTMLElement = HTMLDivElement>(
  count: number,
  baseDelay = 0,
  staggerMs = 80,
) {
  const items = Array.from({ length: count }, (_, i) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useReveal<T>({ delay: baseDelay + i * staggerMs })
  );
  return items;
}

/** CSS class helper — returns reveal class based on visibility */
export function revealClass(isVisible: boolean, variant: 'up' | 'left' | 'right' | 'scale' | 'fade' = 'up') {
  const base = 'transition-all duration-700 ease-out';
  if (isVisible) return `${base} opacity-100 translate-y-0 translate-x-0 scale-100 blur-0`;

  switch (variant) {
    case 'up':    return `${base} opacity-0 translate-y-8`;
    case 'left':  return `${base} opacity-0 -translate-x-8`;
    case 'right': return `${base} opacity-0 translate-x-8`;
    case 'scale': return `${base} opacity-0 scale-95`;
    case 'fade':  return `${base} opacity-0`;
    default:      return `${base} opacity-0 translate-y-8`;
  }
}
