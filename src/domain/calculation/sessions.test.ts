import { describe, expect, it } from 'vitest'

import { assertSessionsDoNotOverlap, buildWorkSessions } from './sessions'
import { makeDayEntries } from './test-fixtures'

describe('buildWorkSessions', () => {
  it('calcula jornada padrão com intervalo', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T08:00:00.000Z' },
      { id: '2', type: 'break_start', occurredAt: '2026-10-28T12:00:00.000Z' },
      { id: '3', type: 'break_end', occurredAt: '2026-10-28T13:00:00.000Z' },
      { id: '4', type: 'clock_out', occurredAt: '2026-10-28T17:00:00.000Z' },
    ])

    const result = buildWorkSessions(entries)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toHaveLength(1)
    expect(result.value[0].closed).toBe(true)
    expect(result.value[0].workedMinutes).toBe(480)
  })

  it('suporta sessão que atravessa a meia-noite', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T22:00:00.000Z' },
      { id: '2', type: 'clock_out', occurredAt: '2026-10-29T06:00:00.000Z' },
    ])

    const result = buildWorkSessions(entries)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value[0].workedMinutes).toBe(480)
  })

  it('suporta múltiplas sessões no mesmo dia', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T08:00:00.000Z' },
      { id: '2', type: 'clock_out', occurredAt: '2026-10-28T12:00:00.000Z' },
      { id: '3', type: 'clock_in', occurredAt: '2026-10-28T13:00:00.000Z' },
      { id: '4', type: 'clock_out', occurredAt: '2026-10-28T17:00:00.000Z' },
    ])

    const result = buildWorkSessions(entries)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toHaveLength(2)
    expect(result.value[0].workedMinutes + result.value[1].workedMinutes).toBe(480)
  })

  it('conta sessão aberta até asOfIso', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T08:00:00.000Z' },
    ])

    const result = buildWorkSessions(entries, '2026-10-28T10:30:00.000Z')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value[0].closed).toBe(false)
    expect(result.value[0].workedMinutes).toBe(150)
  })

  it('sem asOfIso, sessão aberta só conta segmentos fechados', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T08:00:00.000Z' },
      { id: '2', type: 'break_start', occurredAt: '2026-10-28T12:00:00.000Z' },
      { id: '3', type: 'break_end', occurredAt: '2026-10-28T13:00:00.000Z' },
    ])

    const result = buildWorkSessions(entries)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value[0].workedMinutes).toBe(240)
  })

  it('rejeita sequência inválida', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_out', occurredAt: '2026-10-28T17:00:00.000Z' },
    ])
    const result = buildWorkSessions(entries)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('INVALID_PUNCH_SEQUENCE')
  })

  it('rejeita saída com intervalo aberto', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T08:00:00.000Z' },
      { id: '2', type: 'break_start', occurredAt: '2026-10-28T12:00:00.000Z' },
      { id: '3', type: 'clock_out', occurredAt: '2026-10-28T17:00:00.000Z' },
    ])
    const result = buildWorkSessions(entries)
    expect(result.ok).toBe(false)
  })

  it('rejeita marcações em ordem cronológica inválida', () => {
    // Após ordenar por occurredAt, a saída aparece antes da entrada.
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T17:00:00.000Z' },
      { id: '2', type: 'clock_out', occurredAt: '2026-10-28T08:00:00.000Z' },
    ])
    const result = buildWorkSessions(entries)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('INVALID_PUNCH_SEQUENCE')
  })

  it('rejeita duração negativa quando asOfIso antecede a entrada', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T10:00:00.000Z' },
    ])
    const result = buildWorkSessions(entries, '2026-10-28T09:00:00.000Z')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('NEGATIVE_DURATION')
  })

  it('rejeita segunda entrada antes de fechar a primeira', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T08:00:00.000Z' },
      { id: '2', type: 'clock_in', occurredAt: '2026-10-28T09:00:00.000Z' },
    ])
    const result = buildWorkSessions(entries)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('INVALID_PUNCH_SEQUENCE')
  })
})

describe('assertSessionsDoNotOverlap', () => {
  it('detecta sessões com intervalos sobrepostos', () => {
    const result = assertSessionsDoNotOverlap([
      {
        clockInIso: '2026-10-28T08:00:00.000Z',
        clockOutIso: '2026-10-28T12:00:00.000Z',
        breaks: [],
        workedMinutes: 240,
        closed: true,
      },
      {
        clockInIso: '2026-10-28T11:00:00.000Z',
        clockOutIso: '2026-10-28T15:00:00.000Z',
        breaks: [],
        workedMinutes: 240,
        closed: true,
      },
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('OVERLAPPING_SESSIONS')
  })
})
