import type { Dict } from "./shared";

export interface HttpResponse<D = unknown> {
  data: D;
  metadata: Dict;
  message: string | null;
  messageCode: string | null;
  statusCode: number;
}

// NOTE: Same shape as a success response. Kept as a separate name so call
// sites read clearly and the shapes can diverge later without touching them.
export type HttpErrorResponse<D = unknown> = HttpResponse<D>;
