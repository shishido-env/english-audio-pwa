export const STORAGE_KEY = "english-audio-pwa:deck";
export const LIBRARY_STORAGE_KEY = "english-audio-pwa:library";
export const THEME_STORAGE_KEY = "english-audio-pwa:theme";
export const INTERVALS_STORAGE_KEY = "english-audio-pwa:intervals";

export const DEFAULT_SILENCE_JA_TO_EN_MS = 400;
export const DEFAULT_SILENCE_BETWEEN_ROWS_MS = 800;

export const JA_TO_EN_INTERVAL_OPTIONS_MS = [400, 1000, 2000, 3000, 5000, 8000, 10000] as const;
export const BETWEEN_ROWS_INTERVAL_OPTIONS_MS = [400, 800, 1500, 3000, 5000] as const;

export const LANG_JA = "ja-JP";
export const LANG_EN = "en-US";

export const STOP_LONG_PRESS_MS = 1500;
