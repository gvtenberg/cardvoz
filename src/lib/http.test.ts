import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("wakeApi", () => {
  it("chama /health uma vez só, sem esperar resposta nem mostrar erro", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("sem internet"));
    vi.stubGlobal("fetch", fetchMock);
    const { wakeApi, getApiBaseUrl } = await import("./http");

    wakeApi();
    wakeApi();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${getApiBaseUrl()}/health`,
      expect.objectContaining({ mode: "no-cors", keepalive: true })
    );
  });
});
