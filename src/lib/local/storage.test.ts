import { describe, expect, it, vi } from "vitest";
import { StorageFullError, onLocalChange, readJson, writeJson } from "./storage";
import { errorMessage } from "@/lib/http";

const isObj = (v: unknown): v is { a: number } =>
  typeof v === "object" && v !== null && typeof (v as { a?: unknown }).a === "number";

describe("armazenamento local", () => {
  it("devolve o padrão quando a chave não existe", () => {
    expect(readJson("k", { a: 0 }, isObj)).toEqual({ a: 0 });
  });

  it("grava e lê de volta", () => {
    writeJson("k", { a: 1 });
    expect(readJson("k", { a: 0 }, isObj)).toEqual({ a: 1 });
  });

  it("guarda o texto corrompido e devolve o padrão", () => {
    localStorage.setItem("k", "{quebrado");
    expect(readJson("k", { a: 0 }, isObj)).toEqual({ a: 0 });
    expect(localStorage.getItem("k.corrompido")).toBe("{quebrado");
  });

  it("trata JSON de outro formato como corrompido", () => {
    localStorage.setItem("k", '{"b":2}');
    expect(readJson("k", { a: 0 }, isObj)).toEqual({ a: 0 });
    expect(localStorage.getItem("k.corrompido")).toBe('{"b":2}');
  });

  it("lança StorageFullError quando o espaço acaba", () => {
    const spy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("cheio", "QuotaExceededError");
    });
    expect(() => writeJson("k", { a: 1 })).toThrow(StorageFullError);
    spy.mockRestore();
  });

  it("avisa quem ouve depois de gravar e para de avisar ao cancelar", () => {
    const listener = vi.fn();
    const stop = onLocalChange(listener);
    writeJson("k", { a: 1 });
    expect(listener).toHaveBeenCalledWith("k");
    stop();
    writeJson("k", { a: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("errorMessage mostra a mensagem do espaço cheio", () => {
    expect(errorMessage(new StorageFullError(), "x")).toBe(
      "O espaço do navegador acabou. Exporte seus baralhos e apague os que não usa."
    );
  });
});
