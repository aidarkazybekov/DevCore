"use client";

import { TopicContent } from "@/lib/types";
import { localized, t, useLocale } from "@/lib/i18n";
import { resolveTopic } from "@/lib/resolve-topic";
import Markdown from "./Markdown";
import Diagram from "./Diagram";

interface LearnTabProps {
  content: TopicContent;
}

export default function LearnTab({ content }: LearnTabProps) {
  const { locale } = useLocale();
  const r = resolveTopic(content);
  const summary = localized(content.summary, locale);
  const deepDive = localized(content.deepDive, locale);
  const tip = content.tip ? localized(content.tip, locale) : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="p-4 rounded-lg bg-[#111827] border border-[#1e3a2a] border-l-[3px] border-l-accent-green">
        <div className="text-[10px] text-accent-green tracking-[2px] uppercase mb-2">
          {t("summary", locale)}
        </div>
        <div className="text-[13px] leading-[1.8] text-text-secondary">
          <Markdown>{summary}</Markdown>
        </div>
      </div>
      {r.diagram && <Diagram diagram={r.diagram} />}
      <div>
        <div className="text-[10px] text-text-muted tracking-[2px] uppercase mb-3">
          {t("deepDive", locale)}
        </div>
        <Markdown>{deepDive}</Markdown>
      </div>
      {tip && (
        <div className="p-4 rounded-lg bg-[#12121a] border border-[#2d2d45] border-l-[3px] border-l-accent-amber">
          <div className="text-[10px] text-accent-amber tracking-[2px] uppercase mb-2">
            {t("interviewTip", locale)}
          </div>
          <Markdown>{tip}</Markdown>
        </div>
      )}
    </div>
  );
}
