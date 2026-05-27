export type Speech = {
  speak: (text: string, lang: string) => Promise<void>;
  cancel: () => void;
  isSupported: () => boolean;
};

const KEEP_ALIVE_INTERVAL_MS = 5000;

export function createSpeech(): Speech {
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  function startKeepAlive() {
    if (typeof speechSynthesis === "undefined") return;
    if (keepAliveTimer !== null) return;
    keepAliveTimer = setInterval(() => {
      if (typeof speechSynthesis === "undefined") return;
      if (speechSynthesis.speaking) {
        speechSynthesis.pause();
        speechSynthesis.resume();
      }
    }, KEEP_ALIVE_INTERVAL_MS);
  }

  function stopKeepAlive() {
    if (keepAliveTimer !== null) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  }

  return {
    speak(text, lang) {
      return new Promise<void>((resolve, reject) => {
        if (typeof speechSynthesis === "undefined") {
          reject(new Error("speechSynthesis not available"));
          return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.onend = () => {
          stopKeepAlive();
          resolve();
        };
        utterance.onerror = (e) => {
          stopKeepAlive();
          if (e.error === "canceled" || e.error === "interrupted") {
            resolve();
            return;
          }
          reject(new Error(`speech error: ${e.error ?? "unknown"}`));
        };
        startKeepAlive();
        speechSynthesis.speak(utterance);
      });
    },
    cancel() {
      stopKeepAlive();
      if (typeof speechSynthesis !== "undefined") {
        speechSynthesis.cancel();
      }
    },
    isSupported() {
      return (
        typeof speechSynthesis !== "undefined" &&
        typeof SpeechSynthesisUtterance !== "undefined"
      );
    },
  };
}
