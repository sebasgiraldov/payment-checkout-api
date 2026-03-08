/**
 * Result/Either pattern implementation for Railway Oriented Programming
 *
 * Represents either a success (Ok) or failure (Fail) state.
 * Provides type-safe access to value or error without throwing exceptions.
 *
 * @template T - The type of the success value
 * @template E - The type of the error
 *
 * @example
 * ```typescript
 * // Creating results
 * const success = Result.ok(42);
 * const failure = Result.fail(new Error('Something went wrong'));
 *
 * // Checking result status
 * if (result.isSuccess) {
 *   console.log(result.value);
 * }
 *
 * // Functional composition with map()
 * const result = Result.ok(10)
 *   .map(x => x * 2)
 *   .map(x => x + 5);
 *
 * // Error transformation with mapError()
 * const result = someOperation()
 *   .mapError(err => new DomainError(err.message));
 * ```
 */
export class Result<T, E> {
  private readonly _isSuccess: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;

    // Ensure invariants
    if (isSuccess && value === undefined) {
      throw new Error('Success result must have a value');
    }
    if (!isSuccess && error === undefined) {
      throw new Error('Failure result must have an error');
    }
  }

  /**
   * Creates a successful Result containing a value
   * @param value - The success value
   * @returns A successful Result
   */
  static ok<T, E>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  /**
   * Creates a failed Result containing an error
   * @param error - The error value
   * @returns A failed Result
   */
  static fail<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  /**
   * Checks if the Result is a success
   */
  get isSuccess(): boolean {
    return this._isSuccess;
  }

  /**
   * Checks if the Result is a failure
   */
  get isFailure(): boolean {
    return !this._isSuccess;
  }

  /**
   * Gets the success value
   * @throws Error if called on a failure Result
   */
  get value(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from a failed Result');
    }
    return this._value as T;
  }

  /**
   * Gets the error value
   * @throws Error if called on a success Result
   */
  get error(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from a successful Result');
    }
    return this._error as E;
  }

  /**
   * Maps the success value to a new value using the provided function
   * If the Result is a failure, returns the failure unchanged
   *
   * @param fn - Function to transform the success value
   * @returns A new Result with the transformed value or the original error
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      return Result.ok<U, E>(fn(this._value as T));
    }
    return Result.fail<U, E>(this._error as E);
  }

  /**
   * Maps the error value to a new error using the provided function
   * If the Result is a success, returns the success unchanged
   *
   * @param fn - Function to transform the error value
   * @returns A new Result with the original value or the transformed error
   */
  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this._isSuccess) {
      return Result.ok<T, F>(this._value as T);
    }
    return Result.fail<T, F>(fn(this._error as E));
  }
}
