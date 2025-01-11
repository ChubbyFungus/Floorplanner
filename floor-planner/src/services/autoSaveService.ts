import { RootState } from "../store";

const STORAGE_KEY = "floor_planner_autosave";

export function saveState(state: RootState) {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.warn("Failed to save:", err);
  }
}

export function loadState(): Partial<RootState> | undefined {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return undefined;
    return JSON.parse(serialized);
  } catch (err) {
    console.warn("Failed to load:", err);
    return undefined;
  }
}
