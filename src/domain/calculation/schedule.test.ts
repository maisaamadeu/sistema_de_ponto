import { describe, expect, it } from 'vitest'

import { CalculationError } from './errors'
import {
  assertNoOverlappingPeriods,
  deriveExpectedDailyMinutes,
  isScheduledWorkday,
  sumPeriodsMinutes,
} from './schedule'
import { makeSchedule } from './test-fixtures'

describe('sumPeriodsMinutes', () => {
  it('soma múltiplos períodos sem overlap', () => {
    expect(
      sumPeriodsMinutes([
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ]),
    ).toBe(480)
  })

  it('detecta períodos sobrepostos', () => {
    expect(() =>
      assertNoOverlappingPeriods([
        { start: '08:00', end: '12:00' },
        { start: '11:00', end: '15:00' },
      ]),
    ).toThrow(CalculationError)
  })

  it('detecta overlap com período noturno', () => {
    expect(() =>
      assertNoOverlappingPeriods([
        { start: '22:00', end: '06:00' },
        { start: '05:00', end: '09:00' },
      ]),
    ).toThrow(CalculationError)
  })
})

describe('deriveExpectedDailyMinutes', () => {
  it('deriva da soma dos períodos', () => {
    expect(deriveExpectedDailyMinutes(makeSchedule())).toBe(480)
  })

  it('respeita expectedDailyMinutes explícito', () => {
    expect(deriveExpectedDailyMinutes(makeSchedule({ expectedDailyMinutes: 360 }))).toBe(
      360,
    )
  })
})

describe('isScheduledWorkday', () => {
  it('reconhece dia útil e fim de semana', () => {
    const schedule = makeSchedule()
    expect(isScheduledWorkday(schedule, '2026-10-28')).toBe(true) // quarta
    expect(isScheduledWorkday(schedule, '2026-10-25')).toBe(false) // domingo
  })
})
