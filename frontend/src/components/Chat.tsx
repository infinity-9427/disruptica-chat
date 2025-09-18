'use client';

import {
  useEffect,
  useRef,
  useState,
  FormEvent,
  useCallback,
} from 'react';
import { useCompletion } from '@ai-sdk/react';
import { toast } from 'sonner';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';

type Role = 'user' | 'ai';
type Message = { id: string; role: Role; content: string; timestamp: number };

export default function ChatInterfaceStreamedFormatted() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputHeight, setInputHeight] = useState(0);

  /** follow state controlled by bottom sentinel (IO-based, robust on iOS/zoom) */
  const followRef = useRef(true);

  /** optional top padding if you have a fixed app header (fallback 72px) */
  const [topPad, setTopPad] = useState(72);

  const mainRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    setInput,
  } = useCompletion({
    api: '/api/stream',
    onFinish: (_prompt, final) => {
      if (streamingIdRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingIdRef.current ? { ...m, content: final } : m
          )
        );
        streamingIdRef.current = null;
      }
      // keep following only if user is at bottom
      if (followRef.current) bottomSentinelRef.current?.scrollIntoView({ block: 'end' });
    },
  });

  const streamingIdRef = useRef<string | null>(null);
  const isTyping = isLoading;

  /** read CSS var for fixed header height if present */
  useEffect(() => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--app-header-height').trim();
      const n = parseInt(v, 10);
      if (!Number.isNaN(n) && n >= 0) setTopPad(n || 0);
    } catch { /* noop */ }
  }, []);

  /** IntersectionObserver: detect if bottom is visible */
  useEffect(() => {
    const root = mainRef.current;
    const target = bottomSentinelRef.current;
    if (!root || !target) return;

    // 0.98 makes “almost fully visible” count as visible (helps with fractional pixels)
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        followRef.current = visible;
      },
      { root, threshold: 0.98 }
    );

    io.observe(target);
    return () => io.disconnect();
  }, []);

  /** schedule follow on each frame if following */
  const rafId = useRef<number | null>(null);
  const scheduleFollow = useCallback(() => {
    if (!followRef.current) return; // user scrolled up
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      bottomSentinelRef.current?.scrollIntoView({ block: 'end' });
    });
  }, []);

  /** When messages/token stream/footer height change, follow only if following */
  useEffect(() => {
    scheduleFollow();
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [messages, completion, inputHeight, scheduleFollow]);

  /** If user scrolls, IO will update isFollowing; we don't fight their choice. */
  const handleScroll = () => {
    // nothing needed here; IO handles following state accurately
  };

  /** footer height pad (prevents last bubble under footer) */
  useEffect(() => {
    const calc = () => {
      if (footerRef.current) setInputHeight(footerRef.current.offsetHeight);
    };
    const ro = new ResizeObserver(calc);
    if (footerRef.current) {
      ro.observe(footerRef.current);
    }

    window.addEventListener('resize', calc);
    window.addEventListener('orientationchange', calc);
    if ('visualViewport' in window) window.visualViewport?.addEventListener('resize', calc);

    calc();
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', calc);
      window.removeEventListener('orientationchange', calc);
      if ('visualViewport' in window) window.visualViewport?.removeEventListener('resize', calc);
    };
  }, [input]);


  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) {
      toast.error('Please enter a prompt');
      return;
    }
    try {
      // Sending implies we want to follow the reply
      followRef.current = true;

      const userMsg: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      const aiMsgId = `ai_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const aiMsg: Message = {
        id: aiMsgId,
        role: 'ai',
        content: '',
        timestamp: Date.now(),
      };
      setMessages((p) => [...p, userMsg, aiMsg]);
      streamingIdRef.current = aiMsgId;

      setInput('');

      handleSubmit(e);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error starting stream';
      toast.error('Stream error', { description: msg });
      if (streamingIdRef.current) {
        setMessages((p) => p.filter((m) => m.id !== streamingIdRef.current));
        streamingIdRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (!streamingIdRef.current) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === streamingIdRef.current ? { ...m, content: completion } : m
      )
    );
  }, [completion]);

  /** error toasts */
  useEffect(() => {
    if (!error) return;
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('quota')) {
      toast.error('Rate limit exceeded', {
        description: 'Please wait before trying again',
        duration: 4000,
      });
    } else if (msg.includes('auth')) {
      toast.error('Authentication failed', {
        description: 'Please check your API configuration',
        duration: 4000,
      });
    } else {
      toast.error('Stream error', {
        description: error.message || 'Something went wrong. Please try again.',
        duration: 3000,
      });
    }
  }, [error]);


  const bottomSafetyPad = inputHeight + 28;

  return (
    <div className="relative h-screen w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Messages */}
      <main
        ref={mainRef}
        id="main-content"
        role="main"
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-3 py-4 [scrollbar-gutter:stable] touch-pan-y"
        style={{
          paddingTop: `calc(${topPad}px + env(safe-area-inset-top))`,
          paddingBottom: `${bottomSafetyPad}px`,
        }}
        aria-busy={isTyping}
      >
        {messages.length === 0 ? (
          <EmptyState topPad={topPad} bottomSafetyPad={bottomSafetyPad} />
        ) : (
          <ol
            role="feed"
            aria-live="polite"
            aria-relevant="additions"
            className="mx-auto w-full max-w-4xl space-y-3 pb-4"
          >
            {messages.map((m, i) => {
              const isStreamTarget = m.id === streamingIdRef.current;
              const showTypingDots = isTyping && isStreamTarget && !m.content.length;

              return (
                <li key={m.id} aria-posinset={i + 1} aria-setsize={messages.length}>
                  <MessageBubble
                    role={m.role}
                    content={m.content}
                    timestamp={m.timestamp}
                    showTypingDots={showTypingDots}
                  />
                </li>
              );
            })}
            <div ref={bottomSentinelRef} className="h-2" />
          </ol>
        )}
      </main>

      {/* Input */}
      <footer
        ref={footerRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg shadow-gray-200/20 dark:shadow-gray-950/40 p-3 sm:p-4"
        style={{ paddingBottom: `max(0.75rem, env(safe-area-inset-bottom))` }}
      >
        <ChatInput
          input={input}
          onInputChange={handleInputChange}
          onSubmit={onFormSubmit}
          onStop={stop}
          isLoading={isLoading}
        />

        <p id="input-help" className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center px-2">
          Press Enter to send • Shift + Enter for new line • Esc to stop
        </p>
      </footer>
    </div>
  );
}
