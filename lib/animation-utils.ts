/**
 * Animation Utilities
 *
 * Production-grade animation patterns following 2024 UX best practices.
 * All animations use performance-optimized properties (transform, opacity).
 *
 * @module lib/animation-utils
 */

/**
 * Animation duration constants (in milliseconds)
 * Based on Material Design 3 and modern UX guidelines
 */
export const ANIMATION_DURATION = {
  /** Quick micro-interactions (hover, focus) */
  fast: 150,
  /** Standard UI transitions (modals, dropdowns) */
  normal: 200,
  /** Page transitions and complex animations */
  slow: 300,
  /** Loading states and skeleton screens */
  pulse: 1500,
} as const;

/**
 * Easing function constants
 * Using cubic-bezier for smooth, natural motion
 */
export const ANIMATION_EASING = {
  /** Standard ease-in-out for most transitions */
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  /** Accelerated start for exit animations */
  accelerate: "cubic-bezier(0.4, 0, 1, 1)",
  /** Decelerated end for enter animations */
  decelerate: "cubic-bezier(0, 0, 0.2, 1)",
  /** Spring-like bounce for playful interactions */
  spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

/**
 * CSS class names for common animation patterns
 * Use these directly in className props
 */
export const ANIMATION_CLASSES = {
  /** Fade in from transparent to visible */
  fadeIn: "animate-fadeIn",
  /** Fade in with slight scale effect */
  fadeInScale: "animate-fadeInScale",
  /** Slide up from bottom */
  slideUp: "animate-slideUp",
  /** Shimmer loading effect */
  shimmer: "animate-shimmer",
  /** Continuous spin (for loaders) */
  spin: "animate-spin",
  /** Subtle pulse (for notifications) */
  pulse: "animate-pulse",
  /** Gold pulse for premium elements */
  pulseGold: "animate-pulse-gold",
  /** Blue pulse for highlights */
  pulseBlue: "animate-pulse-blue",
} as const;

/**
 * Utility function to get animation class with optional inline styles for timing
 *
 * @example
 * ```tsx
 * const { className, style } = getAnimationClass("fadeIn", { delay: 100 });
 * <div className={className} style={style}>Content</div>
 * ```
 */
export function getAnimationClass(
  animation: keyof typeof ANIMATION_CLASSES,
  options?: {
    delay?: number;
    duration?: number;
  },
): { className: string; style?: React.CSSProperties } {
  const className = ANIMATION_CLASSES[animation];
  const style: React.CSSProperties = {};

  if (options?.delay) {
    style.animationDelay = `${options.delay}ms`;
  }

  if (options?.duration) {
    style.animationDuration = `${options.duration}ms`;
  }

  return {
    className,
    style: Object.keys(style).length > 0 ? style : undefined,
  };
}

/**
 * Hook for staggered animations in lists
 * Returns a delay value based on the item's index
 *
 * @example
 * ```tsx
 * items.map((item, index) => (
 *   <div
 *     key={item.id}
 *     className="animate-fadeIn"
 *     style={{ animationDelay: `${getStaggerDelay(index, 50)}ms` }}
 *   >
 *     {item.content}
 *   </div>
 * ))
 * ```
 */
export function getStaggerDelay(index: number, baseDelay = 50): number {
  return index * baseDelay;
}

/**
 * Performance monitoring for animations
 * Helps identify animation bottlenecks in development
 */
export function measureAnimationPerformance(name: string) {
  if (process.env.NODE_ENV === "development") {
    return {
      start: () => performance.mark(`${name}-start`),
      end: () => {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name)[0];
        console.log(
          `Animation "${name}" took ${measure.duration.toFixed(2)}ms`,
        );
      },
    };
  }
  return {
    start: () => {},
    end: () => {},
  };
}

/**
 * Reduced motion detection
 * Respects user's accessibility preferences
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Conditional animation utility
 * Returns animation class only if user hasn't enabled reduced motion
 */
export function animateIf(animationClass: string, fallbackClass = ""): string {
  return prefersReducedMotion() ? fallbackClass : animationClass;
}
