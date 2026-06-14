/**
 * Swipe Gesture Hook
 *
 * Detects swipe gestures (left/right/up/down) on touch devices
 * Usage: const swipeHandlers = useSwipeGesture({ onSwipeLeft, onSwipeRight });
 */

"use client";

import { useRef, useEffect } from "react";

export type SwipeDirection = "left" | "right" | "up" | "down";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultTouchMove?: boolean;
}

export function useSwipeGesture(options: SwipeGestureOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchMove = false,
  } = options;

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.changedTouches[0].screenX;
      touchStartY.current = e.changedTouches[0].screenY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchMove) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].screenX;
      touchEndY.current = e.changedTouches[0].screenY;
      handleSwipe();
    };

    const handleSwipe = () => {
      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = touchEndY.current - touchStartY.current;

      // Check if horizontal swipe is more prominent
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            // Swipe right
            onSwipeRight?.();
          } else {
            // Swipe left
            onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe is more prominent
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0) {
            // Swipe down
            onSwipeDown?.();
          } else {
            // Swipe up
            onSwipeUp?.();
          }
        }
      }
    };

    // Only add listeners on mobile devices
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      document.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      document.addEventListener("touchmove", handleTouchMove, {
        passive: !preventDefaultTouchMove,
      });
      document.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold,
    preventDefaultTouchMove,
  ]);

  return {
    touchStartX: touchStartX.current,
    touchStartY: touchStartY.current,
    touchEndX: touchEndX.current,
    touchEndY: touchEndY.current,
  };
}
