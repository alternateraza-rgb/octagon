"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  p: (props) => <p className="my-3 first:mt-0 last:mb-0" {...props} />,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-octa-600 underline underline-offset-4 hover:text-octa-500">
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
  pre: (props) => (
    <pre className="my-4 overflow-x-auto rounded-[12px] bg-canvas-2 p-4 font-mono text-[13px] leading-[1.6] ring-1 ring-hairline" {...props} />
  ),
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
