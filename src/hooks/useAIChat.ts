import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, EligibilityContext } from '@/lib/ai/types';

const STORAGE_KEY = 'firsthome_ai_chat_history';

export function useAIChat(eligibilityProfile?: EligibilityContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
  }, []);

  // Save history on change
  useEffect(() => {
    try {
      // Keep only last 20 messages
      const recentMessages = messages.slice(-20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentMessages));
    } catch (e) {
      console.error('Failed to save chat history', e);
    }
  }, [messages]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    // We prepare a placeholder for the assistant response
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      schemes: [],
      followUps: [],
    };
    
    setMessages(prev => [...prev, assistantMessage]);

    abortControllerRef.current = new AbortController();

    try {
      // Create a snapshot of the history (excluding the new assistant message) to send
      // Ensure we don't send too much history
      const historyToSend = messages.slice(-15);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: historyToSend,
          eligibilityProfile,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let friendlyMessage = "Something went wrong while processing your request. Please try again later.";
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            friendlyMessage = errorData.message;
          }
        } catch (e) {
          // Ignored, fallback to generic friendly message
        }

        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { 
                  ...msg, 
                  content: friendlyMessage, 
                  schemes: [], 
                  followUps: [
                    "What grants are available in my state?",
                    "How much deposit do I need?",
                    "How does the Home Guarantee Scheme work?"
                  ] 
                }
              : msg
          )
        );
        return; // Exit normally to stop streaming gracefully
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by the browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        streamedResponse += chunkText;

        // Parse streamed response.
        // We look for __METADATA__ to separate text from JSON
        let displayContent = streamedResponse;
        let parsedSchemes: string[] = [];
        let parsedFollowUps: string[] = [];

        const metaIdx = streamedResponse.indexOf('__METADATA__');
        if (metaIdx !== -1) {
          displayContent = streamedResponse.substring(0, metaIdx).trim();
          const metaJsonStr = streamedResponse.substring(metaIdx + '__METADATA__'.length).trim();
          try {
            // It might be incomplete JSON if stream is still going, so we only try-catch
            if (metaJsonStr.endsWith('}')) {
               const meta = JSON.parse(metaJsonStr);
               parsedSchemes = meta.referencedSchemes || [];
               parsedFollowUps = meta.followUps || [];
            }
          } catch (e) {
            // Ignore incomplete JSON parsing errors during stream
          }
        }

        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: displayContent, schemes: parsedSchemes, followUps: parsedFollowUps }
              : msg
          )
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation stopped by user');
      } else {
        console.error('Chat error:', err);
        setError(err.message || 'An error occurred while generating the response.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const submitFeedback = async (messageId: string, question: string, aiAnswer: string, score: 1 | -1, schemes?: string[]) => {
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          aiAnswer,
          feedbackScore: score,
          referencedSchemes: schemes || [],
        }),
      });
    } catch (e) {
      console.error('Failed to submit feedback:', e);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    clearHistory,
    submitFeedback,
  };
}
