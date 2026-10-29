import { describe, expect, it } from 'vitest'

import { NotFoundError, NotImplementedError, RepositoryError } from './repository-error'

describe('RepositoryError', () => {
  it('expõe código e mensagem estáveis', () => {
    const error = new RepositoryError('CONFLICT', 'conflito de versão')

    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe('CONFLICT')
    expect(error.message).toBe('conflito de versão')
  })
})

describe('NotFoundError', () => {
  it('identifica recurso e id ausentes', () => {
    const error = new NotFoundError('TimeEntry', 'abc')

    expect(error.code).toBe('NOT_FOUND')
    expect(error.message).toContain('TimeEntry')
    expect(error.message).toContain('abc')
  })
})

describe('NotImplementedError', () => {
  it('sinaliza capacidade ainda não disponível', () => {
    const error = new NotImplementedError('TimeEntryRepository.create')

    expect(error.code).toBe('NOT_IMPLEMENTED')
    expect(error.message).toContain('TimeEntryRepository.create')
  })
})
