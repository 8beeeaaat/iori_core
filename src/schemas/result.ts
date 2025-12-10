/**
 * Result型定義
 * Factory関数やバリデーション関数の戻り値として使用
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
 * 成功結果を作成
 */
export function success<T>(data: T): Success<T> {
  return Object.freeze({
    success: true,
    data,
  });
}

/**
 * 失敗結果を作成
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
 * 成功結果かどうかを判定（型ガード）
 */
export function isSuccess<T>(result: ValidationResult<T>): result is Success<T> {
  return result.success === true;
}

/**
 * 失敗結果かどうかを判定（型ガード）
 */
export function isFailure<T>(result: ValidationResult<T>): result is Failure {
  return result.success === false;
}
