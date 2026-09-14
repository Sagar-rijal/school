"use client";

import { useRouter } from "next/navigation";

/**
 * Keeps list filters in the URL (?year=...&class=...) so a refresh or shared link
 * shows the same view. Empty values are removed from the URL.
 */
export function useUrlFilters<T extends Record<string, string | undefined>>(path: string, current: T) {
  const router = useRouter();

  return (changes: Partial<T>) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...current, ...changes })) {
      if (value) qs.set(key, value);
    }
    const query = qs.toString();
    router.replace(query ? `${path}?${query}` : path);
  };
}
