import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import java from "shiki/langs/java.mjs";
import githubDarkDimmed from "shiki/themes/github-dark-dimmed.mjs";

// Fine-grained Shiki highlighter: only the Java grammar + a single theme are
// bundled, and the pure-JS regex engine avoids the oniguruma wasm. Importing
// `codeToHtml` from "shiki" instead pulls in all 253 language grammars (~8 MB),
// which pushed the Cloudflare Worker past its size limit.
let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubDarkDimmed],
      langs: [java],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

export async function highlightJava(code: string): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang: "java",
    theme: "github-dark-dimmed",
  });
}
