import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onOpenSettings: () => void;
};

export function AppHeader({ onOpenSettings }: Props) {
  return (
    <header className="sticky top-0 z-10 h-14 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-2xl items-center justify-between px-4 sm:px-6">
        <h1 className="text-sm font-semibold tracking-tight">
          English Audio PWA
        </h1>
        <Button
          variant="ghost"
          size="icon"
          aria-label="設定を開く"
          onClick={onOpenSettings}
        >
          <Settings className="size-5" />
        </Button>
      </div>
    </header>
  );
}
