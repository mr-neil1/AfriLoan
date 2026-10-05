"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface CacheWrapper<T> {
  data: T;
  timestamp: number;
  version: string;
}

const CACHE_VERSION = "v1.2";
const DEFAULT_TTL_MS = 1000 * 60 * 30; // 30 minutes default TTL for stale-while-revalidate

/**
 * Safely read cached data from localStorage
 */
export function getCachedData<T>(key: string, maxAgeMs: number = DEFAULT_TTL_MS): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`afriloan_cache_${key}`);
    if (!raw) return null;

    const parsed: CacheWrapper<T> = JSON.parse(raw);
    if (!parsed || parsed.version !== CACHE_VERSION) {
      localStorage.removeItem(`afriloan_cache_${key}`);
      return null;
    }

    // Return data even if stale (for SWR pattern), but if expired beyond 24h, discard
    const isExpired = Date.now() - parsed.timestamp > Math.max(maxAgeMs, 1000 * 60 * 60 * 24);
    if (isExpired) {
      localStorage.removeItem(`afriloan_cache_${key}`);
      return null;
    }

    return parsed.data;
  } catch (e) {
    return null;
  }
}

/**
 * Safely write data to localStorage cache
 */
export function setCachedData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const wrapper: CacheWrapper<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION
    };
    localStorage.setItem(`afriloan_cache_${key}`, JSON.stringify(wrapper));
  } catch (e) {
    // Quota exceeded: clean older afriloan cache items
    try {
      clearExpiredCaches();
    } catch (_) {
      // ignore
    }
  }
}

/**
 * Remove a specific cache key
 */
export function removeCachedData(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`afriloan_cache_${key}`);
  } catch (e) {
    // ignore
  }
}

/**
 * Invalidate all cache keys matching a prefix or all afriloan caches
 */
export function invalidateCachePattern(prefix?: string): void {
  if (typeof window === "undefined") return;
  try {
    const fullPrefix = prefix ? `afriloan_cache_${prefix}` : `afriloan_cache_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(fullPrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    // ignore
  }
}

/**
 * Clean up older caches if quota is high
 */
function clearExpiredCaches(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("afriloan_cache_")) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (now - parsed.timestamp > 1000 * 60 * 60 * 12) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        localStorage.removeItem(key);
      }
    }
  }
}

/**
 * Custom React Hook for Stale-While-Revalidate caching with background sync
 * 
 * - Instantly displays cached data on mount (0ms delay!)
 * - Fetches fresh data from API in the background
 * - Updates state and cache seamlessly
 * - Preserves cached data on transient network errors
 */
export function useSwrLocalCache<T>({
  cacheKey,
  fetcher,
  enabled = true,
  ttlMs = DEFAULT_TTL_MS,
  onSuccess
}: {
  cacheKey: string;
  fetcher: () => Promise<T>;
  enabled?: boolean;
  ttlMs?: number;
  onSuccess?: (data: T) => void;
}) {
  const [data, setData] = useState<T | null>(() => {
    if (!enabled) return null;
    return getCachedData<T>(cacheKey, ttlMs);
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!enabled) return false;
    const initial = getCachedData<T>(cacheKey, ttlMs);
    return initial === null;
  });

  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const revalidate = useCallback(async (silent = false) => {
    if (!enabled) return;
    if (!silent && !data) {
      setIsLoading(true);
    }
    setIsRevalidating(true);
    setError(null);

    try {
      const freshData = await fetcherRef.current();
      setData(freshData);
      setCachedData(cacheKey, freshData);
      setLastUpdated(new Date());
      if (onSuccessRef.current) {
        onSuccessRef.current(freshData);
      }
    } catch (err: any) {
      console.warn(`[SWR Cache] Background revalidation failed for ${cacheKey}:`, err);
      // Only set UI error if there is NO existing data in cache
      if (!data) {
        setError(err?.message || "Erreur de chargement des données");
      }
    } finally {
      setIsLoading(false);
      setIsRevalidating(false);
    }
  }, [cacheKey, enabled, data]);

  // Initial load: check cache, then trigger background revalidation
  useEffect(() => {
    if (!enabled) return;

    // Check if cache has value
    const cached = getCachedData<T>(cacheKey, ttlMs);
    if (cached !== null) {
      setData(cached);
      setIsLoading(false);
    }

    // Always revalidate with fresh DB data in background
    revalidate(cached !== null);
  }, [cacheKey, enabled]);

  // Manual mutate function to immediately update UI and cache
  const mutate = useCallback((newData: T | ((prev: T | null) => T), shouldRevalidate = true) => {
    setData((prev) => {
      const updated = typeof newData === "function" ? (newData as any)(prev) : newData;
      setCachedData(cacheKey, updated);
      return updated;
    });

    if (shouldRevalidate) {
      revalidate(true);
    }
  }, [cacheKey, revalidate]);

  return {
    data,
    isLoading,
    isRevalidating,
    error,
    lastUpdated,
    mutate,
    refresh: () => revalidate(false)
  };
}
