"use client";

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
import {
  BETWEEN_ROWS_INTERVAL_OPTIONS_MS,
  JA_TO_EN_INTERVAL_OPTIONS_MS,
} from "@/config";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  jaToEnMs: number;
  onJaToEnMsChange: (ms: number) => void;
  betweenRowsMs: number;
  onBetweenRowsMsChange: (ms: number) => void;
  hasDecks: boolean;
  onClearAllDecks: () => void;
};

function formatSec(ms: number): string {
  const sec = ms / 1000;
  return sec === Math.floor(sec) ? `${sec}秒` : `${sec.toFixed(1)}秒`;
}

export function SettingsSheet({
  open,
  onOpenChange,
  theme,
  onThemeChange,
  jaToEnMs,
  onJaToEnMsChange,
  betweenRowsMs,
  onBetweenRowsMsChange,
  hasDecks,
  onClearAllDecks,
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
              <p className="text-sm font-medium">日本語のあとの間隔</p>
              <p className="mt-1 text-xs text-muted-foreground">
                長めに設定すると暗誦練習に使えます
              </p>
              <RadioGroup
                className="mt-3 grid grid-cols-3 gap-2"
                value={String(jaToEnMs)}
                onValueChange={(v) => onJaToEnMsChange(Number(v))}
              >
                {JA_TO_EN_INTERVAL_OPTIONS_MS.map((ms) => (
                  <label
                    key={ms}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-md border p-2 text-sm hover:bg-accent"
                  >
                    <RadioGroupItem value={String(ms)} />
                    <span>{formatSec(ms)}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <p className="text-sm font-medium">行と行の間隔</p>
              <RadioGroup
                className="mt-3 grid grid-cols-3 gap-2"
                value={String(betweenRowsMs)}
                onValueChange={(v) => onBetweenRowsMsChange(Number(v))}
              >
                {BETWEEN_ROWS_INTERVAL_OPTIONS_MS.map((ms) => (
                  <label
                    key={ms}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-md border p-2 text-sm hover:bg-accent"
                  >
                    <RadioGroupItem value={String(ms)} />
                    <span>{formatSec(ms)}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium">デッキ</p>
              <p className="mt-1 text-xs text-muted-foreground">
                すべてのデッキを削除します
              </p>
              <Button
                variant="destructive"
                className="mt-3 w-full"
                disabled={!hasDecks}
                onClick={() => setConfirmingClear(true)}
              >
                <Trash2 className="size-4" />
                すべて削除
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
            <AlertDialogTitle>すべてのデッキを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              全てのデッキとフレーズが完全に消えます。元に戻すには再度CSVを読み込んでください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmingClear(false);
                onClearAllDecks();
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
