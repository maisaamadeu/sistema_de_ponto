import { describe, expect, it } from 'vitest'

import type { DayOverride, TimeEntry, WorkDay } from '@/domain/entities'
import { makeDayEntries, makeOverride, USER_ID } from '@/domain/calculation/test-fixtures'

import {
  buildMonthHistoryRows,
  buildMonthSummary,
  kindToStatusTone,
  monthLabelPt,
} from './month-view'

function workDay(
  dateKey: string,
  partial: Partial<WorkDay> & Pick<WorkDay, 'kind' | 'workedMinutes' | 'expectedMinutes' | 'balanceMinutes'>,
): WorkDay {
  return {
    id: `wd_${dateKey}`,
    userId: USER_ID,
    dateKey,
    entryIds: [],
    expectedFrozen: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...partial,
  }
}

describe('buildMonthHistoryRows', () => {
  it('monta todos os dias do mês e diferencia completa/incompleta', () => {
    const completeEntries = makeDayEntries('2026-10-01', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-01T11:00:00.000Z' },
      { id: '2', type: 'break_start', occurredAt: '2026-10-01T15:00:00.000Z' },
      { id: '3', type: 'break_end', occurredAt: '2026-10-01T16:00:00.000Z' },
      { id: '4', type: 'clock_out', occurredAt: '2026-10-01T20:00:00.000Z' },
    ])
    const incompleteEntries = makeDayEntries('2026-10-02', [
      { id: '5', type: 'clock_in', occurredAt: '2026-10-02T11:00:00.000Z' },
    ])
    const override = makeOverride('2026-10-03', 'vacation')

    const entriesByDate = new Map<string, TimeEntry[]>([
      ['2026-10-01', completeEntries],
      ['2026-10-02', incompleteEntries],
    ])
    const overridesByDate = new Map<string, DayOverride>([['2026-10-03', override]])

    const rows = buildMonthHistoryRows({
      year: 2026,
      month: 10,
      workDays: [
        workDay('2026-10-01', {
          kind: 'complete',
          workedMinutes: 480,
          expectedMinutes: 480,
          balanceMinutes: 0,
        }),
        workDay('2026-10-02', {
          kind: 'incomplete',
          workedMinutes: 120,
          expectedMinutes: 480,
          balanceMinutes: -360,
        }),
        workDay('2026-10-03', {
          kind: 'vacation',
          workedMinutes: 0,
          expectedMinutes: 0,
          balanceMinutes: 0,
        }),
      ],
      entriesByDate,
      overridesByDate,
    })

    expect(rows).toHaveLength(31)
    const day1 = rows.find((row) => row.dateKey === '2026-10-01')!
    const day2 = rows.find((row) => row.dateKey === '2026-10-02')!
    const day3 = rows.find((row) => row.dateKey === '2026-10-03')!
    const empty = rows.find((row) => row.dateKey === '2026-10-04')!

    expect(day1.isComplete).toBe(true)
    expect(day1.situationLabel).toBe('Completa')
    expect(day1.statusTone).toBe('done')
    expect(day1.hasRecords).toBe(true)

    expect(day2.isIncomplete).toBe(true)
    expect(day2.situationLabel).toBe('Incompleta')
    expect(day2.statusTone).toBe('incomplete')

    expect(day3.situationLabel).toBe('Férias')
    expect(day3.overrideKind).toBe('vacation')
    expect(day3.statusTone).toBe('on_break')

    expect(empty.kind).toBe('empty')
    expect(empty.hasRecords).toBe(false)
    expect(empty.situationLabel).toBe('—')
  })
})

describe('buildMonthSummary', () => {
  it('agrega trabalhados, esperados, créditos, débitos e líquido', () => {
    const rows = buildMonthHistoryRows({
      year: 2026,
      month: 10,
      workDays: [
        workDay('2026-10-01', {
          kind: 'complete',
          workedMinutes: 510,
          expectedMinutes: 480,
          balanceMinutes: 30,
        }),
        workDay('2026-10-02', {
          kind: 'incomplete',
          workedMinutes: 420,
          expectedMinutes: 480,
          balanceMinutes: -60,
        }),
      ],
      entriesByDate: new Map(),
      overridesByDate: new Map(),
    })

    const summary = buildMonthSummary(rows)
    expect(summary.workedMinutes).toBe(930)
    expect(summary.expectedMinutes).toBe(960)
    expect(summary.totals.creditsMinutes).toBe(30)
    expect(summary.totals.debitsMinutes).toBe(60)
    expect(summary.totals.netMinutes).toBe(-30)
    expect(summary.completeDays).toBe(1)
    expect(summary.incompleteDays).toBe(1)
    expect(summary.cards.map((card) => card.id)).toEqual([
      'worked',
      'expected',
      'credits',
      'debits',
      'net',
    ])
  })
})

describe('kindToStatusTone / monthLabelPt', () => {
  it('mapeia tons e rótulo do mês', () => {
    expect(kindToStatusTone('confirmed_absence')).toBe('error')
    expect(kindToStatusTone('complete')).toBe('done')
    expect(monthLabelPt(2026, 10)).toMatch(/outubro/i)
    expect(monthLabelPt(2026, 10)).toMatch(/2026/)
  })
})
