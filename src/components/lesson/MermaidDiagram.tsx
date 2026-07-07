"use client";
import { useEffect, useId, useRef, useState } from "react";

// Renders a Mermaid diagram client-side. The heavy `mermaid` library is loaded
// via dynamic import inside the effect, so it lands in its own chunk and never
// enters the main bundle. SSR renders only the placeholder (no mermaid on server).
export default function MermaidDiagram({ src }: { src: string }) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "strict" });
        const { svg } = await mermaid.render(`mmd-${rawId}`, src);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [rawId, src]);

  if (failed) return null;

  return (
    <div className="not-prose my-4 flex justify-center overflow-x-auto rounded-md border border-border bg-[#0d0d10] p-4">
      <div ref={ref} className="[&_svg]:max-w-full text-text-secondary">
        <span className="text-[11px] text-text-muted">Rendering diagram…</span>
      </div>
    </div>
  );
}
