import type { NormTopic, Loc } from "./norm";

export function validateTopic(n: NormTopic, status: "draft" | "published") {
  const issues: string[] = [];
  const checkLoc = (loc: Loc, label: string) => {
    if (!loc.en.trim()) issues.push(`${n.id}: ${label} missing EN`);
    if (!loc.ru.trim()) issues.push(`${n.id}: ${label} missing RU`);
  };

  checkLoc(n.title, "title");
  checkLoc(n.summary, "summary");
  checkLoc(n.deepDive, "deepDive");
  checkLoc(n.tip, "tip");
  if (!n.code.trim()) issues.push(`${n.id}: code is empty`);
  if (n.interviewQs.length === 0) issues.push(`${n.id}: no interview questions`);
  const validDifficulties = new Set(["junior", "mid", "senior"]);
  n.interviewQs.forEach((q, i) => {
    checkLoc(q.q, `interviewQs[${i}].q`);
    checkLoc(q.a, `interviewQs[${i}].a`);
    if (!validDifficulties.has(q.difficulty)) {
      issues.push(`${n.id}: interviewQs[${i}].difficulty invalid: ${q.difficulty}`);
    }
  });
  if (n.spring) {
    checkLoc(n.spring.concept, "spring.concept");
    checkLoc(n.spring.springFeature, "spring.springFeature");
    checkLoc(n.spring.explanation, "spring.explanation");
  }

  if (n.tldr) checkLoc(n.tldr, "tldr");
  if (n.analogy) checkLoc(n.analogy, "analogy");
  if (n.whatWhy) checkLoc(n.whatWhy, "whatWhy");
  if (n.howItWorks) checkLoc(n.howItWorks, "howItWorks");
  if (n.gotcha) checkLoc(n.gotcha, "gotcha");
  if (n.recap) checkLoc(n.recap, "recap");
  n.checkpoints?.forEach((c, i) => {
    checkLoc(c.prompt, `checkpoints[${i}].prompt`);
    checkLoc(c.answer, `checkpoints[${i}].answer`);
  });
  n.keyTerms?.forEach((k, i) => {
    if (!k.term.trim()) issues.push(`${n.id}: keyTerms[${i}].term is empty`);
    checkLoc(k.definition, `keyTerms[${i}].definition`);
  });

  return status === "published"
    ? { errors: issues, warnings: [] }
    : { errors: [], warnings: issues };
}
