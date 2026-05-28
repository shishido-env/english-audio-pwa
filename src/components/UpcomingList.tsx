"use client";

import type { Pair } from "@/types";

type Props = {
  pairs: Pair[];
  startIndex: number;
  currentIndex?: number;
  limit?: number;
  title?: string;
  hideEnglish?: boolean;
  onSelect?: (index: number) => void;
};

export function UpcomingList({
  pairs,
  startIndex,
  currentIndex,
  limit,
  title = "Next up",
  hideEnglish = false,
  onSelect,
}: Props) {
  const end = limit === undefined ? pairs.length : startIndex + limit;
  const items = pairs.slice(startIndex, end);
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="mt-3 space-y-1">
        {items.map((p, i) => {
          const idx = startIndex + i;
          const isCurrent = idx === currentIndex;
          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => onSelect?.(idx)}
                aria-current={isCurrent ? "true" : undefined}
                className={`flex w-full items-start gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isCurrent ? "bg-accent" : ""}`}
              >
                <span className="w-8 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p lang="ja" className="text-base leading-snug">
                    {p.ja}
                  </p>
                  <p
                    lang="en"
                    className={`mt-0.5 text-sm leading-snug text-muted-foreground ${hideEnglish ? "select-none blur-md" : ""}`}
                  >
                    {p.en}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
