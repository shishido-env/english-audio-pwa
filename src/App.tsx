import { useState } from "react";
import { Toaster, toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { DeckCard } from "@/components/DeckCard";
import { UpcomingList } from "@/components/UpcomingList";
import { NowPlayingHero } from "@/components/NowPlayingHero";
import { PlayerBar } from "@/components/PlayerBar";
import { SettingsSheet } from "@/components/SettingsSheet";
import { CsvFileInput } from "@/components/CsvFileInput";
import { useDeck } from "@/hooks/useDeck";
import { useTheme } from "@/hooks/useTheme";
import { useIntervals } from "@/hooks/useIntervals";
import { usePlayer } from "@/hooks/usePlayer";
import { speech } from "@/lib/speechInstance";

export default function App() {
  const { deck, importCsv, clear } = useDeck();
  const { theme, setTheme } = useTheme();
  const { jaToEnMs, betweenRowsMs, setJaToEnMs, setBetweenRowsMs } =
    useIntervals();
  const pairs = deck?.pairs ?? [];
  const { state, index, play, stop, next, prev } = usePlayer(pairs, speech, {
    jaToEnMs,
    betweenRowsMs,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const supported = speech.isSupported();
  const handlePlay = () => {
    if (!supported) {
      toast.error("この端末はTTSに対応していません");
      return;
    }
    play();
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      <main className="pb-32">
        {!deck && (
          <CsvFileInput hasExistingDeck={false} onImport={importCsv}>
            {(open) => <EmptyState onPickFile={open} />}
          </CsvFileInput>
        )}
        {deck && (
          <div className="mx-auto max-w-2xl space-y-6 px-4 pt-6 sm:px-6">
            <CsvFileInput hasExistingDeck={true} onImport={importCsv}>
              {(open) => <DeckCard deck={deck} onReimport={open} />}
            </CsvFileInput>
            {state.kind === "idle" ? (
              <UpcomingList pairs={pairs} startIndex={index} />
            ) : (
              <>
                <NowPlayingHero state={state} pair={pairs[index]} total={pairs.length} />
                <UpcomingList pairs={pairs} startIndex={index + 1} limit={2} />
              </>
            )}
          </div>
        )}
      </main>
      {deck && (
        <PlayerBar
          state={state}
          index={index}
          total={pairs.length}
          onPlay={handlePlay}
          onPause={stop}
          onStop={stop}
          onPrev={prev}
          onNext={next}
        />
      )}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        theme={theme}
        onThemeChange={setTheme}
        jaToEnMs={jaToEnMs}
        onJaToEnMsChange={setJaToEnMs}
        betweenRowsMs={betweenRowsMs}
        onBetweenRowsMsChange={setBetweenRowsMs}
        hasDeck={!!deck}
        onClearDeck={clear}
      />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
