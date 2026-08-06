import { ChatMessage } from '@/lib/ai/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ThumbsUp, ThumbsDown, Copy, Check, Volume2, CircleStop } from 'lucide-react';
import { useState, memo } from 'react';
import { SchemeReferenceCard } from './SchemeReferenceCard';
import { AIAvatar } from './AIAvatar';
import { motion } from 'framer-motion';

export const ChatMessageBubble = memo(({
  message,
  onFeedback,
  isSpeaking = false,
  speechSupported = false,
  onToggleSpeech,
}: {
  message: ChatMessage;
  onFeedback?: (score: 1 | -1) => void;
  isSpeaking?: boolean;
  speechSupported?: boolean;
  onToggleSpeech?: () => void;
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

  const handleCopy = () => {
    // navigator.clipboard is undefined on insecure origins/older browsers,
    // and writeText() can reject even when present — guard both.
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(message.content).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        // Clipboard write denied/unsupported — fail silently, button stays "Copy".
      }
    );
  };

  const handleFeedback = (score: 1 | -1) => {
    if (feedbackGiven) return;
    setFeedbackGiven(score === 1 ? 'up' : 'down');
    if (onFeedback) onFeedback(score);
  };

  return (
    <div className={`flex w-full min-w-0 box-border ${isUser ? 'justify-end' : 'justify-start'} mb-8`}>
      <div className={`flex gap-3 min-w-0 box-border w-full sm:w-auto ${isUser ? 'max-w-[90%] md:max-w-[75%] flex-row-reverse' : 'max-w-[95%] lg:max-w-[95%] flex-row'}`}>
        
        {!isUser && (
          <div className="mt-1 shrink-0">
            <AIAvatar size={32} />
          </div>
        )}

        <div className="flex flex-col gap-2 min-w-0 box-border w-full">
          <div
            className={`
              px-4 md:px-5 lg:px-6 py-4 md:py-5 lg:py-6 shadow-sm text-[14px] md:text-[15px] lg:text-[16px] leading-relaxed min-w-0 break-words box-border w-full transition-shadow
              ${isUser
                ? 'bg-[#F4F8FF] dark:bg-[#1E3A8A] text-[#1E293B] dark:text-[#E2E8F0] rounded-[24px] rounded-br-[4px]'
                : 'bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-white/5 text-[#334155] dark:text-[#E2E8F0] rounded-[24px] rounded-tl-[4px]'
              }
              ${isSpeaking ? 'ring-2 ring-[#3B82F6] ring-offset-2 ring-offset-[#FAFAFA] dark:ring-offset-[#0F172A]' : ''}
            `}
          >
            {message.content ? (
              <div className={`prose prose-sm max-w-none min-w-0 break-words overflow-hidden [overflow-wrap:anywhere] ${isUser ? 'prose-p:text-[#1E293B] dark:prose-p:text-white prose-p:my-0' : 'dark:prose-invert'} prose-p:leading-relaxed prose-pre:bg-black/5 prose-pre:text-current prose-pre:max-w-full prose-pre:overflow-x-auto prose-table:overflow-x-auto prose-table:block prose-table:w-full prose-img:max-w-full prose-img:rounded-xl prose-li:my-1`}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    ul: ({node, ...props}) => <ul className="pl-0 space-y-2 list-none" {...props} />,
                    li: ({node, ...props}) => (
                      <li className="flex items-start gap-2">
                        <Check size={16} className="text-[#16A34A] shrink-0 mt-0.5" strokeWidth={3} />
                        <span>{props.children}</span>
                      </li>
                    )
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 h-6 px-1">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-[#94A3B8] rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay }}
                  />
                ))}
              </div>
            )}

            {!isUser && message.schemes && message.schemes.length > 0 && (
              <div className="flex flex-col gap-2 mt-4 w-full box-border">
                {message.schemes.map((id) => (
                  <SchemeReferenceCard key={id} schemeId={id} />
                ))}
              </div>
            )}

            {!isUser && message.content && (
              <div className="flex items-center justify-center gap-3 mt-6 mb-2">
                <span className="text-[13px] font-medium text-[#475569] dark:text-[#94A3B8]">Was this helpful?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFeedback(1)}
                    disabled={!!feedbackGiven}
                    className={`p-2 rounded-full transition-colors border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-sm ${feedbackGiven === 'up' ? 'text-[#16A34A] border-[#16A34A]' : 'text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155]'}`}
                  >
                    <ThumbsUp size={16} />
                  </button>
                  <button
                    onClick={() => handleFeedback(-1)}
                    disabled={!!feedbackGiven}
                    className={`p-2 rounded-full transition-colors border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-sm ${feedbackGiven === 'down' ? 'text-[#DC2626] border-[#DC2626]' : 'text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155]'}`}
                  >
                    <ThumbsDown size={16} />
                  </button>
                </div>
              </div>
            )}

            {!isUser && message.content && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-sm text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors"
                  aria-label="Copy response"
                >
                  {copied ? <Check size={14} className="text-[#16A34A]" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {speechSupported && (
                  <button
                    onClick={onToggleSpeech}
                    aria-pressed={isSpeaking}
                    aria-label={isSpeaking ? 'Stop reading response aloud' : 'Read response aloud'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm text-[12px] font-medium transition-colors ${
                      isSpeaking
                        ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                        : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155]'
                    }`}
                  >
                    {isSpeaking ? <CircleStop size={14} /> : <Volume2 size={14} />}
                    <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  // Memo comparison logic: re-render only if content, schemes, or speaking state changes
  return prev.message.content === next.message.content &&
         prev.message.schemes?.length === next.message.schemes?.length &&
         prev.message.followUps?.length === next.message.followUps?.length &&
         prev.isSpeaking === next.isSpeaking &&
         prev.speechSupported === next.speechSupported;
});
