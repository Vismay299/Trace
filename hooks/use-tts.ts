"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * SpeechSynthesis wrapper for read-aloud follow-ups. Off by default in Phase 1.
 */
export function useTTS() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" && "speechSynthesis" in window,
    );
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !enabled) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.05;
        u.onstart = () => setIsSpeaking(true);
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u);
      } catch {
        /* noop */
      }
    },
    [supported, enabled],
  );

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  useEffect(() => () => cancel(), [cancel]);

  return { supported, enabled, setEnabled, speak, cancel, isSpeaking };
}
