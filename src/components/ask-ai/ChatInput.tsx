import { useState, useRef, useEffect } from 'react';
import { Send, Square, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

export const ChatInput = ({
  onSend,
  onStop,
  isLoading,
  /**
   * Config flag: false (default) = voice fills the input and the user
   * presses Send manually. true = the message is sent automatically as
   * soon as the final transcript is recognized.
   */
  autoSendVoiceMessage = false,
}: {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  autoSendVoiceMessage?: boolean;
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingAutoSendRef = useRef(false);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  const {
    isSupported: isMicSupported,
    isListening,
    interimTranscript,
    errorMessage: micErrorMessage,
    start: startListening,
    stop: stopListening,
    clearError: clearMicError,
  } = useSpeechRecognition({
    lang: 'en-AU',
    fallbackLang: 'en-US',
    onResult: (finalText) => {
      setInput((prev) => {
        const combined = prev.trim() ? `${prev.trim()} ${finalText}` : finalText;
        if (autoSendVoiceMessage) pendingAutoSendRef.current = true;
        return combined;
      });
    },
  });

  // Auto-send runs as an effect (not inside the setInput updater above) so it
  // reads the fully-committed input value and stays a well-behaved side effect.
  // isLoading is a dependency too: if the transcript arrives while a previous
  // AI response is still streaming, the pending flag must be re-checked once
  // isLoading turns false, otherwise the send would be stranded forever.
  useEffect(() => {
    if (pendingAutoSendRef.current && input.trim() && !isLoading) {
      pendingAutoSendRef.current = false;
      handleSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Global Alt+M shortcut to toggle voice input while the chat is open.
  useEffect(() => {
    if (!isMicSupported) return;
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        handleMicToggle();
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMicSupported, isListening]);

  // Auto-dismiss voice input error messages
  useEffect(() => {
    if (!micErrorMessage) return;
    const timer = setTimeout(() => clearMicError(), 4500);
    return () => clearTimeout(timer);
  }, [micErrorMessage, clearMicError]);

  return (
    <div className="relative w-full">
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full flex justify-center w-full px-4 pointer-events-none"
          >
            <div className="bg-[#1E293B] text-white text-[13px] px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 max-w-full">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#60A5FA] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3B82F6]" />
              </span>
              <span className="truncate">
                {interimTranscript ? `"${interimTranscript}"` : 'Listening…'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-full px-2 py-1 shadow-sm focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/10 transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening…' : 'Ask another question...'}
          className="flex-1 max-h-[120px] min-h-[44px] py-3 pl-4 bg-transparent border-none outline-none resize-none text-[15px] text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] scrollbar-hide flex items-center"
          rows={1}
          style={{ lineHeight: '1.5', paddingTop: '11px' }}
        />

        {isMicSupported && (
          <button
            type="button"
            onClick={handleMicToggle}
            aria-pressed={isListening}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input (Alt+M)'}
            title={isListening ? 'Stop listening' : 'Voice input (Alt+M)'}
            className={`h-[44px] w-[44px] shrink-0 flex items-center justify-center rounded-full transition-colors mx-0.5 disabled:opacity-40 ${
              isListening
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'bg-transparent text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155]'
            }`}
          >
            <motion.span
              animate={isListening ? { scale: [1, 1.18, 1] } : { scale: 1 }}
              transition={isListening ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : {}}
              className="flex items-center justify-center"
            >
              <Mic size={18} />
            </motion.span>
          </button>
        )}

        {isLoading ? (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={onStop}
            className="h-[44px] w-[44px] shrink-0 flex items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-[#334155] hover:bg-[#E2E8F0] dark:hover:bg-[#475569] text-[#475569] dark:text-[#CBD5E1] transition-colors mx-1"
            title="Stop generating"
            aria-label="Stop generating"
          >
            <Square size={18} fill="currentColor" />
          </motion.button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-[44px] w-[44px] shrink-0 flex items-center justify-center rounded-full bg-[#3B82F6] disabled:bg-[#E2E8F0] dark:disabled:bg-[#334155] text-white disabled:text-[#94A3B8] transition-colors shadow-sm mx-1"
            aria-label="Send message"
          >
            <Send size={18} className={input.trim() ? "translate-x-[1px] translate-y-[1px]" : ""} />
          </button>
        )}
      </div>

      {micErrorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-2 text-[12px] text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] dark:bg-[#78350F]/20 dark:border-[#92400E] dark:text-[#FBBF24] rounded-lg px-3 py-2"
        >
          {micErrorMessage}
        </div>
      )}
    </div>
  );
};
