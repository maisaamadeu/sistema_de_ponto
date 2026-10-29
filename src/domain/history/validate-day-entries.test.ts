import { describe, expect, it } from 'vitest'

import { makeDayEntries } from '@/domain/calculation/test-fixtures'

import {
  validateDayEntries,
  validateEntryRemoval,
  validateEntryUpdate,
} from './validate-day-entries'

const DATE = '2026-10-28'

describe('validateDayEntries', () => {
  it('aceita sequência válida', () => {
    const entries = makeDayEntries(DATE, [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T11:00:00.000Z' },
      { id: '2', type: 'break_start', occurredAt: '2026-10-28T15:00:00.000Z' },
      { id: '3', type: 'break_end', occurredAt: '2026-10-28T16:00:00.000Z' },
      { id: '4', type: 'clock_out', occurredAt: '2026-10-28T20:00:00.000Z' },
    ])
    expect(validateDayEntries(entries)).toEqual({ ok: true })
  })

  it('rejeita sobreposição / ordem inválida', () => {
    const entries = makeDayEntries(DATE, [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T11:00:00.000Z' },
      { id: '2', type: 'clock_out', occurredAt: '2026-10-28T10:00:00.000Z' },
    ])
    const result = validateDayEntries(entries)
    expect(result.ok).toBe(false)
  })
})

describe('validateEntryUpdate', () => {
  it('bloqueia horário que inverte a sequência', () => {
    const entries = makeDayEntries(DATE, [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T11:00:00.000Z' },
      { id: '2', type: 'clock_out', occurredAt: '2026-10-28T20:00:00.000Z' },
    ])
    const result = validateEntryUpdate(entries, '2', {
      occurredAt: '2026-10-28T10:00:00.000Z',
    })
    expect(result.ok).toBe(false)
  })

  it('aceita ajuste que mantém ordem', () => {
    const entries = makeDayEntries(DATE, [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T11:00:00.000Z' },
      { id: '2', type: 'clock_out', occurredAt: '2026-10-28T20:00:00.000Z' },
    ])
    const result = validateEntryUpdate(entries, '2', {
      occurredAt: '2026-10-28T21:00:00.000Z',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.next[1].occurredAt).toBe('2026-10-28T21:00:00.000Z')
  })
})

describe('validateEntryRemoval', () => {
  it('permite esvaziar o dia', () => {
    const entries = makeDayEntries(DATE, [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T11:00:00.000Z' },
    ])
    const result = validateEntryRemoval(entries, '1')
    expect(result).toEqual({ ok: true, next: [] })
  })

  it('rejeita remoção que deixa sequência inválida', () => {
    const entries = makeDayEntries(DATE, [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T11:00:00.000Z' },
      { id: '2', type: 'break_start', occurredAt: '2026-10-28T15:00:00.000Z' },
      { id: '3', type: 'break_end', occurredAt: '2026-10-28T16:00:00.000Z' },
      { id: '4', type: 'clock_out', occurredAt: '2026-10-28T20:00:00.000Z' },
    ])
    // Remover clock_in deixa break_start como primeiro evento → inválido
    const result = validateEntryRemoval(entries, '1')
    expect(result.ok).toBe(false)
  })

  it('permite remover saída (jornada incompleta válida)', () => {
    const entries = makeDayEntries(DATE, [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T11:00:00.000Z' },
      { id: '2', type: 'break_start', occurredAt: '2026-10-28T15:00:00.000Z' },
      { id: '3', type: 'break_end', occurredAt: '2026-10-28T16:00:00.000Z' },
      { id: '4', type: 'clock_out', occurredAt: '2026-10-28T20:00:00.000Z' },
    ])
    const result = validateEntryRemoval(entries, '4')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.next).toHaveLength(3)
  })
})
