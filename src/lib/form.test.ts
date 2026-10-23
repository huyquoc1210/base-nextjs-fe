import { describe, expect, it, vi } from "vitest";

import { handleErrorApi } from "@/lib/form";
import { EntityError, HttpError } from "@/lib/http-error";

const entityError = (fields: { field: string; message: string }[]) =>
  new EntityError({
    data: fields,
    metadata: {},
    message: "Validation failed",
    messageCode: null,
    statusCode: 422,
  });

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

describe("handleErrorApi", () => {
  it("puts each 422 field error back on its input", () => {
    const setError = vi.fn();

    handleErrorApi({
      error: entityError([
        { field: "email", message: "Email is invalid" },
        { field: "password", message: "Too short" },
      ]),
      setError,
    });

    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenNthCalledWith(1, "email", {
      type: "server",
      message: "Email is invalid",
    });
    expect(setError).toHaveBeenNthCalledWith(2, "password", {
      type: "server",
      message: "Too short",
    });
  });

  it("toasts instead of setting fields for a non-422 error", async () => {
    const { toast } = await import("sonner");
    const setError = vi.fn();

    handleErrorApi({
      error: new HttpError(500, {
        data: null,
        metadata: {},
        message: "Server exploded",
        messageCode: null,
        statusCode: 500,
      }),
      setError,
    });

    expect(setError).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Server exploded");
  });

  it("toasts a generic message for something that is not an Error", async () => {
    const { toast } = await import("sonner");

    handleErrorApi({ error: "just a string" });

    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  it("toasts when a 422 arrives with no setError to put it on", async () => {
    const { toast } = await import("sonner");

    handleErrorApi({
      error: entityError([{ field: "email", message: "bad" }]),
    });

    expect(toast.error).toHaveBeenCalled();
  });
});
