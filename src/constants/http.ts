export const HttpStatus = {
  NoContent: 204,
  Unauthorized: 401,
  UnprocessableEntity: 422,
} as const;

// Status used when the request never reached the server (network down, DNS
// failure, timeout), so the error still carries a status instead of being lost
export const NETWORK_ERROR_STATUS = 0;

export const REQUEST_TIMEOUT_MS = 30_000;
