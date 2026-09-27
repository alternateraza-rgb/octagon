"use client";

import { isValidElement, useState, type ReactElement } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Check, Copy } from "lucide-react";
import remarkGfm from "remark-gfm";

const components: Components = {
  p: (props) => <p className="my-3 first:mt-0 last:mb-0" {...props} />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-octa-600 underline underline-offset-4 hover:text-octa-500"
    >
      {children}
    </a>
  ),
  ul: (props) => <ul className="my-3 list-disc space-y-1.5 pl-6 marker:text-fg-3" {...props} />,
  ol: (props) => <ol className="my-3 list-decimal space-y-1.5 pl-6 marker:text-fg-3" {...props} />,
  h1: (props) => <h3 className="mb-2 mt-6 text-[21px] font-semibold tracking-[-0.02em] first:mt-0" {...props} />,
  h2: (props) => <h3 className="mb-2 mt-6 text-[19px] font-semibold tracking-[-0.015em] first:mt-0" {...props} />,
  h3: (props) => <h4 className="mb-2 mt-5 text-[17px] font-semibold first:mt-0" {...props} />,
  blockquote: (props) => <blockquote className="my-3 border-l-2 border-octa-600 pl-4 text-fg-2" {...props} />,
  hr: () => <hr className="my-6 border-hairline" />,
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  code: ({ className, children }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded-[6px] bg-fg/[.07] px-1.5 py-0.5 font-mono text-[0.88em]">{children}</code>
    ),
  table: (props) => (
    <div className="my-4 overflow-x-auto rounded-[12px] ring-1 ring-hairline">
      <table className="w-full border-collapse text-[14px]" {...props} />
    </div>
  ),
  th: (props) => <th className="border-b border-hairline bg-canvas-2 px-3 py-2 text-left font-medium" {...props} />,
  td: (props) => <td className="border-b border-hairline px-3 py-2 align-top" {...props} />,
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}

function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node as ReactElement<{ children?: React.ReactNode }>).props.children);
  return "";
}

// Fenced code with a header showing the language and a copy button.
function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const code = isValidElement(children) ? (children as ReactElement<{ className?: string; children?: React.ReactNode }>) : null;
  const language = code?.props.className?.replace("language-", "") ?? "code";
  const text = textOf(code?.props.children ?? children).replace(/\n$/, "");
  return (
    <div className="my-4 overflow-hidden rounded-[14px] bg-canvas-2 ring-1 ring-hairline">
      <div className="flex h-10 items-center justify-between border-b border-hairline pl-4 pr-1.5 text-[12px] text-fg-3">
        <span className="font-medium">{language}</span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex h-8 items-center gap-1.5 rounded-full px-2.5 hover:bg-fg/5 hover:text-fg"
        >
          {copied ? <Check size={13} /> : <Copy size={13} strokeWidth={1.75} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-[1.65]">{children}</pre>
    </div>
  );
}
