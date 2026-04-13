import { DietState } from "./types";

const STORAGE_KEY = "dietAppStateV2";

export function loadState(): DietState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DietState;
  } catch {
    return null;
  }
}

export function saveState(state: DietState) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}