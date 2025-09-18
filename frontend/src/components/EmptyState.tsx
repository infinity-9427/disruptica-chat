import React from 'react';
import { RiBrainLine } from '@remixicon/react';

interface EmptyStateProps {
  topPad: number;
  bottomSafetyPad: number;
}

export function EmptyState({ topPad, bottomSafetyPad }: EmptyStateProps) {
  return (
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
  );
}