import { useCallback, useEffect, useRef, useState } from "react";
import type { Pair, PlayerState, VoiceMode } from "@/types";
import type { Speech } from "@/lib/speech";
import {
  LANG_JA,
  LANG_EN,
  DEFAULT_SILENCE_JA_TO_EN_MS,
  DEFAULT_SILENCE_BETWEEN_ROWS_MS,
} from "@/config";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export type PlayerOptions = {
  jaToEnMs?: number;
  betweenRowsMs?: number;
  voiceMode?: VoiceMode;
};

export function usePlayer(
  pairs: Pair[],
  speech: Speech,
  options: PlayerOptions = {},
) {
  const {
    jaToEnMs = DEFAULT_SILENCE_JA_TO_EN_MS,
    betweenRowsMs = DEFAULT_SILENCE_BETWEEN_ROWS_MS,
    voiceMode = "both",
  } = options;
  const settingsRef = useRef({ jaToEnMs, betweenRowsMs, voiceMode });
  useEffect(() => {
    settingsRef.current = { jaToEnMs, betweenRowsMs, voiceMode };
  }, [jaToEnMs, betweenRowsMs, voiceMode]);
  const [state, setState] = useState<PlayerState>({ kind: "idle" });
  const [index, setIndex] = useState(0);
  const runIdRef = useRef(0);

  const stop = useCallback(() => {
    runIdRef.current++;
    speech.cancel();
    setState({ kind: "idle" });
  }, [speech]);

  const runFrom = useCallback(
    async (startIndex: number) => {
      if (pairs.length === 0) return;
      const myRunId = ++runIdRef.current;
      let i = startIndex;
      while (i < pairs.length) {
        const { jaToEnMs, betweenRowsMs, voiceMode } = settingsRef.current;
        const playJa = voiceMode !== "en";
        const playEn = voiceMode !== "ja";
        if (runIdRef.current !== myRunId) return;
        setState({ kind: "playing", index: i, phase: "ja" });
        setIndex(i);
        if (playJa) {
          await speech.speak(pairs[i].ja, LANG_JA);
          if (runIdRef.current !== myRunId) return;
          if (playEn) await sleep(jaToEnMs);
          if (runIdRef.current !== myRunId) return;
        }
        if (playEn) {
          setState({ kind: "playing", index: i, phase: "en" });
          await speech.speak(pairs[i].en, LANG_EN);
          if (runIdRef.current !== myRunId) return;
        }
        if (i < pairs.length - 1) await sleep(betweenRowsMs);
        i++;
      }
      if (runIdRef.current === myRunId) {
        setState({ kind: "idle" });
      }
    },
    [pairs, speech],
  );

  const play = useCallback(() => {
    void runFrom(index);
  }, [runFrom, index]);

  const playFrom = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(i, pairs.length - 1));
      setIndex(clamped);
      speech.cancel();
      void runFrom(clamped);
    },
    [pairs.length, runFrom, speech],
  );

  const goTo = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(i, pairs.length - 1));
      setIndex(clamped);
    },
    [pairs.length],
  );

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(pairs.length - 1, 0)));
  }, [pairs.length]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const runId = runIdRef;
    return () => {
      runId.current++;
      speech.cancel();
    };
  }, [speech]);

  return { state, index, play, playFrom, goTo, stop, next, prev };
}
