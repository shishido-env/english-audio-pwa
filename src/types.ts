export type Pair = { ja: string; en: string };

export type Deck = {
  id: string;
  name: string;
  pairs: Pair[];
  importedAt: number;
};

export type Library = {
  decks: Deck[];
  activeId: string | null;
};

export type Phase = "ja" | "en";

export type PlayerState =
  | { kind: "idle" }
  | { kind: "playing"; index: number; phase: Phase }
  | { kind: "paused"; index: number; phase: Phase };

export type Theme = "light" | "dark" | "system";

export type VoiceMode = "both" | "ja" | "en";
