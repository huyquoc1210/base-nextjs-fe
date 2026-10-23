import { EntityError } from "@/lib/http-error";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

type HandleErrorOptions<T extends FieldValues> = {
  error: unknown;
  setError?: UseFormSetError<T>;
  // Shown when the error carries no message of its own. Passed in because this
  // runs outside React, where useTranslations is not available.
  fallbackMessage?: string;
};

// Puts 422 field errors back on the matching inputs and surfaces anything
// else as a toast
export const handleErrorApi = <T extends FieldValues>(
  options: HandleErrorOptions<T>,
) => {
  const { error, setError, fallbackMessage = "Something went wrong" } = options;

  if (error instanceof EntityError && setError) {
    for (const fieldError of error.fieldErrors) {
      setError(fieldError.field as Path<T>, {
        type: "server",
        message: fieldError.message,
      });
    }

    return;
  }

  toast.error(error instanceof Error ? error.message : fallbackMessage);
};
