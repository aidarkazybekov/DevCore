import { describe, it, expect } from "vitest";
import { blockFolder } from "./paths";

describe("blockFolder", () => {
  it("zero-pads the block number", () => {
    expect(blockFolder(1)).toMatch(/^content\/java-core\/01-/);
    expect(blockFolder(22)).toMatch(/^content\/java-core\/22-/);
  });
});
