import envConfig from "@/config";
import {
  HttpStatus,
  NETWORK_ERROR_STATUS,
  REQUEST_TIMEOUT_MS,
} from "@/constants/http";
import { refreshTokens } from "@/lib/auth-refresh";
import LocalStorage from "@/lib/local-storage";
import { EntityError, HttpError } from "@/lib/http-error";
import type { EntityErrorResponse } from "@/lib/http-error";
import type { HttpErrorResponse, HttpResponse } from "@/types/http";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = Omit<RequestInit, "method" | "body"> & {
  // Pass "" to call the Next.js server itself instead of the backend
  baseUrl?: string;
  timeoutMs?: number;
};

type RequestBody = FormData | Record<string, unknown> | unknown[] | undefined;

const isClient = typeof window !== "undefined";

const REFRESH_ROUTE = "api/auth/refresh-token";

const normalizePath = (path: string): string => path.replace(/^\/+|\/+$/g, "");

class HttpClientService {
  public get<D = unknown>(url: string, options?: RequestOptions) {
    return this.request<D>("GET", url, undefined, options);
  }

  public post<D = unknown>(
    url: string,
    data?: RequestBody,
    options?: RequestOptions,
  ) {
    return this.request<D>("POST", url, data, options);
  }

  public put<D = unknown>(
    url: string,
    data?: RequestBody,
    options?: RequestOptions,
  ) {
    return this.request<D>("PUT", url, data, options);
  }

  public patch<D = unknown>(
    url: string,
    data?: RequestBody,
    options?: RequestOptions,
  ) {
    return this.request<D>("PATCH", url, data, options);
  }

  public delete<D = unknown>(url: string, options?: RequestOptions) {
    return this.request<D>("DELETE", url, undefined, options);
  }

  private async request<D>(
    method: HttpMethod,
    url: string,
    data?: RequestBody,
    options?: RequestOptions,
    isRetry = false,
  ): Promise<HttpResponse<D>> {
    const { baseUrl, timeoutMs, headers, signal, ...rest } = options ?? {};

    const response = await this.send(method, url, data, {
      baseUrl,
      timeoutMs,
      headers,
      signal,
      ...rest,
    });

    if (response.ok) {
      return this.readBody<D>(response);
    }

    const payload = await this.readErrorBody(response);

    if (response.status === HttpStatus.UnprocessableEntity) {
      throw new EntityError(payload as EntityErrorResponse);
    }

    // Reactive safety net for the window the proactive interval misses. The
    // refresh itself runs outside this client, so it cannot recurse here.
    const canRefresh =
      response.status === HttpStatus.Unauthorized &&
      isClient &&
      !isRetry &&
      normalizePath(url) !== REFRESH_ROUTE;

    if (!canRefresh) {
      throw new HttpError(response.status, payload);
    }

    const tokens = await refreshTokens();

    if (!tokens) {
      throw new HttpError(response.status, payload);
    }

    return this.request<D>(method, url, data, options, true);
  }

  private async send(
    method: HttpMethod,
    url: string,
    data: RequestBody,
    options: RequestOptions,
  ): Promise<Response> {
    const { baseUrl, timeoutMs, headers, signal, ...rest } = options;

    const resolvedBaseUrl =
      baseUrl === undefined ? envConfig.NEXT_PUBLIC_API_ENDPOINT : baseUrl;
    const fullUrl = `${normalizePath(resolvedBaseUrl)}/${normalizePath(url)}`;

    const isFormData = data instanceof FormData;
    const baseHeaders: Record<string, string> = isFormData
      ? // Leave Content-Type unset so the browser adds the multipart boundary
        {}
      : { "Content-Type": "application/json" };

    if (isClient) {
      const accessToken = LocalStorage.get<string>("accessToken");

      if (accessToken) {
        baseHeaders.Authorization = `Bearer ${accessToken}`;
      }
    }

    const timeoutSignal = AbortSignal.timeout(timeoutMs ?? REQUEST_TIMEOUT_MS);

    try {
      return await fetch(fullUrl, {
        ...rest,
        method,
        headers: { ...baseHeaders, ...headers },
        body: isFormData ? data : data && JSON.stringify(data),
        signal: signal
          ? AbortSignal.any([signal, timeoutSignal])
          : timeoutSignal,
      });
    } catch (error) {
      // fetch only rejects when the request never completed, so keep the
      // cause instead of dropping it the way an unwrapped reject would
      throw new HttpError(
        NETWORK_ERROR_STATUS,
        this.emptyPayload(NETWORK_ERROR_STATUS, this.describe(error)),
        this.describe(error),
      );
    }
  }

  private async readBody<D>(response: Response): Promise<HttpResponse<D>> {
    const body = await this.parseJson(response);

    if (body === null) {
      return {
        data: null as D,
        metadata: {},
        message: null,
        messageCode: null,
        statusCode: response.status,
      };
    }

    return body as HttpResponse<D>;
  }

  private async readErrorBody(response: Response): Promise<HttpErrorResponse> {
    const body = await this.parseJson(response);

    if (body === null) {
      return this.emptyPayload(response.status, response.statusText || null);
    }

    return body as HttpErrorResponse;
  }

  // Returns null for 204 and for any body that is absent or not valid JSON,
  // which a bare res.json() would throw on
  private async parseJson(response: Response): Promise<unknown> {
    if (response.status === HttpStatus.NoContent) return null;
    if (response.headers.get("content-length") === "0") return null;

    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private emptyPayload(
    statusCode: number,
    message: string | null,
  ): HttpErrorResponse {
    return {
      data: null,
      metadata: {},
      message,
      messageCode: null,
      statusCode,
    };
  }

  private describe(error: unknown): string {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return "Request timed out";
    }

    return error instanceof Error ? error.message : "Network request failed";
  }
}

const HttpClient = new HttpClientService();

export default HttpClient;
