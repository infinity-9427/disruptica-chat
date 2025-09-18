'use client';

import {
  useEffect,
  useRef,
  useState,
  FormEvent,
  KeyboardEvent,
  ChangeEvent,
  ReactNode,
  Children,
  isValidElement,
} from 'react';
import {
  RiBrainLine,
  RiSendPlaneLine,
  RiUser3Line,
  RiRobotLine,
} from '@remixicon/react';
import { useCompletion } from '@ai-sdk/react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

type Role = 'user' | 'ai';
type Message = { id: string; role: Role; content: string; timestamp: number };

/** Tooltip (Send/Stop) */
function TooltipButton({
  title,
  className,
  children,
  ...buttonProps
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { title: string }) {
  return (
    <div className="relative group inline-grid">
      <button
        {...buttonProps}
        aria-label={title}
        title={title}
        className={className}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2
                   whitespace-nowrap rounded-md bg-gray-900 text-white
                   text-xs px-2 py-1 shadow transition-opacity
                   opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {title}
        <i className="absolute -bottom-1 left-1/2 -translate-x-1/2 block w-2 h-2 rotate-45 bg-gray-900" />
      </span>
    </div>
  );
}

/** Hydration-safe paragraph wrapper (pre must not be inside p) */
function hasBlockCode(node: ReactNode): boolean {
  let found = false;
  Children.forEach(node as any, (child) => {
    if (!child || typeof child === 'string' || typeof child === 'number') return;
    if (isValidElement(child)) {
      if (child.props?.['data-block-code']) {
        found = true;
        return;
      }
      if (child.props?.children && hasBlockCode(child.props.children)) {
        found = true;
      }
    }
  });
  return found;
}
function P({ children }: { children: ReactNode }) {
  const cls = 'text-sm sm:text-base leading-6 mb-2';
  return hasBlockCode(children) ? <div className={cls}>{children}</div> : <p className={cls}>{children}</p>;
}

export default function ChatInterfaceStreamedFormatted() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputHeight, setInputHeight] = useState(0);

  /** follow state controlled by bottom sentinel (IO-based, robust on iOS/zoom) */
  const [isFollowing, setIsFollowing] = useState(true); // true when bottom sentinel is visible
  const followRef = useRef(true);                       // mirror in ref for effects

  /** optional top padding if you have a fixed app header (fallback 72px) */
  const [topPad, setTopPad] = useState(72);

  const mainRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
        setIsFollowing(visible);
      },
      { root, threshold: 0.98 }
    );

    io.observe(target);
    return () => io.disconnect();
  }, []);

  /** schedule follow on each frame if following */
  const rafId = useRef<number | null>(null);
  const scheduleFollow = () => {
    if (!followRef.current) return; // user scrolled up
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      bottomSentinelRef.current?.scrollIntoView({ block: 'end' });
    });
  };

  /** When messages/token stream/footer height change, follow only if following */
  useEffect(() => {
    scheduleFollow();
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, completion, inputHeight]);

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
    footerRef.current && ro.observe(footerRef.current);

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

  /** auto-grow textarea */
  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = window.innerWidth >= 640 ? 160 : 128;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  };

  const onTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
    autoGrow();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
    if (e.key === 'Escape' && isLoading) stop();
  };

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
      setIsFollowing(true);

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
      if (textareaRef.current) textareaRef.current.style.height = '3rem';

      await handleSubmit(e);
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

  const timeOf = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const TypingDots = () => (
    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:200ms]" />
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:400ms]" />
    </div>
  );

  function CodeBlock({
    inline,
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) {
    const [copied, setCopied] = useState(false);
    const code = String(children ?? '');
    if (inline) {
      return (
        <code
          className="rounded bg-gray-200/70 dark:bg-gray-800/70 px-1.5 py-0.5 text-[0.85em]"
          {...props}
        >
          {children}
        </code>
      );
    }
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch {
        toast.error('Unable to copy code');
      }
    };
    return (
      <div data-block-code className="relative group">
        <button
          type="button"
          onClick={copy}
          className="cursor-pointer absolute top-2 right-2 text-xs rounded px-2 py-1 bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Copy code"
          title="Copy code"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <pre className="overflow-x-auto rounded-lg bg-black/90 text-white text-[0.9em] p-3 sm:p-4">
          <code className={className}>{code}</code>
        </pre>
      </div>
    );
  }

  const MD = ({ children }: { children: string }) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        p: P,
        h1: ({ children }) => <h1 className="text-lg sm:text-xl font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base sm:text-lg font-semibold mt-3 mb-1.5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm sm:text-base font-semibold mt-2 mb-1">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-2">{children}</ol>,
        li: ({ children }) => <li className="text-sm sm:text-base">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-400 pl-3 sm:pl-4 italic text-gray-700 dark:text-gray-200 my-2">
            {children}
          </blockquote>
        ),
        a: (props) => (
          <a
            {...props}
            className="underline underline-offset-2 hover:no-underline text-blue-600 dark:text-blue-300 break-words"
            target="_blank"
            rel="noreferrer nofollow"
          />
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border px-2 py-1 bg-gray-100 dark:bg-gray-800 text-left">{children}</th>
        ),
        td: ({ children }) => <td className="border px-2 py-1 align-top">{children}</td>,
        code: CodeBlock as any,
      }}
    >
      {children}
    </ReactMarkdown>
  );

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
          <div
            className="h-full grid place-items-center text-center"
            style={{ height: `calc(100vh - ${bottomSafetyPad + topPad + 16}px)` }}
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
              const showTypingDots = isTyping && isStreamTarget && !m.content.length;

              return (
                <li key={m.id} aria-posinset={i + 1} aria-setsize={messages.length}>
                  <article className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-start gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
                      {m.role === 'ai' && (
                        <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0" aria-hidden="true">
                          <RiRobotLine className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        </span>
                      )}
                      <div
                        className={`${
                          m.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        } rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 break-words min-w-0 w-full`}
                      >
                        {showTypingDots ? (
                          <TypingDots />
                        ) : m.role === 'ai' ? (
                          <div className="text-sm sm:text-base">
                            <MD>{m.content}</MD>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm sm:text-base">{m.content}</p>
                        )}
                        <div className={`text-[10px] sm:text-[11px] mt-1.5 sm:mt-2 opacity-70 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {timeOf(m.timestamp)}
                        </div>
                      </div>
                      {m.role === 'user' && (
                        <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0">
                          <RiUser3Line className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        </span>
                      )}
                    </div>
                  </article>
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
        <form
          ref={formRef}
          onSubmit={onFormSubmit}
          className="mx-auto max-w-4xl flex items-end gap-2 sm:gap-3"
          aria-label="Send a message"
        >
          <div className="flex-1">
            <label htmlFor="message" className="sr-only">Message</label>
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

          {isLoading ? (
            <TooltipButton
              title="Stop"
              type="button"
              onClick={stop}
              className="cursor-pointer size-10 sm:size-12 grid place-items-center rounded-full shadow-lg text-white transition-all duration-200 flex-shrink-0 bg-red-600 hover:bg-red-700 active:scale-95"
            >
              <span className="block w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white rounded-[2px]" />
            </TooltipButton>
          ) : (
            <TooltipButton
              title="Send"
              type="submit"
              className="cursor-pointer size-10 sm:size-12 grid place-items-center rounded-full shadow-lg text-white transition-all duration-200 flex-shrink-0 bg-blue-600 hover:bg-blue-700 active:scale-95"
            >
              <RiSendPlaneLine className="w-4 h-4 sm:w-5 sm:h-5" />
            </TooltipButton>
          )}
        </form>

        <p id="input-help" className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center px-2">
          Press Enter to send • Shift + Enter for new line • Esc to stop
        </p>
      </footer>
    </div>
  );
}
