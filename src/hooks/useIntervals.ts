import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SILENCE_BETWEEN_ROWS_MS,
  DEFAULT_SILENCE_JA_TO_EN_MS,
  INTERVALS_STORAGE_KEY,
} from "@/config";

export type Intervals = {
  jaToEnMs: number;
  betweenRowsMs: number;
};

const DEFAULTS: Intervals = {
  jaToEnMs: DEFAULT_SILENCE_JA_TO_EN_MS,
  betweenRowsMs: DEFAULT_SILENCE_BETWEEN_ROWS_MS,
};

function loadIntervals(): Intervals {
  const raw = localStorage.getItem(INTERVALS_STORAGE_KEY);
  if (!raw) return DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<Intervals>;
    const jaToEnMs =
      typeof parsed.jaToEnMs === "number" && parsed.jaToEnMs >= 0
        ? parsed.jaToEnMs
        : DEFAULTS.jaToEnMs;
    const betweenRowsMs =
      typeof parsed.betweenRowsMs === "number" && parsed.betweenRowsMs >= 0
        ? parsed.betweenRowsMs
        : DEFAULTS.betweenRowsMs;
    return { jaToEnMs, betweenRowsMs };
  } catch {
    return DEFAULTS;
  }
}

export function useIntervals() {
  const [intervals, setIntervals] = useState<Intervals>(() => loadIntervals());

  useEffect(() => {
    localStorage.setItem(INTERVALS_STORAGE_KEY, JSON.stringify(intervals));
  }, [intervals]);

  const setJaToEnMs = useCallback((ms: number) => {
    setIntervals((prev) => ({ ...prev, jaToEnMs: ms }));
  }, []);

  const setBetweenRowsMs = useCallback((ms: number) => {
    setIntervals((prev) => ({ ...prev, betweenRowsMs: ms }));
  }, []);

  return {
    jaToEnMs: intervals.jaToEnMs,
    betweenRowsMs: intervals.betweenRowsMs,
    setJaToEnMs,
    setBetweenRowsMs,
  };
}
