import React, { ReactNode, Children, isValidElement } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { CodeBlock } from './CodeBlock';

// TS-safe search for block code descendants
function hasBlockCode(node: ReactNode): boolean {
  let found = false;
  Children.forEach(node as any, (child) => {
    if (!child || typeof child === 'string' || typeof child === 'number') return;

    if (isValidElement(child)) {
      const el = child as React.ReactElement<any>; // <- tell TS we accept any props

      // React-only marker from our <CodeBlock dataBlockCode />
      if ((el.props as any)?.dataBlockCode === true) {
        found = true;
        return;
      }
      // Recurse
      if ((el.props as any)?.children && hasBlockCode((el.props as any).children)) {
        found = true;
      }
    }
  });
  return found;
}

// Paragraph wrapper that swaps to <div> when a block code is inside
function P(props: { children?: React.ReactNode }) {
  const { children } = props;
  const cls = 'text-sm sm:text-base leading-6 mb-2';
  return hasBlockCode(children) ? <div className={cls}>{children}</div> : <p className={cls}>{children}</p>;
}

// Renderers (typed loosely to avoid generic mismatch noise)
const H1 = ({ children, ...rest }: any) => <h1 {...rest} className="text-lg sm:text-xl font-bold mb-2">{children}</h1>;
const H2 = ({ children, ...rest }: any) => <h2 {...rest} className="text-base sm:text-lg font-semibold mt-3 mb-1.5">{children}</h2>;
const H3 = ({ children, ...rest }: any) => <h3 {...rest} className="text-sm sm:text-base font-semibold mt-2 mb-1">{children}</h3>;
const UL = ({ children, ...rest }: any) => <ul {...rest} className="list-disc pl-5 space-y-1 mb-2">{children}</ul>;
const OL = ({ children, ...rest }: any) => <ol {...rest} className="list-decimal pl-5 space-y-1 mb-2">{children}</ol>;
const LI = ({ children, ...rest }: any) => <li {...rest} className="text-sm sm:text-base">{children}</li>;
const BLOCKQUOTE = ({ children, ...rest }: any) => (
  <blockquote {...rest} className="border-l-4 border-blue-400 pl-3 sm:pl-4 italic text-gray-700 dark:text-gray-200 my-2">
    {children}
  </blockquote>
);
const A = (props: any) => (
  <a
    {...props}
    className="underline underline-offset-2 hover:no-underline text-blue-600 dark:text-blue-300 break-words"
    target="_blank"
    rel="noreferrer nofollow"
  />
);
const TABLE = ({ children, ...rest }: any) => (
  <div className="overflow-x-auto my-2">
    <table {...rest} className="w-full text-sm border-collapse">{children}</table>
  </div>
);
const TH = ({ children, ...rest }: any) => <th {...rest} className="border px-2 py-1 bg-gray-100 dark:bg-gray-800 text-left">{children}</th>;
const TD = ({ children, ...rest }: any) => <td {...rest} className="border px-2 py-1 align-top">{children}</td>;

// The components map, cast to `Components` to satisfy react-markdown's typings.
const components: Components = {
  p: P as any,

  // IMPORTANT: Default undefined -> inline. Only `inline === false` is block.
  code: (props: any) => {
    const isInline = props.inline ?? true;
    const { className, children: codeChildren } = props;

    if (isInline) {
      return (
        <CodeBlock inline className={className}>
          {codeChildren}
        </CodeBlock>
      );
    }

    // Block code -> mark so <P/> renders a <div> container (prevents <p><pre/>)
    return (
      <CodeBlock className={className} dataBlockCode>
        {codeChildren}
      </CodeBlock>
    );
  },

  h1: H1 as any,
  h2: H2 as any,
  h3: H3 as any,
  ul: UL as any,
  ol: OL as any,
  li: LI as any,
  blockquote: BLOCKQUOTE as any,
  a: A as any,
  table: TABLE as any,
  th: TH as any,
  td: TD as any,

  // Optional extra safety: if anything else emits a <pre>, flatten it so we never
  // accidentally get a nested <pre> inside <p>.
  pre: (props: any) => <>{props.children}</>,
};

interface MarkdownRendererProps {
  children: string;
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}
