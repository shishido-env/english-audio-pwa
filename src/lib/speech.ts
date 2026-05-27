export type Speech = {
  speak: (text: string, lang: string) => Promise<void>;
  cancel: () => void;
  isSupported: () => boolean;
};

export function createSpeech(): Speech {
  return {
    speak(text, lang) {
      return new Promise<void>((resolve, reject) => {
        if (typeof speechSynthesis === "undefined") {
          reject(new Error("speechSynthesis not available"));
          return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.onend = () => resolve();
        utterance.onerror = (e) =>
          reject(new Error(`speech error: ${e.error ?? "unknown"}`));
        speechSynthesis.speak(utterance);
      });
    },
    cancel() {
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
