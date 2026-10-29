import { describe, expect, it } from 'vitest'

import type { WorkDay } from '@/domain/entities'
import { USER_ID } from '@/domain/calculation/test-fixtures'

import { buildMonthCsv, monthCsvFilename } from './export-csv'
import { buildMonthHistoryRows, buildMonthSummary } from './month-view'

function workDay(
  dateKey: string,
  partial: Partial<WorkDay> &
    Pick<WorkDay, 'kind' | 'workedMinutes' | 'expectedMinutes' | 'balanceMinutes'>,
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

describe('buildMonthCsv', () => {
  it('exporta linhas com registros e bloco de resumo', () => {
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
      ],
      entriesByDate: new Map(),
      overridesByDate: new Map(),
    })
    const summary = buildMonthSummary(rows)
    const csv = buildMonthCsv({ year: 2026, month: 10, rows, summary })

    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('data,semana,entrada')
    expect(csv).toContain('2026-10-01')
    expect(csv).toContain('trabalhado_min,480')
    expect(csv).toContain('saldo_liquido_min,0')
    expect(monthCsvFilename(2026, 10)).toBe('ponto-facil-2026-10.csv')
  })
})
