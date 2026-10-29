import { describe, expect, it } from 'vitest'

import type { WorkDay } from '@/domain/entities'

import {
  accumulateBalances,
  calculateMonthlyBalance,
  calculateOverallBalance,
} from './accumulate'
import { USER_ID } from './test-fixtures'

function day(
  dateKey: string,
  balanceMinutes: number,
  partial: Partial<WorkDay> = {},
): WorkDay {
  return {
    id: `wd_${USER_ID}_${dateKey}`,
    userId: USER_ID,
    dateKey,
    kind: 'complete',
    expectedMinutes: 480,
    workedMinutes: 480 + balanceMinutes,
    balanceMinutes,
    entryIds: [],
    expectedFrozen: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('accumulateBalances', () => {
  it('separa créditos, débitos e líquido', () => {
    const totals = accumulateBalances([
      day('2026-10-01', 30),
      day('2026-10-02', -45),
      day('2026-10-03', 15),
      day('2026-10-04', 0),
    ])

    expect(totals.creditsMinutes).toBe(45)
    expect(totals.debitsMinutes).toBe(45)
    expect(totals.netMinutes).toBe(0)
    expect(totals.daysCounted).toBe(4)
  })
})

describe('calculateMonthlyBalance', () => {
  it('filtra apenas o mês pedido', () => {
    const days = [
      day('2026-09-30', 60),
      day('2026-10-01', 30),
      day('2026-10-15', -10),
      day('2026-11-01', 100),
    ]

    const october = calculateMonthlyBalance(days, 2026, 10)
    expect(october.creditsMinutes).toBe(30)
    expect(october.debitsMinutes).toBe(10)
    expect(october.netMinutes).toBe(20)
    expect(october.daysCounted).toBe(2)
  })
})

describe('calculateOverallBalance', () => {
  it('agrega todos os dias', () => {
    const overall = calculateOverallBalance([
      day('2026-09-30', 60),
      day('2026-10-01', -20),
    ])
    expect(overall.creditsMinutes).toBe(60)
    expect(overall.debitsMinutes).toBe(20)
    expect(overall.netMinutes).toBe(40)
  })
})
