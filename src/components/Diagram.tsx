"use client";

import JvmArchitectureDiagram from "./diagrams/JvmArchitectureDiagram";
import HashMapInternalsDiagram from "./diagrams/HashMapInternalsDiagram";
import ThreadLifecycleDiagram from "./diagrams/ThreadLifecycleDiagram";
import StreamPipelineDiagram from "./diagrams/StreamPipelineDiagram";
import GarbageCollectionDiagram from "./diagrams/GarbageCollectionDiagram";
import SpringBeanLifecycleDiagram from "./diagrams/SpringBeanLifecycleDiagram";
import SqlIndexDiagram from "./diagrams/SqlIndexDiagram";
import dynamic from "next/dynamic";
import type { DiagramRef } from "@/lib/resolve-topic";

// Mermaid + its deps (cytoscape, katex, dagre ≈ 3 MB) render client-only, so
// load them with ssr:false to keep them out of the Cloudflare Worker's server
// bundle, which must stay under the size limit.
const MermaidDiagram = dynamic(() => import("./lesson/MermaidDiagram"), {
  ssr: false,
});

const REGISTRY = {
  "jvm-architecture": JvmArchitectureDiagram,
  "hashmap-internals": HashMapInternalsDiagram,
  "thread-lifecycle": ThreadLifecycleDiagram,
  "stream-pipeline": StreamPipelineDiagram,
  "garbage-collection": GarbageCollectionDiagram,
  "spring-bean-lifecycle": SpringBeanLifecycleDiagram,
  "sql-index": SqlIndexDiagram,
} as const;

export type DiagramName = keyof typeof REGISTRY;

export default function Diagram({ diagram }: { diagram: DiagramRef }) {
  if (diagram.kind === "mermaid") return <MermaidDiagram src={diagram.src} />;
  const Component = REGISTRY[diagram.key as DiagramName];
  if (!Component) return null;
  return <Component />;
}
