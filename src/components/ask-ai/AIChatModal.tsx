import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCcw, Info } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInput } from './ChatInput';
import { SuggestionChips } from './SuggestionChips';
import { EligibilityContext } from '@/lib/ai/types';
import { AIAvatar } from './AIAvatar';

const DEFAULT_SUGGESTIONS = [
  'Why am I eligible?',
  'How can I increase my chances?',
  'Can I combine grants?',
  'Which state gives better benefits?',
  'How much deposit do I need?',
];

export const AIChatModal = ({
  isOpen,
  onClose,
  eligibilityProfile,
}: {
  isOpen: boolean;
  onClose: () => void;
  eligibilityProfile?: EligibilityContext;
}) => {
  const { messages, isLoading, sendMessage, stopGeneration, clearHistory, submitFeedback } = useAIChat(eligibilityProfile);
  const synthesis = useSpeechSynthesis();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom smoothly
  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Closing the chat should never leave a response talking in the background.
  const handleClose = useCallback(() => {
    synthesis.stop();
    onClose();
  }, [synthesis, onClose]);

  // A new outgoing message should interrupt whatever is currently being read aloud.
  const handleSend = useCallback((content: string) => {
    synthesis.stop();
    sendMessage(content);
  }, [synthesis, sendMessage]);

  const handleToggleSpeech = useCallback((id: string, content: string) => {
    if (synthesis.speakingId === id && synthesis.isSpeaking) {
      synthesis.stop();
    } else {
      synthesis.speak(content, id);
    }
  }, [synthesis]);

  // Stop speech whenever the modal is closed by any means (not just handleClose)
  useEffect(() => {
    if (!isOpen) {
      synthesis.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle body scroll locking & Escape key (Escape stops speech first, then closes)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (synthesis.isSpeaking) {
          synthesis.stop();
          return;
        }
        handleClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose, synthesis]);

  // Derived active suggestions
  const lastMessage = messages[messages.length - 1];
  const activeSuggestions = !isLoading && lastMessage && lastMessage.followUps && lastMessage.followUps.length > 0
    ? lastMessage.followUps
    : (messages.length === 0 ? DEFAULT_SUGGESTIONS : []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/20 z-[100] backdrop-blur-[2px]"
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
            aria-label="Ask FirstHomeBuyer AI"
            className="fixed inset-0 w-full h-[100dvh] md:inset-y-0 md:left-auto md:right-0 md:w-[420px] lg:w-[55vw] lg:min-w-[720px] lg:max-w-[900px] xl:w-[50vw] 2xl:w-[45vw] z-[101] bg-[#FAFAFA] dark:bg-[#0F172A] flex flex-col overflow-hidden md:border-l border-[#E2E8F0] dark:border-white/10 shadow-2xl box-border"
          >
            {/* 1. Header (Fixed, shrink-0) */}
            <div className="flex items-center justify-between px-4 md:px-5 py-3 h-[64px] w-full box-border bg-white dark:bg-[#0F172A] z-10 shrink-0 border-b border-[#E2E8F0] dark:border-white/5">
              <h2 className="font-bold text-[#1E293B] dark:text-white text-[18px]">Ask FirstHomeBuyer AI</h2>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="p-2 text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                    title="Clear Chat"
                    aria-label="Clear Chat"
                  >
                    <RefreshCcw size={18} />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                  aria-label="Close Chat"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* 2. Suggestion Chips (Fixed, shrink-0) */}
            {activeSuggestions.length > 0 && (
              <div className="py-2 w-full box-border bg-white dark:bg-[#0F172A] shrink-0 border-b border-[#E2E8F0] dark:border-white/5 overflow-hidden">
                <SuggestionChips suggestions={activeSuggestions} onSelect={handleSend} />
              </div>
            )}

            {/* 3. Scrollable Chat Area (flex-1, min-h-0) */}
            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto w-full box-border px-4 md:px-5 py-4 bg-[#FAFAFA] dark:bg-[#0F172A] flex flex-col"
            >
              {messages.length === 0 && (
                <div className="flex flex-col gap-6 mt-4 mb-8 w-full">
                  <div className="flex gap-4 items-start">
                    <AIAvatar size={48} />
                    <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-white/5 rounded-2xl rounded-tl-sm p-5 shadow-sm min-w-0">
                      <p className="text-[#334155] dark:text-[#E2E8F0] text-[15px] font-medium mb-3">
                        👋 Hi! I'm FirstHomeBuyer AI.
                      </p>
                      <p className="text-[#475569] dark:text-[#94A3B8] text-[14px] leading-relaxed mb-4">
                        I can help explain:
                      </p>
                      <ul className="grid grid-cols-1 gap-2 text-[14px] text-[#475569] dark:text-[#94A3B8]">
                        <li className="flex items-center gap-2 min-w-0"><div className="w-1.5 h-1.5 shrink-0 rounded-full bg-[#3B82F6]" /><span className="truncate">Why you're eligible</span></li>
                        <li className="flex items-center gap-2 min-w-0"><div className="w-1.5 h-1.5 shrink-0 rounded-full bg-[#3B82F6]" /><span className="truncate">Ways to improve</span></li>
                        <li className="flex items-center gap-2 min-w-0"><div className="w-1.5 h-1.5 shrink-0 rounded-full bg-[#3B82F6]" /><span className="truncate">Compare grants</span></li>
                        <li className="flex items-center gap-2 min-w-0"><div className="w-1.5 h-1.5 shrink-0 rounded-full bg-[#3B82F6]" /><span className="truncate">Stamp duty questions</span></li>
                        <li className="flex items-center gap-2 min-w-0"><div className="w-1.5 h-1.5 shrink-0 rounded-full bg-[#3B82F6]" /><span className="truncate">Home loans & deposit</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full flex-1 flex flex-col min-w-0">
                {messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    onFeedback={(score) => submitFeedback(msg.id, messages[messages.length - 2]?.content || '', msg.content, score, msg.schemes)}
                    isSpeaking={synthesis.isSpeaking && synthesis.speakingId === msg.id}
                    speechSupported={synthesis.isSupported}
                    onToggleSpeech={() => handleToggleSpeech(msg.id, msg.content)}
                  />
                ))}
                <div ref={scrollEndRef} className="h-4 shrink-0" />
              </div>
            </div>

            {/* 4. Input Area (Fixed, shrink-0, safe-area) */}
            <div className="shrink-0 w-full box-border bg-[#FAFAFA] dark:bg-[#0F172A] pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] px-4 md:px-5">
              <div className="w-full flex flex-col gap-3 min-w-0">
                <ChatInput
                  onSend={handleSend}
                  onStop={stopGeneration}
                  isLoading={isLoading}
                />

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#94A3B8] shrink-0">
                  <Info size={12} className="shrink-0" />
                  <span className="truncate">AI can make mistakes. Please verify important information.</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
