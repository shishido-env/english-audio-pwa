"use client";

import { Headphones, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deck } from "@/types";
import { DeckSwitcher } from "@/components/DeckSwitcher";

type Props = {
  decks: Deck[];
  activeId: string | null;
  onSelectDeck: (id: string) => void;
  onRenameDeck: (id: string, name: string) => void;
  onRemoveDeck: (id: string) => void;
  onAddDeck: () => void;
  onOpenSettings: () => void;
};

export function AppHeader({
  decks,
  activeId,
  onSelectDeck,
  onRenameDeck,
  onRemoveDeck,
  onAddDeck,
  onOpenSettings,
}: Props) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2 text-primary">
          <Headphones className="size-5" aria-hidden />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            English Audio
          </span>
        </div>
        <div className="mx-2 h-6 w-px bg-border" />
        <div className="min-w-0 flex-1">
          <DeckSwitcher
            decks={decks}
            activeId={activeId}
            onSelect={onSelectDeck}
            onRename={onRenameDeck}
            onRemove={onRemoveDeck}
            onAddDeck={onAddDeck}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-12"
          aria-label="設定を開く"
          onClick={onOpenSettings}
        >
          <Settings className="size-5" />
        </Button>
      </div>
    </header>
  );
}
