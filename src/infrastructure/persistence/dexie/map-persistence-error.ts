import {
  PersistenceError,
  RepositoryError,
  StorageQuotaExceededError,
  StorageUnavailableError,
} from '@/domain/errors/repository-error'

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { name?: string; message?: string; inner?: unknown }
  if (candidate.name === 'QuotaExceededError') return true
  if (typeof candidate.message === 'string' && /quota/i.test(candidate.message)) {
    return true
  }
  return candidate.inner ? isQuotaError(candidate.inner) : false
}

function isUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { name?: string; message?: string; inner?: unknown }
  if (
    candidate.name === 'InvalidStateError' ||
    candidate.name === 'UnknownError' ||
    candidate.name === 'OpenFailedError' ||
    candidate.name === 'DatabaseClosedError'
  ) {
    return true
  }
  if (
    typeof candidate.message === 'string' &&
    /(indexeddb|storage).*(unavailable|not available|secure|blocked)/i.test(
      candidate.message,
    )
  ) {
    return true
  }
  return candidate.inner ? isUnavailableError(candidate.inner) : false
}

export function mapPersistenceError(error: unknown): Error {
  if (error instanceof RepositoryError) {
    return error
  }

  if (typeof indexedDB === 'undefined') {
    return new StorageUnavailableError()
  }

  if (isQuotaError(error)) {
    return new StorageQuotaExceededError()
  }

  if (isUnavailableError(error)) {
    return new StorageUnavailableError(
      error instanceof Error ? error.message : 'Armazenamento local indisponível',
    )
  }

  return new PersistenceError(
    error instanceof Error ? error.message : 'Falha ao acessar o armazenamento local',
    { cause: error instanceof Error ? error : undefined },
  )
}

export async function withPersistence<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof indexedDB === 'undefined') {
    throw new StorageUnavailableError()
  }

  try {
    return await operation()
  } catch (error) {
    throw mapPersistenceError(error)
  }
}
