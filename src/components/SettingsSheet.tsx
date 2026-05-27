import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import type { Theme } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  hasDeck: boolean;
  onClearDeck: () => void;
};

export function SettingsSheet({
  open,
  onOpenChange,
  theme,
  onThemeChange,
  hasDeck,
  onClearDeck,
}: Props) {
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>設定</SheetTitle>
            <SheetDescription>テーマとデッキの管理</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6 px-4">
            <div>
              <p className="text-sm font-medium">テーマ</p>
              <RadioGroup
                className="mt-3 gap-3"
                value={theme}
                onValueChange={(v) => onThemeChange(v as Theme)}
              >
                {(["system", "light", "dark"] as Theme[]).map((t) => (
                  <label
                    key={t}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent"
                  >
                    <RadioGroupItem value={t} />
                    <span className="text-sm capitalize">{t}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium">デッキ</p>
              <Button
                variant="destructive"
                className="mt-3 w-full"
                disabled={!hasDeck}
                onClick={() => setConfirmingClear(true)}
              >
                <Trash2 className="size-4" />
                デッキを削除
              </Button>
            </div>
          </div>
          <SheetFooter className="mt-auto">
            <p className="text-center text-xs text-muted-foreground">
              English Audio PWA v0.1.0
            </p>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <AlertDialog open={confirmingClear} onOpenChange={setConfirmingClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>デッキを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在のデッキは完全に消えます。元に戻すには再度CSVを読み込んでください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmingClear(false);
                onClearDeck();
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
