import NotFoundCatchAll from "./page";
import { describe, expect, it } from "vitest";

describe("locale catch-all route", () => {
  it("throws so an unknown URL lands on the localized 404 instead of rendering an empty page", () => {
    // Asserts only that it throws. The digest string Next attaches is
    // internal, and the real guarantee — a 404 status with translated
    // content — lives at the HTTP layer, not here.
    expect(() => NotFoundCatchAll()).toThrow();
  });
});
