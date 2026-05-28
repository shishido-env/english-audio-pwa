"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pair, PlayerState } from "@/types";

type Props = {
  state: PlayerState;
  pair: Pair;
  index: number;
  total: number;
  hideEnglish: boolean;
  onToggleHideEnglish: () => void;
};

export function NowPlayingHero({
  state,
  pair,
  index,
  total,
  hideEnglish,
  onToggleHideEnglish,
}: Props) {
  const isActive = state.kind === "playing" || state.kind === "paused";
  const activePhase = isActive && "phase" in state ? state.phase : null;

  const [manualReveal, setManualReveal] = useState<{ index: number } | null>(
    null,
  );
  const isManuallyRevealed = manualReveal?.index === index;
  const englishHidden =
    hideEnglish && !isManuallyRevealed && activePhase !== "en";

  const revealNow = () => {
    if (englishHidden) {
      setManualReveal({ index });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(10);
        } catch {
          // ignore
        }
      }
    }
  };

  return (
    <section
      className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8 md:p-10"
      aria-live="polite"
    >
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>{isActive ? "Now Playing" : "Up Next"}</span>
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            aria-label={hideEnglish ? "英語を表示" : "英語を隠す"}
            aria-pressed={hideEnglish}
            onClick={onToggleHideEnglish}
          >
            {hideEnglish ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4 opacity-60" />
            )}
          </Button>
        </div>
      </div>
      <div className="mt-6 space-y-5">
        <div className="flex items-start gap-3">
          <span
            className={`mt-3 inline-block size-2.5 shrink-0 rounded-full transition-colors ${activePhase === "ja" ? "bg-primary pulse-dot" : "bg-muted"}`}
            aria-hidden
          />
          <p
            lang="ja"
            className={`text-2xl font-medium leading-snug sm:text-3xl md:text-4xl ${activePhase === "ja" || activePhase === null ? "text-foreground" : "text-muted-foreground"}`}
          >
            {pair.ja}
          </p>
        </div>
        <button
          type="button"
          onClick={revealNow}
          disabled={!englishHidden}
          aria-label={englishHidden ? "英語を表示する" : undefined}
          className="flex w-full items-start gap-3 rounded-md text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
        >
          <span
            className={`mt-3 inline-block size-2.5 shrink-0 rounded-full transition-colors ${activePhase === "en" ? "bg-primary pulse-dot" : "bg-muted"}`}
            aria-hidden
          />
          <p
            lang="en"
            className={`flex-1 text-xl leading-snug sm:text-2xl md:text-3xl ${activePhase === "en" ? "text-foreground" : "text-muted-foreground"} ${englishHidden ? "select-none blur-md" : ""}`}
          >
            {pair.en}
          </p>
        </button>
        {englishHidden && (
          <p className="pl-6 text-xs text-muted-foreground">
            タップで英語を表示
          </p>
        )}
      </div>
    </section>
  );
}
