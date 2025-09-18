import React from 'react';

interface TooltipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
}

export function TooltipButton({
  title,
  className,
  children,
  ...buttonProps
}: TooltipButtonProps) {
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