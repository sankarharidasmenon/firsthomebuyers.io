'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_VOICE_SETTINGS, VoiceSettings } from '@/lib/speech/types';

export interface UseSpeechSynthesisResult {
  isSupported: boolean;
  isSpeaking: boolean;
  /** id of the message currently being read, so callers can highlight it */
  speakingId: string | null;
  error: string | null;
  speak: (text: string, id: string, settings?: VoiceSettings) => void;
  stop: () => void;
}

/** Strips common markdown syntax so it isn't read out loud literally. */
function stripForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_#>~]+/g, ' ')
    .replace(/^\s*-\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasSpeechSynthesis(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Wraps window.speechSynthesis behind an engine-agnostic interface, so this
 * can later be swapped for Gemini Live / OpenAI Realtime / ElevenLabs
 * without touching any UI component. A single instance of this hook should
 * be owned by the chat container so only one message can speak at a time.
 */
export function useSpeechSynthesis(): UseSpeechSynthesisResult {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(hasSpeechSynthesis());
  }, []);

  const stop = useCallback(() => {
    if (!hasSpeechSynthesis()) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setSpeakingId(null);
  }, []);

  const speak = useCallback((text: string, id: string, settings?: VoiceSettings) => {
    if (!hasSpeechSynthesis()) {
      setError("Read aloud isn't supported in your browser.");
      return;
    }

    const plainText = stripForSpeech(text);
    if (!plainText) return;

    // Only one voice at a time: cancel whatever is currently queued/speaking.
    const wasActive = window.speechSynthesis.speaking || window.speechSynthesis.pending;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = settings?.rate ?? DEFAULT_VOICE_SETTINGS.rate;
    utterance.pitch = settings?.pitch ?? DEFAULT_VOICE_SETTINGS.pitch;
    utterance.volume = settings?.volume ?? DEFAULT_VOICE_SETTINGS.volume;
    utterance.lang = settings?.lang ?? 'en-AU';

    utterance.onstart = () => {
      setError(null);
      setIsSpeaking(true);
      setSpeakingId(id);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingId(null);
      utteranceRef.current = null;
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setError('Read aloud ran into a problem.');
      }
      setIsSpeaking(false);
      setSpeakingId(null);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;

    if (wasActive) {
      // Chrome has a known bug where calling speak() synchronously right
      // after cancel() can silently drop the new utterance (most visible
      // when switching "Listen" between two messages back to back).
      // Deferring one tick avoids it.
      setTimeout(() => {
        if (utteranceRef.current === utterance) {
          window.speechSynthesis.speak(utterance);
        }
      }, 50);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Chrome/Chromium (Chrome, Edge, Android Chrome) has a long-standing bug
  // where speechSynthesis silently goes mute after ~15s of continuous
  // speech. Periodically pausing/resuming keeps it alive; harmless no-op on
  // engines that don't have the bug.
  useEffect(() => {
    if (!isSpeaking || !hasSpeechSynthesis()) return;
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
    return () => clearInterval(keepAlive);
  }, [isSpeaking]);

  // Stop when the tab/app is backgrounded, so nothing keeps talking from a
  // hidden tab (app switch, screen lock, incoming call).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stop();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stop]);

  // Cancel on unmount so nothing keeps talking after the chat closes/navigates away.
  useEffect(() => {
    return () => {
      if (hasSpeechSynthesis()) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { isSupported, isSpeaking, speakingId, error, speak, stop };
}
