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
  n.interviewQs.forEach((q, i) => {
    checkLoc(q.q, `interviewQs[${i}].q`);
    checkLoc(q.a, `interviewQs[${i}].a`);
  });
  if (n.spring) {
    checkLoc(n.spring.concept, "spring.concept");
    checkLoc(n.spring.springFeature, "spring.springFeature");
    checkLoc(n.spring.explanation, "spring.explanation");
  }

  return status === "published"
    ? { errors: issues, warnings: [] }
    : { errors: [], warnings: issues };
}
