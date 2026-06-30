const SEPARATOR = /\n\s*---\s*\n/;

export function splitLocalized(text: string): { ru: string; en: string } {
  if (!text) return { ru: "", en: "" };
  const parts = text.split(SEPARATOR);
  if (parts.length < 2) return { ru: text, en: text };
  const [ru, ...rest] = parts;
  return { ru: ru.trim(), en: rest.join("\n---\n").trim() };
}

export function joinLocalized(ru: string, en: string): string {
  if (ru === en) return ru;
  return `${ru.trim()}\n\n---\n\n${en.trim()}`;
}

export function localized(text: string, locale: "ru" | "en"): string {
  const { ru, en } = splitLocalized(text);
  return locale === "ru" ? ru : en;
}
