import { useEffect, useRef } from "react";

type WakeLockSentinel = {
  release: () => Promise<void>;
  released: boolean;
  addEventListener: (type: "release", cb: () => void) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinel>;
  };
};

export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const nav = navigator as WakeLockNavigator;
    if (!nav.wakeLock) return;

    let cancelled = false;

    async function acquire() {
      try {
        const sentinel = await nav.wakeLock!.request("screen");
        if (cancelled) {
          await sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          if (sentinelRef.current === sentinel) sentinelRef.current = null;
        });
      } catch {
        // ignore: not supported or denied
      }
    }

    async function release() {
      if (sentinelRef.current) {
        try {
          await sentinelRef.current.release();
        } catch {
          // ignore
        }
        sentinelRef.current = null;
      }
    }

    if (active) {
      void acquire();
    } else {
      void release();
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible" && active && !sentinelRef.current) {
        void acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void release();
    };
  }, [active]);
}
