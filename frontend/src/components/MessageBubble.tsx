import React from 'react';
import { RiRobotLine, RiUser3Line } from '@remixicon/react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TypingIndicator } from './TypingIndicator';

type Role = 'user' | 'ai';

interface MessageBubbleProps {
  role: Role;
  content: string;
  timestamp: number;
  showTypingDots?: boolean;
}

export function MessageBubble({ role, content, timestamp, showTypingDots }: MessageBubbleProps) {
  const timeOf = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <article className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className="flex items-start gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
        {role === 'ai' && (
          <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0" aria-hidden="true">
            <RiRobotLine className="w-4 h-4 text-blue-600 dark:text-blue-300" />
          </span>
        )}
        <div
          className={`${
            role === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
          } rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 break-words min-w-0 w-full`}
        >
          {showTypingDots ? (
            <TypingIndicator />
          ) : role === 'ai' ? (
            <div className="text-sm sm:text-base">
              <MarkdownRenderer>{content}</MarkdownRenderer>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm sm:text-base">{content}</p>
          )}
          <div className={`text-[10px] sm:text-[11px] mt-1.5 sm:mt-2 opacity-70 ${role === 'user' ? 'text-right' : 'text-left'}`}>
            {timeOf(timestamp)}
          </div>
        </div>
        {role === 'user' && (
          <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0">
            <RiUser3Line className="w-4 h-4 text-blue-600 dark:text-blue-300" />
          </span>
        )}
      </div>
    </article>
  );
}