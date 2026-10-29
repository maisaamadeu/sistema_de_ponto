export class RepositoryError extends Error {
  readonly code: string

  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'RepositoryError'
    this.code = code
  }
}

export class NotFoundError extends RepositoryError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} não encontrado: ${id}`)
    this.name = 'NotFoundError'
  }
}

export class NotImplementedError extends RepositoryError {
  constructor(capability: string) {
    super('NOT_IMPLEMENTED', `${capability} ainda não está implementado`)
    this.name = 'NotImplementedError'
  }
}
