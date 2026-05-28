"use client";

import { useState } from "react";
import { Toaster, toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { UpcomingList } from "@/components/UpcomingList";
import { NowPlayingHero } from "@/components/NowPlayingHero";
import { PlayerBar } from "@/components/PlayerBar";
import { SettingsSheet } from "@/components/SettingsSheet";
import { CsvFileInput } from "@/components/CsvFileInput";
import { useLibrary } from "@/hooks/useLibrary";
import { useTheme } from "@/hooks/useTheme";
import { useIntervals } from "@/hooks/useIntervals";
import { usePlayer } from "@/hooks/usePlayer";
import { useWakeLock } from "@/hooks/useWakeLock";
import { usePracticeMode } from "@/hooks/usePracticeMode";
import { speech } from "@/lib/speechInstance";

export function LibraryShell() {
  const {
    library,
    activeDeck,
    importCsv,
    selectDeck,
    renameDeck,
    removeDeck,
    clearAll,
  } = useLibrary();
  const { theme, setTheme } = useTheme();
  const { jaToEnMs, betweenRowsMs, setJaToEnMs, setBetweenRowsMs } =
    useIntervals();
  const { hideEnglish, voiceMode, setHideEnglish, cycleVoiceMode } =
    usePracticeMode();
  const pairs = activeDeck?.pairs ?? [];
  const { state, index, play, playFrom, goTo, stop, next, prev } = usePlayer(
    pairs,
    speech,
    { jaToEnMs, betweenRowsMs, voiceMode },
  );
  useWakeLock(state.kind === "playing");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const supported = speech.isSupported();
  const handlePlay = () => {
    if (!supported) {
      toast.error("この端末はTTSに対応していません");
      return;
    }
    play();
  };

  const handleSelectPhrase = (i: number) => {
    if (!supported) {
      toast.error("この端末はTTSに対応していません");
      return;
    }
    playFrom(i);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <CsvFileInput onImport={importCsv}>
        {(open) => (
          <>
            <AppHeader
              decks={library.decks}
              activeId={library.activeId}
              onSelectDeck={selectDeck}
              onRenameDeck={renameDeck}
              onRemoveDeck={removeDeck}
              onAddDeck={open}
              onOpenSettings={() => setSettingsOpen(true)}
            />
            <main className="pb-36">
              {!activeDeck && <EmptyState onPickFile={open} />}
              {activeDeck && (
                <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 md:pt-8">
                  <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
                    <div className="lg:sticky lg:top-24 lg:self-start">
                      <NowPlayingHero
                        state={state}
                        pair={pairs[index] ?? { ja: "", en: "" }}
                        index={index}
                        total={pairs.length}
                        hideEnglish={hideEnglish}
                        onToggleHideEnglish={() => setHideEnglish(!hideEnglish)}
                      />
                    </div>
                    <div>
                      <UpcomingList
                        pairs={pairs}
                        startIndex={0}
                        currentIndex={index}
                        title="フレーズ一覧"
                        hideEnglish={hideEnglish}
                        onSelect={(i) => {
                          if (state.kind === "idle") goTo(i);
                          else handleSelectPhrase(i);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </main>
          </>
        )}
      </CsvFileInput>
      {activeDeck && (
        <PlayerBar
          state={state}
          index={index}
          total={pairs.length}
          voiceMode={voiceMode}
          onPlay={handlePlay}
          onPause={stop}
          onStop={stop}
          onPrev={prev}
          onNext={next}
          onCycleVoiceMode={cycleVoiceMode}
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
        hasDecks={library.decks.length > 0}
        onClearAllDecks={clearAll}
      />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
