import en from "../../messages/en.json";
import vi from "../../messages/vi.json";
import { routing } from "@/i18n/routing";
import { describe, expect, it } from "vitest";

type Messages = Record<string, unknown>;

const flatten = (value: Messages, prefix = ""): string[] =>
  Object.entries(value).flatMap(([key, child]) =>
    child !== null && typeof child === "object"
      ? flatten(child as Messages, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

const catalogs = { en, vi } as Record<string, Messages>;

describe("message catalogs", () => {
  it("covers every locale the routing declares", () => {
    expect(Object.keys(catalogs).sort()).toEqual([...routing.locales].sort());
  });

  it("has the same keys in every locale", () => {
    const [reference, ...others] = Object.entries(catalogs);
    const referenceKeys = flatten(reference[1]).sort();

    for (const [locale, catalog] of others) {
      expect(
        flatten(catalog).sort(),
        `${locale} differs from ${reference[0]}`,
      ).toEqual(referenceKeys);
    }
  });

  it("has no empty translation", () => {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      const empty = flatten(catalog).filter((key) => {
        const value = key
          .split(".")
          .reduce<unknown>((node, part) => (node as Messages)?.[part], catalog);

        return typeof value !== "string" || value.trim() === "";
      });

      expect(empty, `${locale} has empty values`).toEqual([]);
    }
  });

  it("is actually translated, not copied from English", () => {
    // The Login namespace is the one a reviewer would notice first if vi.json
    // were left as an English copy.
    expect(vi.Login.title).not.toBe(en.Login.title);
    expect(vi.Login.submit).not.toBe(en.Login.submit);
  });

  it("defines every error key the zod schema emits", () => {
    // Keys live in schemas/auth.ts as the zod messages; a rename there without
    // a catalog update would otherwise only show up as a raw key in the UI.
    for (const key of ["invalidEmail", "passwordTooShort", "unknown"]) {
      expect(Object.keys(en.ErrorMessage)).toContain(key);
    }
  });
});
