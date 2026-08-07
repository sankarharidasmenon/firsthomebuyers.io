/**
 * Shared types for voice features. Kept independent of any single engine
 * (Web Speech API today) so hooks can later swap to Gemini Live, OpenAI
 * Realtime, Azure Speech, or ElevenLabs without touching UI components.
 */

export type SpeechRecognitionErrorCode =
  | 'not-allowed'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'unsupported'
  | 'aborted'
  | 'unknown';

export interface SpeechRecognitionErrorInfo {
  code: SpeechRecognitionErrorCode;
  message: string;
}

export interface VoiceSettings {
  rate?: number;
  pitch?: number;
  volume?: number;
  /** BCP-47 language tag, e.g. 'en-AU' */
  lang?: string;
  /** Preferred voice URI, if the browser exposes one matching it */
  voiceURI?: string;
}

export const DEFAULT_VOICE_SETTINGS: Required<Pick<VoiceSettings, 'rate' | 'pitch' | 'volume'>> = {
  rate: 1,
  pitch: 1,
  volume: 1,
};
