"use client";
import type { Depth } from "@/lib/depth";

const OPTIONS: { id: Depth; ru: string; en: string }[] = [
  { id: "quick", ru: "Кратко", en: "Quick" },
  { id: "standard", ru: "Обычно", en: "Standard" },
  { id: "deep", ru: "Глубоко", en: "Deep" },
];

export default function DepthControl({
  depth,
  onChange,
  locale,
}: {
  depth: Depth;
  onChange: (d: Depth) => void;
  locale: "ru" | "en";
}) {
  return (
    <div
      role="group"
      aria-label={locale === "ru" ? "Глубина" : "Depth"}
      className="inline-flex rounded-lg border border-border overflow-hidden"
    >
      {OPTIONS.map((o, i) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={depth === o.id}
          aria-label={`${locale === "ru" ? o.ru : o.en} (${i + 1})`}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1 text-[11px] transition-colors ${
            depth === o.id
              ? "bg-accent-green/15 text-accent-green font-semibold"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {locale === "ru" ? o.ru : o.en}
        </button>
      ))}
    </div>
  );
}
