"use client";
import { useRef } from "react";
import { TopicContent, ProgressState } from "@/lib/types";
import { localized, useLocale } from "@/lib/i18n";
import { resolveTopic } from "@/lib/resolve-topic";
import { visibleSections, showMiniQuiz } from "@/lib/lesson-layers";
import type { Depth } from "@/lib/depth";
import Diagram from "./Diagram";
import CodeTab from "./CodeTab";
import InterviewTab from "./InterviewTab";
import SpringTab from "./SpringTab";
import Markdown from "./Markdown";
import TldrLead from "./lesson/TldrLead";
import Analogy from "./lesson/Analogy";
import Gotcha from "./lesson/Gotcha";
import Recap from "./lesson/Recap";
import Checkpoint from "./lesson/Checkpoint";
import Glossary from "./lesson/Glossary";
import MiniQuiz from "./lesson/MiniQuiz";
import CompletionNudge from "./lesson/CompletionNudge";

function Label({ children }: { children: string }) {
  return <div className="text-[9.5px] tracking-[2px] uppercase text-text-muted mb-2">{children}</div>;
}

export default function LessonView({
  content,
  highlightedCode,
  progress,
  onRate,
  depth,
}: {
  content: TopicContent;
  highlightedCode: string;
  progress: ProgressState;
  onRate: (id: string, quality: number) => void;
  depth: Depth;
}) {
  const { locale } = useLocale();
  const r = resolveTopic(content);
  const vis = visibleSections(depth);
  const kt = r.keyTerms;
  const quizRef = useRef<HTMLDivElement>(null);
  const toQuiz = () => quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex flex-col gap-6">
      {vis.has("tldr") && <TldrLead text={localized(r.tldr, locale)} keyTerms={kt} locale={locale} />}
      {vis.has("analogy") && r.analogy && <Analogy text={localized(r.analogy, locale)} keyTerms={kt} locale={locale} />}
      {vis.has("diagram") && r.diagram && <Diagram diagram={r.diagram} />}
      {vis.has("whatWhy") && r.whatWhy && (
        <div>
          <Label>{locale === "ru" ? "Что и зачем" : "What & Why"}</Label>
          <Markdown keyTerms={kt} locale={locale}>{localized(r.whatWhy, locale)}</Markdown>
        </div>
      )}
      {vis.has("howItWorks") && (
        <div>
          <Label>{locale === "ru" ? "Как это работает" : "How it works"}</Label>
          <Markdown keyTerms={kt} locale={locale}>{localized(r.howItWorks, locale)}</Markdown>
        </div>
      )}
      {vis.has("code") && <CodeTab content={content} highlightedCode={highlightedCode} />}
      {vis.has("gotcha") && r.gotcha && <Gotcha text={localized(r.gotcha, locale)} keyTerms={kt} locale={locale} />}
      {vis.has("checkpoints") &&
        r.checkpoints.map((c) => (
          <Checkpoint key={c.id} prompt={localized(c.prompt, locale)} answer={localized(c.answer, locale)} locale={locale} />
        ))}
      {vis.has("recap") && r.recap && <Recap text={localized(r.recap, locale)} keyTerms={kt} locale={locale} />}
      {vis.has("interview") && (
        <div ref={quizRef}>
          <Label>{locale === "ru" ? "Вопросы на интервью" : "Interview questions"}</Label>
          <InterviewTab content={content} progress={progress} onRate={onRate} />
        </div>
      )}
      {vis.has("spring") && content.springConnection && <SpringTab content={content} />}
      {vis.has("glossary") && <Glossary terms={kt} locale={locale} />}
      <CompletionNudge locale={locale} onStart={toQuiz} />
      {showMiniQuiz(depth) && (
        <MiniQuiz questions={content.interviewQs} onRate={onRate} anchorRef={quizRef} />
      )}
    </div>
  );
}
