import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RefreshToken from "@/components/refresh-token";
import { checkAndRefreshToken } from "@/lib/auth-refresh";

const push = vi.fn();
const setRole = vi.fn();
let pathname = "/manage/dashboard";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

vi.mock("@/components/app-provider", () => ({
  useAppStore: (selector: (state: { setRole: typeof setRole }) => unknown) =>
    selector({ setRole }),
}));

vi.mock("@/lib/auth-refresh", () => ({ checkAndRefreshToken: vi.fn() }));

const refreshMock = vi.mocked(checkAndRefreshToken);

describe("RefreshToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    pathname = "/manage/dashboard";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("checks once immediately so it does not wait a whole interval", () => {
    render(<RefreshToken />);

    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("keeps checking on the interval", () => {
    render(<RefreshToken />);
    refreshMock.mockClear();

    vi.advanceTimersByTime(3000);

    expect(refreshMock).toHaveBeenCalledTimes(3);
  });

  it.each(["/login", "/logout", "/refresh-token"])(
    "stays idle on %s, where there is no session to refresh",
    (unauthenticatedPath) => {
      pathname = unauthenticatedPath;

      render(<RefreshToken />);
      vi.advanceTimersByTime(5000);

      expect(refreshMock).not.toHaveBeenCalled();
    },
  );

  it("stops the interval and signs out when a refresh fails", () => {
    render(<RefreshToken />);

    // Fire the onError the component handed to checkAndRefreshToken
    refreshMock.mock.calls[0][0]?.onError?.();
    refreshMock.mockClear();
    vi.advanceTimersByTime(5000);

    expect(setRole).toHaveBeenCalledWith();
    expect(push).toHaveBeenCalledWith("/login");
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("clears the interval when unmounted", () => {
    const { unmount } = render(<RefreshToken />);
    refreshMock.mockClear();

    unmount();
    vi.advanceTimersByTime(5000);

    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("renders nothing", () => {
    const { container } = render(<RefreshToken />);

    expect(container).toBeEmptyDOMElement();
  });
});
