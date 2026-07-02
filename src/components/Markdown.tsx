"use client";

import { ReactNode, useState, Children, isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { annotateTerms } from "@/lib/key-terms";
import { localized } from "@/lib/i18n";
import type { KeyTerm } from "@/lib/types";

type CalloutType = "tip" | "warning" | "gotcha" | "info" | "production";

const CALLOUT_STYLES: Record<CalloutType, { bar: string; bg: string; label: string; labelColor: string }> = {
  tip: {
    bar: "border-l-accent-green",
    bg: "bg-[#0f1a0f]",
    label: "TIP",
    labelColor: "text-accent-green",
  },
  warning: {
    bar: "border-l-accent-amber",
    bg: "bg-[#1a1508]",
    label: "WARNING",
    labelColor: "text-accent-amber",
  },
  gotcha: {
    bar: "border-l-accent-red",
    bg: "bg-[#1a0808]",
    label: "GOTCHA",
    labelColor: "text-accent-red",
  },
  info: {
    bar: "border-l-accent-cyan",
    bg: "bg-[#08151a]",
    label: "INFO",
    labelColor: "text-accent-cyan",
  },
  production: {
    bar: "border-l-[#c084fc]",
    bg: "bg-[#150b1f]",
    label: "PRODUCTION",
    labelColor: "text-[#c084fc]",
  },
};

function Callout({ type, children }: { type: CalloutType; children: ReactNode }) {
  const s = CALLOUT_STYLES[type];
  return (
    <div
      className={`not-prose my-4 rounded-md border border-border border-l-[3px] ${s.bar} ${s.bg} px-4 py-3`}
    >
      <div className={`text-[10px] tracking-[2px] uppercase mb-1.5 ${s.labelColor}`}>
        {s.label}
      </div>
      <div className="text-[13px] leading-[1.7] text-text-secondary [&_p]:mb-1.5 [&_p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

function extractFirstText(children: ReactNode): string {
  let out = "";
  Children.forEach(children, (c) => {
    if (typeof c === "string") out += c;
    else if (isValidElement(c)) {
      const el = c as React.ReactElement<{ children?: ReactNode }>;
      if (el.props?.children) out += extractFirstText(el.props.children);
    }
  });
  return out;
}

function stripCalloutMarker(children: ReactNode): ReactNode {
  const arr = Children.toArray(children);
  if (arr.length === 0) return children;
  const first = arr[0];
  if (!isValidElement(first)) return children;
  const firstEl = first as React.ReactElement<{ children?: ReactNode }>;
  const inner = Children.toArray(firstEl.props.children ?? []);
  if (inner.length === 0) return children;
  const firstInner = inner[0];
  if (typeof firstInner !== "string") return children;
  const stripped = firstInner.replace(/^\s*\[![a-z]+\]\s*\n?/i, "");
  const newInner = stripped ? [stripped, ...inner.slice(1)] : inner.slice(1);
  if (newInner.length === 0) return arr.slice(1);
  return [
    <p key="hd" className={firstEl.props && (firstEl as { props: { className?: string } }).props?.className ? (firstEl as { props: { className?: string } }).props.className : ""}>{newInner}</p>,
    ...arr.slice(1),
  ];
}

function CodeBlock({ className, children }: { className?: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("language-", "") ?? "text";
  const text = typeof children === "string" ? children : String(children ?? "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text.trimEnd());
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore
    }
  };

  return (
    <div className="not-prose my-4 rounded-md border border-border overflow-hidden bg-[#0d0d10] group">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-bg-elevated">
        <span className="text-[10px] text-text-muted tracking-wider uppercase">{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="text-[10px] text-text-muted hover:text-text-secondary tracking-wider uppercase transition-colors"
          aria-label="Copy code"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[12px] leading-[1.7] text-[#cbd5e1]">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface MarkdownProps {
  children: string;
  className?: string;
  keyTerms?: KeyTerm[];
  locale?: "ru" | "en";
}

export default function Markdown({ children, className = "", keyTerms = [], locale = "en" }: MarkdownProps) {
  const terms = keyTerms.map((k) => k.term).filter((t) => t.trim());
  const defByTerm = new Map(keyTerms.map((k) => [k.term.toLowerCase(), localized(k.definition, locale)]));
  const used = new Set<string>();

  const annotate = (node: ReactNode): ReactNode => {
    if (terms.length === 0) return node;
    return Children.map(node, (child) => {
      if (typeof child !== "string") return child; // elements (incl. inline code) untouched
      const remaining = terms.filter((t) => !used.has(t.toLowerCase()));
      const segs = annotateTerms(child, remaining);
      if (!segs.some((s) => s.term)) return child;
      return segs.map((s, i) => {
        if (!s.term) return <span key={i}>{s.text}</span>;
        used.add(s.term.toLowerCase());
        return (
          <span
            key={i}
            title={defByTerm.get(s.term.toLowerCase()) ?? ""}
            className="border-b border-dashed border-accent-green/60 cursor-help"
          >
            {s.text}
          </span>
        );
      });
    });
  };

  return (
    <div className={`text-[13px] leading-[1.8] text-text-secondary ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3.5 leading-[1.85]">{annotate(children)}</p>,
          h1: ({ children }) => {
            const id = slugify(extractFirstText(children));
            return (
              <h2 id={id} className="text-lg font-semibold text-text-primary mt-6 mb-3 scroll-mt-24">
                {children}
              </h2>
            );
          },
          h2: ({ children }) => {
            const id = slugify(extractFirstText(children));
            return (
              <h3 id={id} className="text-[15px] font-semibold text-text-primary mt-5 mb-2.5 scroll-mt-24">
                {children}
              </h3>
            );
          },
          h3: ({ children }) => {
            const id = slugify(extractFirstText(children));
            return (
              <h4 id={id} className="text-[13px] font-semibold text-text-primary mt-4 mb-2 tracking-wide scroll-mt-24">
                {children}
              </h4>
            );
          },
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-3.5 space-y-1.5 marker:text-text-muted">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3.5 space-y-1.5 marker:text-text-muted">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-[1.7]">{annotate(children)}</li>,
          strong: ({ children }) => (
            <strong className="text-text-primary font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-cyan hover:underline"
            >
              {children}
            </a>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = (props as { node?: { position?: { start?: { column?: number } } } })
              .node?.position?.start?.column === 1;
            if (isBlock || className?.startsWith("language-")) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code className="px-1 py-0.5 rounded bg-bg-elevated border border-border text-[12px] text-accent-cyan font-mono">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          blockquote: ({ children }) => {
            const firstText = extractFirstText(children);
            const match = firstText.match(/^\s*\[!(tip|warning|gotcha|info|production)\]/i);
            if (match) {
              const type = match[1].toLowerCase() as CalloutType;
              return <Callout type={type}>{stripCalloutMarker(children)}</Callout>;
            }
            return (
              <blockquote className="border-l-2 border-border pl-4 my-3 text-text-muted italic">
                {children}
              </blockquote>
            );
          },
          table: ({ children }) => (
            <div className="not-prose my-4 overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-bg-elevated">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 text-left text-text-primary font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-text-secondary">{children}</td>
          ),
          hr: () => <hr className="my-5 border-border" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
