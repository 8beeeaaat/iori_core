/**
 * Result type definitions
 * Used as return values for factory functions and validation functions
 */

export type ValidationError = {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
};

export type Success<T> = {
  readonly success: true;
  readonly data: T;
};

export type Failure = {
  readonly success: false;
  readonly error: ValidationError;
};

export type ValidationResult<T> = Success<T> | Failure;

/**
 * Create a success result
 */
export function success<T>(data: T): Success<T> {
  return Object.freeze({
    success: true,
    data,
  });
}

/**
 * Create a failure result
 */
export function failure(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): Failure {
  return Object.freeze({
    success: false,
    error: Object.freeze({
      code,
      message,
      details,
    }),
  });
}

/**
 * Check if the result is a success (type guard)
 */
export function isSuccess<T>(
  result: ValidationResult<T>,
): result is Success<T> {
  return result.success === true;
}

/**
 * Check if the result is a failure (type guard)
 */
export function isFailure<T>(result: ValidationResult<T>): result is Failure {
  return result.success === false;
}
