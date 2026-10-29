import { describe, expect, it } from 'vitest'

import type { TimeEntry } from '@/domain/entities'

import {
  deriveJourneyStatus,
  derivePrimaryPunch,
  isPunchTransitionAllowed,
  punchStripFromEntries,
} from './next-punch'

const USER = 'user-1'
const DATE = '2026-10-29'

function entry(partial: Pick<TimeEntry, 'id' | 'type' | 'occurredAt'>): TimeEntry {
  return {
    userId: USER,
    dateKey: DATE,
    createdAt: partial.occurredAt,
    updatedAt: partial.occurredAt,
    ...partial,
  }
}

describe('derivePrimaryPunch', () => {
  it('começa com entrada sem marcações', () => {
    const next = derivePrimaryPunch([])
    expect(next.type).toBe('clock_in')
  })

  it('cicla entrada → intervalo → retorno → saída', () => {
    const e1 = [
      entry({ id: '1', type: 'clock_in', occurredAt: '2026-10-29T11:00:00.000Z' }),
    ]
    expect(derivePrimaryPunch(e1).type).toBe('break_start')

    const e2 = [
      ...e1,
      entry({ id: '2', type: 'break_start', occurredAt: '2026-10-29T15:00:00.000Z' }),
    ]
    expect(derivePrimaryPunch(e2).type).toBe('break_end')

    const e3 = [
      ...e2,
      entry({ id: '3', type: 'break_end', occurredAt: '2026-10-29T16:00:00.000Z' }),
    ]
    expect(derivePrimaryPunch(e3).type).toBe('clock_out')

    const e4 = [
      ...e3,
      entry({ id: '4', type: 'clock_out', occurredAt: '2026-10-29T20:00:00.000Z' }),
    ]
    expect(derivePrimaryPunch(e4).type).toBe('clock_in')
    expect(deriveJourneyStatus(e4)).toBe('done')
  })

  it('deriva status working / on_break a partir dos registros', () => {
    const working = [
      entry({ id: '1', type: 'clock_in', occurredAt: '2026-10-29T11:00:00.000Z' }),
    ]
    expect(deriveJourneyStatus(working)).toBe('working')

    const onBreak = [
      ...working,
      entry({ id: '2', type: 'break_start', occurredAt: '2026-10-29T15:00:00.000Z' }),
    ]
    expect(deriveJourneyStatus(onBreak)).toBe('on_break')
  })

  it('bloqueia transição inválida (saída sem entrada)', () => {
    const result = isPunchTransitionAllowed([], 'clock_out', '2026-10-29T12:00:00.000Z')
    expect(result.ok).toBe(false)
  })

  it('bloqueia duplicata quase simultânea do mesmo tipo', () => {
    const entries = [
      entry({ id: '1', type: 'clock_in', occurredAt: '2026-10-29T11:00:00.000Z' }),
    ]
    const result = isPunchTransitionAllowed(
      entries,
      'clock_in',
      '2026-10-29T11:00:00.400Z',
    )
    expect(result.ok).toBe(false)
  })

  it('preenche a fita a partir da sessão atual', () => {
    const entries = [
      entry({ id: '1', type: 'clock_in', occurredAt: '2026-10-29T11:00:00.000Z' }),
      entry({ id: '2', type: 'break_start', occurredAt: '2026-10-29T15:00:00.000Z' }),
    ]
    const strip = punchStripFromEntries(entries)
    expect(strip[0].occurredAt).toBeTruthy()
    expect(strip[1].occurredAt).toBeTruthy()
    expect(strip[2].occurredAt).toBeNull()
    expect(strip[3].occurredAt).toBeNull()
  })
})
