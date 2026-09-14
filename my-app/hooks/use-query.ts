"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { getErrorMessage } from "@/lib/utils";

type State<T> = { key: string | null; data: T | undefined; error: string };

/**
 * Loads data for a key and reloads whenever the key changes.
 *
 * - Pass `null` as the key to skip loading (e.g. until a class is selected).
 * - `loading` is true only while data for the *current* key hasn't arrived,
 *   so `reload()` refreshes in the background without flashing a loading state.
 * - Responses for an outdated key are ignored, so fast filter changes can't show stale data.
 */
export function useQuery<T>(key: string | null, fetcher: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({ key: null, data: undefined, error: "" });
  const [version, setVersion] = useState(0);
  const load = useEffectEvent(fetcher);

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setState({ key, data, error: "" });
      })
      .catch((err) => {
        if (!cancelled) setState({ key, data: undefined, error: getErrorMessage(err, "Failed to load data") });
      });
    return () => {
      cancelled = true;
    };
  }, [key, version]);

  const isCurrent = key !== null && state.key === key;

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback(
    (update: (prev: T | undefined) => T | undefined) => setState((s) => ({ ...s, data: update(s.data) })),
    []
  );

  return {
    data: isCurrent ? state.data : undefined,
    error: isCurrent ? state.error : "",
    loading: key !== null && !isCurrent,
    reload,
    setData,
  };
}
