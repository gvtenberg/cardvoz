import { beforeEach } from "vitest";

/** Storage em memória com a mesma interface do navegador. */
export class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

const target = new EventTarget();
const g = globalThis as unknown as Record<string, unknown>;
g.window = globalThis;
g.addEventListener = target.addEventListener.bind(target);
g.removeEventListener = target.removeEventListener.bind(target);
g.dispatchEvent = target.dispatchEvent.bind(target);
g.localStorage = new MemoryStorage();
g.sessionStorage = new MemoryStorage();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
