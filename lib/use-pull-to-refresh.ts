/**
 * Pull-to-Refresh Hook
 * 
 * Provides pull-to-refresh functionality for mobile devices
 * Usage: const { isPulling, pullDistance } = usePullToRefresh(onRefresh);
 */

"use client";

import { useEffect, useRef, useState } from "react";

interface PullToRefreshOptions {
  threshold?: number;
  maxPullDistance?: number;
  resistance?: number;
}

export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options: PullToRefreshOptions = {}
) {
  const {
    threshold = 80,
    maxPullDistance = 120,
    resistance = 2.5,
  } = options;

  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const touchStartY = useRef(0);
  const scrollY = useRef(0);

  useEffect(() => {
    let rafId: number | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY;
        scrollY.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY.current;

      // Only trigger if we're at the top of the page and pulling down
      if (window.scrollY === 0 && deltaY > 0) {
        // Cancel default scroll behavior
        e.preventDefault();

        const distance = Math.min(deltaY / resistance, maxPullDistance);

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setPullDistance(distance);
          setIsPulling(distance > threshold);
        });
      }
    };

    const handleTouchEnd = async () => {
      if (rafId) cancelAnimationFrame(rafId);

      if (isPulling && pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error("Refresh failed:", error);
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
      setIsPulling(false);
      touchStartY.current = 0;
    };

    // Only add listeners on mobile devices
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      document.addEventListener("touchstart", handleTouchStart, { passive: true });
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, maxPullDistance, resistance, onRefresh, isRefreshing]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
  };
}
