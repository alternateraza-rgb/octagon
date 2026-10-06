"use client";

import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Lesson prose: like chat Markdown, but links to the app stay in the same tab.
const components: Components = {
  p: (props) => <p className="my-4 first:mt-0 last:mb-0" {...props} />,
  a: ({ href = "", children }) =>
    href.startsWith("/") ? (
      <Link href={href} className="text-octa-600 underline underline-offset-4 hover:text-octa-500">
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-octa-600 underline underline-offset-4 hover:text-octa-500">
        {children}
      </a>
    ),
  ul: (props) => <ul className="my-4 list-disc space-y-2 pl-6 marker:text-fg-3" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-2 pl-6 marker:text-fg-3" {...props} />,
  h2: (props) => <h3 className="mb-3 mt-8 text-[22px] font-semibold tracking-[-0.02em] first:mt-0" {...props} />,
  h3: (props) => <h4 className="mb-2 mt-6 text-[18px] font-semibold tracking-[-0.01em] first:mt-0" {...props} />,
  strong: (props) => <strong className="font-semibold text-fg" {...props} />,
  table: (props) => (
    <div className="my-5 overflow-x-auto rounded-[16px] ring-1 ring-hairline">
      <table className="w-full border-collapse text-[15px] tabular-nums" {...props} />
    </div>
  ),
  th: (props) => <th className="border-b border-hairline bg-canvas-2 px-4 py-2.5 text-left text-[13px] font-medium text-fg-2" {...props} />,
  td: (props) => <td className="border-b border-hairline px-4 py-2.5 align-top last-of-type:border-b-0" {...props} />,
};

export function LessonMarkdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`text-[17px] leading-[1.6] text-fg-2 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
