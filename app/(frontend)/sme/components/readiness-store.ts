"use client";

import { useSyncExternalStore } from "react";

/* The readiness check and the application form are separate islands on the
   page. When a visitor finishes the check and then applies, the form sends the
   score along so sales sees it on the lead. Kept in memory only: a reload
   clears it, which is right — the answers are not stored anywhere either. */

export type ReadinessResult = { score: number; level: string };

let current: ReadinessResult | null = null;
const listeners = new Set<() => void>();

export function setReadinessResult(result: ReadinessResult | null) {
  current = result;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useReadinessResult(): ReadinessResult | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
