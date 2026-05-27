import type { Pair, PlayerState } from "@/types";

type Props = {
  state: PlayerState;
  pair: Pair;
  total: number;
};

export function NowPlayingHero({ state, pair, total }: Props) {
  const isPlaying = state.kind === "playing" || state.kind === "paused";
  const activePhase = isPlaying && "phase" in state ? state.phase : null;
  const currentIndex = "index" in state ? state.index : 0;

  return (
    <section
      className="mx-auto max-w-2xl px-4 pt-8 sm:px-6"
      aria-live="polite"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {String(currentIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <span
            className={`mt-3 inline-block size-2.5 shrink-0 rounded-full ${activePhase === "ja" ? "bg-primary pulse-dot" : "bg-muted"}`}
            aria-hidden
          />
          <p
            lang="ja"
            className={`text-3xl font-medium leading-snug sm:text-4xl ${activePhase === "ja" ? "text-foreground" : "text-muted-foreground"}`}
          >
            {pair.ja}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span
            className={`mt-3 inline-block size-2.5 shrink-0 rounded-full ${activePhase === "en" ? "bg-primary pulse-dot" : "bg-muted"}`}
            aria-hidden
          />
          <p
            lang="en"
            className={`text-2xl leading-snug sm:text-3xl ${activePhase === "en" ? "text-foreground" : "text-muted-foreground"}`}
          >
            {pair.en}
          </p>
        </div>
      </div>
    </section>
  );
}
