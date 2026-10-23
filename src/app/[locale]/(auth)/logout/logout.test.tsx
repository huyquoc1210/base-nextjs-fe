import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import Logout from "@/app/[locale]/(auth)/logout/logout";
import LocalStorage from "@/lib/local-storage";

const push = vi.fn();
const setRole = vi.fn();
const mutateAsync = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("next/navigation", () => ({ useSearchParams: () => searchParams }));

vi.mock("@/components/app-provider", () => ({
  useAppStore: (selector: (state: { setRole: typeof setRole }) => unknown) =>
    selector({ setRole }),
}));

vi.mock("@/queries/useAuth", () => ({
  useLogoutMutation: () => ({ mutateAsync }),
}));

describe("Logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mutateAsync.mockResolvedValue(undefined);
    searchParams = new URLSearchParams();
  });

  it("logs out when the url token matches the stored refresh token", async () => {
    LocalStorage.set("refreshToken", "stored-refresh");
    searchParams.set("refreshToken", "stored-refresh");

    renderWithIntl(<Logout />);

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce());
    expect(setRole).toHaveBeenCalledWith();
    expect(push).toHaveBeenCalledWith("/login");
  });

  it("logs out when the url token matches the stored access token", async () => {
    LocalStorage.set("accessToken", "stored-access");
    searchParams.set("accessToken", "stored-access");

    renderWithIntl(<Logout />);

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce());
  });

  it("refuses a token this browser does not hold, so a crafted link cannot sign anyone out", async () => {
    LocalStorage.set("refreshToken", "stored-refresh");
    searchParams.set("refreshToken", "someone-elses-token");

    renderWithIntl(<Logout />);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/manage/dashboard"));
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(setRole).not.toHaveBeenCalled();
  });

  it("refuses when the url carries no token at all", async () => {
    LocalStorage.set("refreshToken", "stored-refresh");

    renderWithIntl(<Logout />);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/manage/dashboard"));
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("still clears the session when the backend call fails", async () => {
    LocalStorage.set("refreshToken", "stored-refresh");
    searchParams.set("refreshToken", "stored-refresh");
    mutateAsync.mockRejectedValue(new Error("network down"));

    renderWithIntl(<Logout />);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    expect(setRole).toHaveBeenCalledWith();
  });

  it("sends only one logout request even though Strict Mode mounts twice", async () => {
    LocalStorage.set("refreshToken", "stored-refresh");
    searchParams.set("refreshToken", "stored-refresh");

    const { rerender } = renderWithIntl(<Logout />);
    rerender(<Logout />);
    rerender(<Logout />);

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce());
  });
});
