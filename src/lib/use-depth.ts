"use client";
import { useCallback, useEffect, useState } from "react";
import { type Depth, DEFAULT_DEPTH, loadDepth, saveDepth } from "./depth";

export function useDepth(): [Depth, (d: Depth) => void] {
  const [depth, setDepthState] = useState<Depth>(DEFAULT_DEPTH);
  useEffect(() => {
    setDepthState(loadDepth());
  }, []);
  const setDepth = useCallback((d: Depth) => {
    setDepthState(d);
    saveDepth(d);
  }, []);
  return [depth, setDepth];
}
