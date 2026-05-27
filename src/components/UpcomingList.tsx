import type { Pair } from "@/types";

type Props = {
  pairs: Pair[];
  startIndex: number;
  limit?: number;
};

export function UpcomingList({ pairs, startIndex, limit = 5 }: Props) {
  const items = pairs.slice(startIndex, startIndex + limit);
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Next up
      </p>
      <ul className="mt-3 space-y-4">
        {items.map((p, i) => {
          const idx = startIndex + i;
          return (
            <li key={idx} className="flex gap-4">
              <span className="w-8 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p lang="ja" className="text-base leading-snug">
                  {p.ja}
                </p>
                <p
                  lang="en"
                  className="mt-0.5 text-sm leading-snug text-muted-foreground"
                >
                  {p.en}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
