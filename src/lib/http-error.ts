import { HttpStatus } from "@/constants/http";
import type { HttpErrorResponse } from "@/types/http";

export interface FieldError {
  field: string;
  message: string;
}

export type EntityErrorResponse = HttpErrorResponse<FieldError[]>;

export class HttpError extends Error {
  public readonly status: number;
  public readonly payload: HttpErrorResponse;

  constructor(status: number, payload: HttpErrorResponse, message?: string) {
    super(message ?? payload.message ?? `Request failed with status ${status}`);

    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

export class EntityError extends HttpError {
  public readonly status: typeof HttpStatus.UnprocessableEntity;
  public readonly payload: EntityErrorResponse;

  constructor(payload: EntityErrorResponse) {
    super(HttpStatus.UnprocessableEntity, payload, "Validation failed");

    this.name = "EntityError";
    this.status = HttpStatus.UnprocessableEntity;
    this.payload = payload;
  }

  public get fieldErrors(): FieldError[] {
    return this.payload.data ?? [];
  }
}
