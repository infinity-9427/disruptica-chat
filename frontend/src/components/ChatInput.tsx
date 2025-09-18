import React, { useRef, useEffect, ChangeEvent, KeyboardEvent, FormEvent } from 'react';
import { RiSendPlaneLine } from '@remixicon/react';
import { TooltipButton } from './TooltipButton';

interface ChatInputProps {
  input: string;
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onStop: () => void;
  isLoading: boolean;
}

export function ChatInput({ input, onInputChange, onSubmit, onStop, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = window.innerWidth >= 640 ? 160 : 128;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e);
    autoGrow();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
    if (e.key === 'Escape' && isLoading) onStop();
  };

  useEffect(() => {
    autoGrow();
  }, [input]);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
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
          onChange={handleTextareaChange}
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
          onClick={onStop}
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
  );
}