import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library does not unmount between tests on its own when the
// global test hooks are not installed, and a left-over tree keeps timers and
// effects alive into the next test.
afterEach(() => {
  cleanup();
});
