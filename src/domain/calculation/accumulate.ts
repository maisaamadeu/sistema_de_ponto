import type { WorkDay } from '@/domain/entities'

import { assertDateKey } from './time-math'

export interface BalanceTotals {
  /** Soma dos saldos diários positivos. */
  creditsMinutes: number
  /** Soma dos |saldos diários negativos|. */
  debitsMinutes: number
  /** credits - debits (= soma dos saldos diários). */
  netMinutes: number
  daysCounted: number
}

export function accumulateBalances(days: WorkDay[]): BalanceTotals {
  let creditsMinutes = 0
  let debitsMinutes = 0

  for (const day of days) {
    if (day.balanceMinutes > 0) creditsMinutes += day.balanceMinutes
    if (day.balanceMinutes < 0) debitsMinutes += -day.balanceMinutes
  }

  return {
    creditsMinutes,
    debitsMinutes,
    netMinutes: creditsMinutes - debitsMinutes,
    daysCounted: days.length,
  }
}

export function filterDaysByMonth(
  days: WorkDay[],
  year: number,
  month: number,
): WorkDay[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  return days.filter((day) => {
    assertDateKey(day.dateKey)
    return day.dateKey.startsWith(prefix)
  })
}

export function calculateMonthlyBalance(
  days: WorkDay[],
  year: number,
  month: number,
): BalanceTotals {
  return accumulateBalances(filterDaysByMonth(days, year, month))
}

export function calculateOverallBalance(days: WorkDay[]): BalanceTotals {
  return accumulateBalances(days)
}
