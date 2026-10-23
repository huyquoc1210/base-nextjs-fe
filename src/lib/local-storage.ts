export type StorageKey = "settings" | "accessToken" | "refreshToken";

// NOTE: `set` stringifies and `get` parses, so every write must go through
// this service. A value written with a bare `localStorage.setItem` makes
// `get` throw on parse and fall back to `defaultValue`.
class LocalStorageService {
  private get isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  public get<T = unknown>(
    key: StorageKey,
    defaultValue: T | null = null,
  ): T | null {
    if (!this.isBrowser) return defaultValue;

    try {
      const value = window.localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : defaultValue;
    } catch (error) {
      // Swallowed on purpose: broken or full storage must not take down the
      // UI. Callers get `defaultValue` and handle the missing data.
      console.error(error);
      return defaultValue;
    }
  }

  public set<T>(key: StorageKey, value: T): void {
    if (!this.isBrowser) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  }

  public remove(key: StorageKey): void {
    if (!this.isBrowser) return;

    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(error);
    }
  }

  public clear(): void {
    if (!this.isBrowser) return;

    try {
      window.localStorage.clear();
    } catch (error) {
      console.error(error);
    }
  }
}

const LocalStorage = new LocalStorageService();

export default LocalStorage;
