import type { ApiErrorCode } from "@plated/shared";

/** An error we're willing to describe to the client. */
export class AppError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status: number,
    // `override` because Error itself declares an optional `cause` (ES2022).
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (message: string) =>
  new AppError("bad_request", message, 400);

export const notFound = (message = "Not found") =>
  new AppError("not_found", message, 404);

/** Upstream is out of quota — surfaced separately so you can alert on it. */
export const quotaExceeded = (cause?: unknown) =>
  new AppError(
    "quota_exceeded",
    "Recipe service quota exhausted. Try again tomorrow.",
    503,
    cause,
  );

export const upstreamError = (message: string, cause?: unknown) =>
  new AppError("upstream_error", message, 502, cause);
