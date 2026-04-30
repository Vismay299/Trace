"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0?: { transcript?: string };
  }>;
};
type SpeechRecognitionErrorEventLike = {
  error?: string;
};

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ??
    w.webkitSpeechRecognition ??
    null) as SpeechRecognitionCtor | null;
}

export type UseVoiceInputResult = {
  supported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setTranscript: (s: string) => void;
};

/**
 * Browser-native Web Speech API hook. Spec §F14: voice-first by default,
 * Firefox falls back to text. Auto-stops after 2.5s of silence.
 */
export function useVoiceInput(opts?: {
  lang?: string;
  silenceTimeoutMs?: number;
}): UseVoiceInputResult {
  const lang = opts?.lang ?? "en-US";
  const silenceMs = opts?.silenceTimeoutMs ?? 2500;

  const [supported, setSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Manual-stop flag — distinguishes user-tap from auto-end so we don't
  // surface a confusing "stopped" error in the UI.
  const stoppedManually = useRef(false);

  useEffect(() => {
    setSupported(getCtor() != null);
  }, []);

  const cleanupTimer = () => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
  };

  const stop = useCallback(() => {
    stoppedManually.current = true;
    cleanupTimer();
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    setError(null);
    const Ctor = getCtor();
    if (!Ctor) {
      setError(
        "Voice input isn't supported in this browser. Use Chrome, Safari, or Edge — or switch to text mode.",
      );
      return;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* noop */
      }
    }
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang;
    r.maxAlternatives = 1;

    r.onresult = (event) => {
      let interim = "";
      let appended = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) appended += text;
        else interim += text;
      }
      if (appended) {
        setTranscript((prev) =>
          prev ? prev + " " + appended.trim() : appended.trim(),
        );
        setInterimTranscript("");
      } else {
        setInterimTranscript(interim);
      }
      cleanupTimer();
      silenceTimer.current = setTimeout(() => stop(), silenceMs);
    };
    r.onerror = (event) => {
      const code = event?.error ?? "unknown";
      if (code !== "aborted") setError(humanizeError(code));
      setIsListening(false);
      cleanupTimer();
    };
    r.onend = () => {
      setIsListening(false);
      cleanupTimer();
    };

    recognitionRef.current = r;
    stoppedManually.current = false;
    try {
      r.start();
      setIsListening(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start recognition.",
      );
    }
  }, [lang, silenceMs, stop]);

  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  useEffect(
    () => () => {
      cleanupTimer();
      try {
        recognitionRef.current?.abort();
      } catch {
        /* noop */
      }
    },
    [],
  );

  return {
    supported,
    isListening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
    setTranscript,
  };
}

function humanizeError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was blocked. Allow it in your browser settings or switch to text mode.";
    case "no-speech":
      return "We didn't hear anything. Try again, or switch to text.";
    case "audio-capture":
      return "No microphone found. Plug one in or switch to text mode.";
    case "network":
      return "Voice recognition needs internet. Check your connection.";
    default:
      return `Voice input error (${code}). Try again or switch to text.`;
  }
}
