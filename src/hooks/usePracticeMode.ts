"use client";

import { useCallback, useEffect, useState } from "react";
import type { VoiceMode } from "@/types";
import { PRACTICE_STORAGE_KEY } from "@/config";

type PracticeState = {
  hideEnglish: boolean;
  voiceMode: VoiceMode;
};

const DEFAULTS: PracticeState = {
  hideEnglish: false,
  voiceMode: "both",
};

const VOICE_CYCLE: VoiceMode[] = ["both", "ja", "en"];

function isVoiceMode(v: unknown): v is VoiceMode {
  return v === "both" || v === "ja" || v === "en";
}

function loadPractice(): PracticeState {
  if (typeof window === "undefined") return DEFAULTS;
  const raw = localStorage.getItem(PRACTICE_STORAGE_KEY);
  if (!raw) return DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<PracticeState>;
    return {
      hideEnglish:
        typeof parsed.hideEnglish === "boolean"
          ? parsed.hideEnglish
          : DEFAULTS.hideEnglish,
      voiceMode: isVoiceMode(parsed.voiceMode)
        ? parsed.voiceMode
        : DEFAULTS.voiceMode,
    };
  } catch {
    return DEFAULTS;
  }
}

export function usePracticeMode() {
  const [state, setState] = useState<PracticeState>(() => loadPractice());

  useEffect(() => {
    localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setHideEnglish = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, hideEnglish: v }));
  }, []);

  const setVoiceMode = useCallback((v: VoiceMode) => {
    setState((prev) => ({ ...prev, voiceMode: v }));
  }, []);

  const cycleVoiceMode = useCallback(() => {
    setState((prev) => {
      const i = VOICE_CYCLE.indexOf(prev.voiceMode);
      const next = VOICE_CYCLE[(i + 1) % VOICE_CYCLE.length];
      return { ...prev, voiceMode: next };
    });
  }, []);

  return {
    hideEnglish: state.hideEnglish,
    voiceMode: state.voiceMode,
    setHideEnglish,
    setVoiceMode,
    cycleVoiceMode,
  };
}
