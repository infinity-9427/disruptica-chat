'use client';

import { useEffect, useRef, useState, FormEvent, KeyboardEvent } from 'react';
import {
  RiBrainLine,
  RiSendPlaneLine,
  RiUser3Line,
  RiRobotLine,
} from '@remixicon/react';

type Role = 'user' | 'ai';
type Message = { id: string; role: Role; content: string; timestamp: number };

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [inputHeight, setInputHeight] = useState(0);
  const listEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Calculate and track input area height for dynamic spacing
  useEffect(() => {
    const calculateInputHeight = () => {
      if (footerRef.current) {
        const height = footerRef.current.offsetHeight;
        setInputHeight(height);
      }
    };

    calculateInputHeight();
    
    const resizeObserver = new ResizeObserver(calculateInputHeight);
    if (footerRef.current) {
      resizeObserver.observe(footerRef.current);
    }

    // Handle both window resize and viewport changes (mobile keyboard)
    window.addEventListener('resize', calculateInputHeight);
    window.addEventListener('orientationchange', calculateInputHeight);
    
    // Handle visual viewport changes for mobile keyboards
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', calculateInputHeight);
    }
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateInputHeight);
      window.removeEventListener('orientationchange', calculateInputHeight);
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', calculateInputHeight);
      }
    };
  }, [input]); // Re-calculate when input changes (textarea grows)

  // Auto-grow textarea with responsive max height
  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // Mobile: 128px (8rem), Desktop: 160px (10rem)
    const maxHeight = window.innerWidth >= 640 ? 160 : 128;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoGrow();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  const submit = () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '3rem'; // reset to ~h-12

    // Demo: show typing, then echo
    setIsTyping(true);
    setTimeout(() => {
      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        role: 'ai',
        content: `Not connected to an AI backend yet.\nYou said: "${text}"`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

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
          <div className="h-full grid place-items-center text-center" style={{ height: `calc(100vh - ${inputHeight + 32}px)` }}>
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full grid place-items-center mx-auto mb-4" aria-hidden="true">
                <RiBrainLine className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Start a conversation by typing your message below
              </p>
            </div>
          </div>
        ) : (
          <ol role="feed" aria-live="polite" aria-relevant="additions" className="mx-auto w-full max-w-4xl space-y-3 pb-4">
            {messages.map((m, i) => (
              <li key={m.id} aria-posinset={i + 1} aria-setsize={messages.length}>
                <article className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex items-start gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
                    {m.role === 'ai' && (
                      <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0" aria-hidden="true">
                        <RiRobotLine className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </span>
                    )}
                    <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'} rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 break-words min-w-0`}>
                      <p className="whitespace-pre-wrap text-sm sm:text-base">{m.content}</p>
                      <div className={`text-[10px] sm:text-[11px] mt-1.5 sm:mt-2 opacity-70 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {timeOf(m.timestamp)}
                      </div>
                    </div>
                    {m.role === 'user' && (
                      <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0" aria-hidden="true">
                        <RiUser3Line className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </span>
                    )}
                  </div>
                </article>
              </li>
            ))}

            {isTyping && (
              <li key="typing">
                <article className="flex justify-start">
                  <div className="flex items-start gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
                    <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0" aria-hidden="true">
                      <RiRobotLine className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                    </span>
                    <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3">
                      <TypingDots />
                    </div>
                  </div>
                </article>
              </li>
            )}

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
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl flex items-end gap-2 sm:gap-3" aria-label="Send a message">
          <div className="flex-1">
            <label htmlFor="message" className="sr-only">Message</label>
            <textarea
              ref={textareaRef}
              id="message"
              name="message"
              rows={1}
              placeholder="Type a message..."
              value={input}
              onChange={handleChange}
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
              isTyping ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed scale-95' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            <RiSendPlaneLine className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>

        <p id="input-help" className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center px-2">
          Press Enter to send • Shift + Enter for new line
        </p>
      </footer>
    </div>
  );
}
