import React, { useState, isValidElement, ReactNode } from 'react';
import { toast } from 'sonner';

type CodeBlockProps = {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  /** React-only marker so <P/> can detect block code; do NOT forward to DOM */
  dataBlockCode?: boolean;
};

// Recursively extract text for the clipboard (keeps UI rendering as React nodes)
function extractText(node: ReactNode): string {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (isValidElement(node)) return extractText((node as any).props?.children);
  return '';
}

export function CodeBlock({ inline, className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  if (inline) {
    return (
      <code className="rounded bg-gray-200/70 dark:bg-gray-800/70 px-1.5 py-0.5 text-[0.85em]">
        {children}
      </code>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(extractText(children));
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
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
