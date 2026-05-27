import type { Pair, PlayerState } from "@/types";

type Props = {
  state: PlayerState;
  pair: Pair;
  index: number;
  total: number;
};

export function NowPlayingHero({ state, pair, index, total }: Props) {
  const isActive = state.kind === "playing" || state.kind === "paused";
  const activePhase = isActive && "phase" in state ? state.phase : null;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8 md:p-10"
      aria-live="polite"
    >
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>{isActive ? "Now Playing" : "Up Next"}</span>
        <span className="tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
      <div className="mt-6 space-y-5">
        <div className="flex items-start gap-3">
          <span
            className={`mt-3 inline-block size-2.5 shrink-0 rounded-full transition-colors ${activePhase === "ja" ? "bg-primary pulse-dot" : "bg-muted"}`}
            aria-hidden
          />
          <p
            lang="ja"
            className={`text-2xl font-medium leading-snug sm:text-3xl md:text-4xl ${activePhase === "ja" ? "text-foreground" : activePhase === null ? "text-foreground" : "text-muted-foreground"}`}
          >
            {pair.ja}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span
            className={`mt-3 inline-block size-2.5 shrink-0 rounded-full transition-colors ${activePhase === "en" ? "bg-primary pulse-dot" : "bg-muted"}`}
            aria-hidden
          />
          <p
            lang="en"
            className={`text-xl leading-snug sm:text-2xl md:text-3xl ${activePhase === "en" ? "text-foreground" : "text-muted-foreground"}`}
          >
            {pair.en}
          </p>
        </div>
      </div>
    </section>
  );
}
