import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import LoginForm from "@/app/[locale]/(auth)/login/login-form";
import { EntityError } from "@/lib/http-error";

const push = vi.fn();
const setRole = vi.fn();
const mutateAsync = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push }),
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("@/components/app-provider", () => ({
  useAppStore: (selector: (state: { setRole: typeof setRole }) => unknown) =>
    selector({ setRole }),
}));

vi.mock("@/queries/useAuth", () => ({
  useLoginMutation: () => ({ mutateAsync, isPending: false }),
}));

const accessTokenWithRole = (role: string) => {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  return `${encode({ alg: "HS256" })}.${encode({ userId: 1, role, exp: 1, iat: 0 })}.stub`;
};

const fillAndSubmit = async (email: string, password: string) => {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Login" }));
};

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams.delete("clearTokens");
  });

  it("renders the social buttons disabled until OAuth is wired up", () => {
    renderWithIntl(<LoginForm />);

    expect(screen.getByRole("button", { name: /Apple/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Google/ })).toBeDisabled();
  });

  it("blocks submit and shows a message for an invalid email", async () => {
    renderWithIntl(<LoginForm />);

    await fillAndSubmit("not-an-email", "secret123");

    expect(await screen.findByText("Invalid email")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("blocks submit for a password under six characters", async () => {
    renderWithIntl(<LoginForm />);

    await fillAndSubmit("user@test.com", "short");

    expect(
      await screen.findByText("Password must be at least 6 characters"),
    ).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("stores the role and navigates on a successful login", async () => {
    mutateAsync.mockResolvedValue({
      data: { accessToken: accessTokenWithRole("Admin") },
    });
    renderWithIntl(<LoginForm />);

    await fillAndSubmit("user@test.com", "secret123");

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce());
    expect(mutateAsync).toHaveBeenCalledWith({
      email: "user@test.com",
      password: "secret123",
    });
    expect(setRole).toHaveBeenCalledWith("Admin");
    expect(push).toHaveBeenCalledWith("/manage/dashboard");
  });

  it("puts a 422 field error from the server onto the matching input", async () => {
    mutateAsync.mockRejectedValue(
      new EntityError({
        data: [{ field: "email", message: "Email already registered" }],
        metadata: {},
        message: "Validation failed",
        messageCode: null,
        statusCode: 422,
      }),
    );
    renderWithIntl(<LoginForm />);

    await fillAndSubmit("user@test.com", "secret123");

    expect(
      await screen.findByText("Email already registered"),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("clears the stored role when the proxy sends clearTokens", () => {
    searchParams.set("clearTokens", "true");

    renderWithIntl(<LoginForm />);

    expect(setRole).toHaveBeenCalledWith();
  });

  it("does not clear the role on a normal visit", () => {
    renderWithIntl(<LoginForm />);

    expect(setRole).not.toHaveBeenCalled();
  });
});
