'use client';

import {
  useEffect,
  useRef,
  useState,
  FormEvent,
  KeyboardEvent,
  ChangeEvent,
} from 'react';
import {
  RiBrainLine,
  RiSendPlaneLine,
  RiUser3Line,
  RiRobotLine,
} from '@remixicon/react';
import { useCompletion } from '@ai-sdk/react';
import { toast } from 'sonner';

type Role = 'user' | 'ai';
type Message = { id: string; role: Role; content: string; timestamp: number };

export default function ChatInterfaceStreamed() {
  // --- UI state (from your first component)
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputHeight, setInputHeight] = useState(0);
  const listEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // --- Streaming state (Vercel AI SDK)
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit, // call this inside our onSubmit wrapper
    isLoading,
    error,
    stop,
    setInput,
  } = useCompletion({
    api: '/api/stream',
    onError: (err) => {
      // also handled by useEffect below, but keep for robustness
      console.error(err);
    },
    onFinish: (_prompt, finalCompletion) => {
      // Ensure the last AI message is finalized (in case a late effect missed)
      if (streamingIdRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingIdRef.current ? { ...m, content: finalCompletion } : m
          )
        );
        streamingIdRef.current = null;
      }
    },
  });

  // Mirror isLoading -> your original "isTyping" UX flag
  const isTyping = isLoading;

  // Track which message is receiving the current stream
  const streamingIdRef = useRef<string | null>(null);

  // Smooth scroll to bottom on new messages or typing status
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, completion]);

  // Footer height measurement (kept from your first)
  useEffect(() => {
    const calculateInputHeight = () => {
      if (footerRef.current) {
        setInputHeight(footerRef.current.offsetHeight);
      }
    };
    const resizeObserver = new ResizeObserver(calculateInputHeight);
    footerRef.current && resizeObserver.observe(footerRef.current);

    window.addEventListener('resize', calculateInputHeight);
    window.addEventListener('orientationchange', calculateInputHeight);

    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', calculateInputHeight);
    }

    // Initial
    calculateInputHeight();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateInputHeight);
      window.removeEventListener('orientationchange', calculateInputHeight);
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', calculateInputHeight);
      }
    };
  }, [input]); // re-calc as the textarea grows

  // Auto-grow textarea (unchanged)
  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = window.innerWidth >= 640 ? 160 : 128; // 10rem / 8rem
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  };

  // Wrap the SDK input change to keep your auto-grow behavior
  const onTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
    autoGrow();
  };

  // Press Enter to submit; Shift+Enter makes a newline (unchanged UX)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
    // Optional: ESC to stop streaming (no UI change)
    if (e.key === 'Escape' && isLoading) {
      stop();
    }
  };

  // Submit wrapper: keeps your UI logic + calls AI SDK's handleSubmit
  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) {
      toast.error('Please enter a prompt');
      return;
    }

    // 1) Push user message
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    // 2) Create placeholder AI message that will stream
    const aiMsgId = `ai_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'ai',
      content: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    streamingIdRef.current = aiMsgId;

    // 3) Clear input + reset textarea height (same as your first)
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '3rem';

    // 4) Fire the streaming request
    handleSubmit(e);
  };

  // As tokens stream in, mirror them into the placeholder AI message
  useEffect(() => {
    if (!streamingIdRef.current) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === streamingIdRef.current ? { ...m, content: completion } : m
      )
    );
  }, [completion]);

  // Error toasts (from your second component)
  useEffect(() => {
    if (!error) return;
    const msg = error.message || 'Something went wrong. Please try again.';
    if (msg.toLowerCase().includes('quota')) {
      toast.error('Rate limit exceeded', {
        description: 'Please wait before trying again',
        duration: 4000,
      });
    } else if (msg.toLowerCase().includes('auth')) {
      toast.error('Authentication failed', {
        description: 'Please check your API configuration',
        duration: 4000,
      });
    } else {
      toast.error('Stream error', { description: msg, duration: 3000 });
    }
  }, [error]);

  const timeOf = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const TypingDots = () => (
    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:200ms]" />
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:400ms]" />
    </div>
  );

  return (
    <div className="relative h-screen w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Messages - with dynamic bottom padding */}
      <main
        id="main-content"
        role="main"
        className="h-full overflow-y-auto px-3 py-4"
        style={{ paddingBottom: `${inputHeight + 16}px` }}
        aria-busy={isTyping}
      >
        {messages.length === 0 ? (
          <div
            className="h-full grid place-items-center text-center"
            style={{ height: `calc(100vh - ${inputHeight + 32}px)` }}
          >
            <div>
              <div
                className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full grid place-items-center mx-auto mb-4"
                aria-hidden="true"
              >
                <RiBrainLine className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Start a conversation by typing your message below
              </p>
            </div>
          </div>
        ) : (
          <ol
            role="feed"
            aria-live="polite"
            aria-relevant="additions"
            className="mx-auto w-full max-w-4xl space-y-3 pb-4"
          >
            {messages.map((m, i) => {
              const isStreamTarget = m.id === streamingIdRef.current;
              const showTypingDots =
                isTyping && isStreamTarget && !m.content.length; // dots only before first token

              return (
                <li key={m.id} aria-posinset={i + 1} aria-setsize={messages.length}>
                  <article
                    className={`flex ${
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className="flex items-start gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
                      {m.role === 'ai' && (
                        <span
                          className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0"
                          aria-hidden="true"
                        >
                          <RiRobotLine className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        </span>
                      )}
                      <div
                        className={`${
                          m.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        } rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 break-words min-w-0`}
                      >
                        {showTypingDots ? (
                          <TypingDots />
                        ) : (
                          <p className="whitespace-pre-wrap text-sm sm:text-base">
                            {m.content}
                          </p>
                        )}
                        <div
                          className={`text-[10px] sm:text-[11px] mt-1.5 sm:mt-2 opacity-70 ${
                            m.role === 'user' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {timeOf(m.timestamp)}
                        </div>
                      </div>
                      {m.role === 'user' && (
                        <span
                          className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0"
                          aria-hidden="true"
                        >
                          <RiUser3Line className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        </span>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}

            <div ref={listEndRef} />
          </ol>
        )}
      </main>

      {/* Input - Fixed at bottom */}
      <footer
        ref={footerRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg shadow-gray-200/20 dark:shadow-gray-950/40 p-3 sm:p-4"
        style={{ paddingBottom: `max(0.75rem, env(safe-area-inset-bottom))` }}
      >
        <form
          ref={formRef}
          onSubmit={onFormSubmit}
          className="mx-auto max-w-4xl flex items-end gap-2 sm:gap-3"
          aria-label="Send a message"
        >
          <div className="flex-1">
            <label htmlFor="message" className="sr-only">
              Message
            </label>
            <textarea
              ref={textareaRef}
              id="message"
              name="message"
              rows={1}
              placeholder="Type a message..."
              value={input}
              onChange={onTextareaChange}
              onKeyDown={handleKeyDown}
              aria-describedby="input-help"
              autoComplete="off"
              className="block w-full h-12 min-h-12 max-h-32 sm:max-h-40 px-3 sm:px-4 py-3 leading-snug bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 overflow-y-auto text-sm sm:text-base"
            />
          </div>

          <button
            type="submit"
            aria-label="Send message"
            title="Send"
            disabled={isTyping}
            className={`size-10 sm:size-12 grid place-items-center rounded-full shadow-lg text-white transition-all duration-200 flex-shrink-0 ${
              isTyping
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed scale-95'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            <RiSendPlaneLine className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>

        <p
          id="input-help"
          className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center px-2"
        >
          Press Enter to send • Shift + Enter for new line
        </p>
      </footer>
    </div>
  );
}
