import { BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Deck } from "@/types";

type Props = {
  deck: Deck;
  onReimport: () => void;
};

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function DeckCard({ deck, onReimport }: Props) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <BookOpen className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{deck.name}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {deck.pairs.length} phrases · {formatDate(deck.importedAt)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="別のCSVを読み込む"
          onClick={onReimport}
        >
          <RefreshCw className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
