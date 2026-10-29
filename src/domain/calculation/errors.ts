export type CalculationErrorCode =
  | 'INVALID_TIME'
  | 'INVALID_DATE'
  | 'INVALID_PERIOD'
  | 'OVERLAPPING_PERIODS'
  | 'OVERLAPPING_SESSIONS'
  | 'INVALID_PUNCH_SEQUENCE'
  | 'NEGATIVE_DURATION'

export class CalculationError extends Error {
  readonly code: CalculationErrorCode
  readonly details?: Record<string, unknown>

  constructor(
    code: CalculationErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'CalculationError'
    this.code = code
    this.details = details
  }
}

export type CalculationResult<T> =
  { ok: true; value: T } | { ok: false; error: CalculationError }

export function ok<T>(value: T): CalculationResult<T> {
  return { ok: true, value }
}

export function err<T = never>(error: CalculationError): CalculationResult<T> {
  return { ok: false, error }
}
