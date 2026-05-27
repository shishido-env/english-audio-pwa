import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { STOP_LONG_PRESS_MS } from "@/config";
import type { PlayerState } from "@/types";

type Props = {
  state: PlayerState;
  index: number;
  total: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function PlayerBar({
  state,
  index,
  total,
  onPlay,
  onPause,
  onStop,
  onPrev,
  onNext,
}: Props) {
  const isPlaying = state.kind === "playing";
  const percent = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;
  const timerRef = useRef<number | null>(null);
  const firedRef = useRef(false);
  const [pressing, setPressing] = useState(false);

  const startPress = () => {
    firedRef.current = false;
    setPressing(true);
    timerRef.current = window.setTimeout(() => {
      firedRef.current = true;
      timerRef.current = null;
      onStop();
      setPressing(false);
    }, STOP_LONG_PRESS_MS);
  };

  const endPress = () => {
    setPressing(false);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (firedRef.current) return;
    if (isPlaying) onPause();
    else onPlay();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const disabled = total === 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-2xl px-4 pt-2 pb-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Progress value={percent} className="h-1 flex-1" />
          <span className="text-xs tabular-nums text-muted-foreground">
            {percent}%
          </span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="size-12"
            disabled={disabled}
            onClick={onPrev}
            aria-label="前へ"
          >
            <SkipBack className="size-5" />
          </Button>
          <button
            type="button"
            aria-label={isPlaying ? "一時停止" : "再生"}
            disabled={disabled}
            onPointerDown={startPress}
            onPointerUp={endPress}
            onPointerLeave={endPress}
            onPointerCancel={endPress}
            className={`relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${pressing ? "ring-4 ring-primary/30" : ""}`}
          >
            {isPlaying ? <Pause className="size-7" /> : <Play className="size-7 translate-x-0.5" />}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="size-12"
            disabled={disabled}
            onClick={onNext}
            aria-label="次へ"
          >
            <SkipForward className="size-5" />
          </Button>
        </div>
        <p className="mt-1 text-center text-[10px] text-muted-foreground">
          長押しで停止
        </p>
      </div>
    </div>
  );
}
