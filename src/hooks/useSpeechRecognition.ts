'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeechRecognitionErrorCode } from '@/lib/speech/types';

/** Safety net in case the browser never fires 'end'/'error' after silence. */
const SILENCE_TIMEOUT_MS = 8000;
/** If stop()/abort() themselves don't produce 'end' promptly, force state recovery. */
const STOP_WATCHDOG_MS = 1500;

// Verbose lifecycle logging per the debugging checklist. Automatically off
// in production builds so it never ships to end users' consoles.
const DEBUG = process.env.NODE_ENV !== 'production';
function log(...args: unknown[]) {
  if (DEBUG) console.log('[useSpeechRecognition]', ...args);
}

function getRecognitionCtor(): { ctor: { new (): SpeechRecognition }; api: string } | null {
  if (typeof window === 'undefined') return null;
  if (window.SpeechRecognition) return { ctor: window.SpeechRecognition, api: 'SpeechRecognition' };
  if (window.webkitSpeechRecognition) return { ctor: window.webkitSpeechRecognition, api: 'webkitSpeechRecognition' };
  return null;
}

function mapError(error: string): { code: SpeechRecognitionErrorCode; message: string } {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return {
        code: 'not-allowed',
        message: 'Microphone access was denied. Allow microphone permission in your browser settings to use voice input.',
      };
    case 'no-speech':
      return { code: 'no-speech', message: "We didn't catch that — no speech was detected. Try again." };
    case 'audio-capture':
      return { code: 'audio-capture', message: 'No microphone was found. Connect a microphone and try again.' };
    case 'network':
      return { code: 'network', message: 'A network error interrupted voice input. Check your connection and try again.' };
    case 'aborted':
      return { code: 'aborted', message: '' };
    default:
      return { code: 'unknown', message: 'Voice input ran into a problem. Please try again or type your message.' };
  }
}

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  interimTranscript: string;
  error: SpeechRecognitionErrorCode | null;
  errorMessage: string | null;
  start: () => void;
  stop: () => void;
  clearError: () => void;
}

/**
 * Wraps the browser's native SpeechRecognition API behind an engine-agnostic
 * interface, so this can later be swapped for Gemini Live / OpenAI Realtime /
 * Azure Speech without touching any UI component.
 *
 * Important browser quirk this hook works around: reusing the SAME
 * SpeechRecognition instance across multiple start()/stop() cycles is
 * unreliable in Chrome — after a session ends, a stale instance can silently
 * fail to fire onresult (or even onstart) again. A fresh instance is created
 * for every session instead.
 */
export function useSpeechRecognition(options: {
  lang?: string;
  fallbackLang?: string;
  onResult?: (finalText: string) => void;
} = {}): UseSpeechRecognitionResult {
  const { lang = 'en-AU', fallbackLang = 'en-US' } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<SpeechRecognitionErrorCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Synchronous mirror of isListening — React state is batched/async, so a
  // fast double-click on the mic button needs a ref to reliably de-dupe.
  const listeningRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onResultRef = useRef(options.onResult);
  const gotResultRef = useRef(false);
  const triedFallbackRef = useRef(false);
  // Holds the latest "start a session" implementation so the onerror retry
  // path always calls the current version without fighting hook ordering.
  const runSessionRef = useRef<(langToUse: string) => void>(() => {});

  useEffect(() => {
    onResultRef.current = options.onResult;
  });

  useEffect(() => {
    const found = getRecognitionCtor();
    setIsSupported(found !== null);
    log('Support check:', found ? `found window.${found.api}` : 'no SpeechRecognition API in this browser');
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearWatchdog = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }, []);

  const forceReset = useCallback((reason: string) => {
    log('Force-resetting listening state:', reason);
    clearSilenceTimer();
    clearWatchdog();
    listeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');
    recognitionRef.current = null;
  }, [clearSilenceTimer, clearWatchdog]);

  const armSilenceTimer = useCallback((recognition: SpeechRecognition) => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      log('Silence timeout reached — calling stop()');
      try {
        recognition.stop();
      } catch (e) {
        log('stop() during silence timeout threw:', e);
      }
      // Watchdog: if stop() doesn't actually produce onend/onerror in time,
      // force the UI out of "Listening..." anyway so it never gets stuck.
      clearWatchdog();
      watchdogTimerRef.current = setTimeout(() => {
        if (recognitionRef.current === recognition && listeningRef.current) {
          forceReset('stop() did not resolve after silence timeout');
        }
      }, STOP_WATCHDOG_MS);
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer, clearWatchdog, forceReset]);

  const detach = (recognition: SpeechRecognition) => {
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
  };

  const createRecognition = useCallback((langToUse: string): SpeechRecognition | null => {
    const found = getRecognitionCtor();
    if (!found) return null;

    const recognition = new found.ctor();
    recognition.lang = langToUse;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      log('Recognition Started (api=%s, lang=%s)', found.api, langToUse);
      listeningRef.current = true;
      gotResultRef.current = false;
      setIsListening(true);
      setError(null);
      setErrorMessage(null);
      armSilenceTimer(recognition);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      log('Speech Detected (resultIndex=%d, results=%d)', event.resultIndex, event.results.length);
      gotResultRef.current = true;
      armSilenceTimer(recognition);

      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      if (interimText) {
        log('Interim Transcript:', interimText);
        setInterimTranscript(interimText);
      }

      if (finalText.trim()) {
        log('Final Transcript:', finalText.trim());
        setInterimTranscript('');
        onResultRef.current?.(finalText.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      log('Recognition Error:', event.error, event.message || '(no message)');

      // If the very first attempt fails before any speech was recognized,
      // retry once with the fallback language before surfacing an error.
      if (
        !gotResultRef.current &&
        !triedFallbackRef.current &&
        langToUse !== fallbackLang &&
        (event.error === 'language-not-supported' || event.error === 'network' || event.error === 'audio-capture')
      ) {
        triedFallbackRef.current = true;
        detach(recognition);
        clearSilenceTimer();
        clearWatchdog();
        log('Retrying with fallback language:', fallbackLang);
        runSessionRef.current(fallbackLang);
        return;
      }

      const mapped = mapError(event.error);
      if (mapped.code !== 'aborted') {
        setError(mapped.code);
        setErrorMessage(mapped.message);
      }
      detach(recognition);
      forceReset(`onerror: ${event.error}`);
    };

    recognition.onend = () => {
      log('Recognition Ended');
      detach(recognition);
      forceReset('onend');
    };

    return recognition;
  }, [armSilenceTimer, clearSilenceTimer, clearWatchdog, fallbackLang, forceReset]);

  // Kept in sync every render (not during render itself — refs must only be
  // written in effects/handlers) so the onerror retry path above always
  // calls a valid, up-to-date session starter.
  useEffect(() => {
    runSessionRef.current = (langToUse: string) => {
      const recognition = createRecognition(langToUse);
      if (!recognition) {
        log('No SpeechRecognition constructor available at session start');
        setError('unsupported');
        setErrorMessage("Voice input isn't supported in your browser.");
        return;
      }
      recognitionRef.current = recognition;
      try {
        log('Calling recognition.start() — requesting microphone permission if needed');
        recognition.start();
      } catch (e) {
        // Thrown synchronously e.g. on an insecure origin (voice input requires
        // HTTPS or localhost) or if a session is already active at the browser level.
        log('recognition.start() threw synchronously:', e);
        recognitionRef.current = null;
        listeningRef.current = false;
        setError('unknown');
        setErrorMessage("Couldn't start voice input. Voice input requires a secure (HTTPS) connection — please try again.");
      }
    };
  });

  const start = useCallback(() => {
    if (listeningRef.current) {
      log('start() ignored — a session is already active');
      return;
    }
    if (!getRecognitionCtor()) {
      log('start() aborted — unsupported browser');
      setError('unsupported');
      setErrorMessage("Voice input isn't supported in your browser.");
      return;
    }
    log('Microphone clicked');
    setError(null);
    setErrorMessage(null);
    gotResultRef.current = false;
    triedFallbackRef.current = false;
    runSessionRef.current(lang);
  }, [lang]);

  const stop = useCallback(() => {
    log('stop() called explicitly');
    if (!recognitionRef.current) {
      // Nothing active — make sure the UI isn't stuck showing "Listening...".
      if (listeningRef.current) forceReset('stop() called with no active recognition instance');
      return;
    }
    try {
      recognitionRef.current.stop();
    } catch (e) {
      log('stop() threw:', e);
      forceReset('stop() threw synchronously');
    }
    clearWatchdog();
    watchdogTimerRef.current = setTimeout(() => {
      if (listeningRef.current) forceReset('stop() did not resolve in time');
    }, STOP_WATCHDOG_MS);
  }, [clearWatchdog, forceReset]);

  const clearError = useCallback(() => {
    setError(null);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      clearWatchdog();
      if (recognitionRef.current) {
        detach(recognitionRef.current);
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore — instance is being discarded anyway
        }
        recognitionRef.current = null;
      }
      listeningRef.current = false;
    };
  }, [clearSilenceTimer, clearWatchdog]);

  // Mobile browsers suspend/throttle mic capture when the tab or app is
  // backgrounded (app switch, screen lock, incoming call). Stop immediately
  // instead of relying on the watchdog, which can be delayed by timer
  // throttling in a hidden tab.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && recognitionRef.current) {
        log('Tab backgrounded — stopping recognition');
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        detach(recognitionRef.current);
        forceReset('tab backgrounded');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [forceReset]);

  return { isSupported, isListening, interimTranscript, error, errorMessage, start, stop, clearError };
}
