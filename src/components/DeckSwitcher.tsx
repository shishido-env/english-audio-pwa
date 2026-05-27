import { useState } from "react";
import { Check, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Deck } from "@/types";

type Props = {
  decks: Deck[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onAddDeck: () => void;
};

export function DeckSwitcher({
  decks,
  activeId,
  onSelect,
  onRename,
  onRemove,
  onAddDeck,
}: Props) {
  const active = decks.find((d) => d.id === activeId) ?? null;
  const [open, setOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Deck | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Deck | null>(null);

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="-mx-2 h-auto max-w-full gap-2 px-2 py-1 text-left"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-semibold">
                {active?.name ?? "デッキを選択"}
              </span>
              {active && (
                <span className="text-xs text-muted-foreground">
                  {active.pairs.length}フレーズ
                </span>
              )}
            </div>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          {decks.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              デッキがありません
            </p>
          )}
          {decks.map((d) => {
            const isActive = d.id === activeId;
            return (
              <div
                key={d.id}
                className={`flex items-center gap-1 rounded-sm px-1 py-0.5 ${isActive ? "bg-accent" : "hover:bg-accent"}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect(d.id);
                    setOpen(false);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-2 text-left"
                >
                  <Check
                    className={`size-4 shrink-0 ${isActive ? "opacity-100" : "opacity-0"}`}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {d.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {d.pairs.length}フレーズ
                    </span>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label={`${d.name}の名前を変更`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameTarget(d);
                    setOpen(false);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-destructive hover:text-destructive"
                  aria-label={`${d.name}を削除`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRemoveTarget(d);
                    setOpen(false);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
          {decks.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem
            onSelect={() => {
              setOpen(false);
              onAddDeck();
            }}
          >
            <Plus className="size-4" />
            CSVを追加
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameDeckDialog
        deck={renameTarget}
        onClose={() => setRenameTarget(null)}
        onSubmit={(name) => {
          if (renameTarget) onRename(renameTarget.id, name);
          setRenameTarget(null);
        }}
      />

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              「{removeTarget?.name}」を削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription>
              このデッキのフレーズはすべて消えます。元に戻すには再度CSVを読み込んでください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removeTarget) onRemove(removeTarget.id);
                setRemoveTarget(null);
              }}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RenameDeckDialog({
  deck,
  onClose,
  onSubmit,
}: {
  deck: Deck | null;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <Dialog
      open={!!deck}
      onOpenChange={(o) => {
        if (!o) onClose();
        else setValue(deck?.name ?? "");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>デッキの名前を変更</DialogTitle>
          <DialogDescription>
            分かりやすい名前にしておくとデッキの切替がスムーズです。
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit(value);
            }
          }}
          placeholder="例: TOEIC Part2"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={() => onSubmit(value)}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
