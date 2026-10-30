import { describe, expect, it } from "vitest";
import { formatVersion } from "./version";

describe("versão do CardVoz", () => {
  it("mostra o número e o código curto do commit", () => {
    expect(formatVersion("0.5.0", "fcd98c7a1b2c3d4e5f")).toBe("Versão 0.5.0 (fcd98c7)");
  });

  it("sem commit conhecido, mostra só o número", () => {
    expect(formatVersion("0.5.0", "")).toBe("Versão 0.5.0");
    expect(formatVersion("0.5.0", undefined)).toBe("Versão 0.5.0");
  });
});
