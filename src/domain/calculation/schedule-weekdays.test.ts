import { describe, expect, it } from 'vitest'

import {
  computeExpectedMinutesFromTimes,
  deriveExpectedMinutesForDate,
  legacyScheduleToWeekdays,
} from './schedule'
import { makeSchedule } from './test-fixtures'

describe('carga por dia da semana', () => {
  it('calcula minutos a partir da fita de horários', () => {
    expect(
      computeExpectedMinutesFromTimes({
        clockIn: '08:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        clockOut: '17:00',
      }),
    ).toBe(480)
  })

  it('usa weekday específico quando a carga difere', () => {
    const schedule = makeSchedule({
      mode: 'custom',
      weekdays: [
        {
          weekday: 1,
          clockIn: '08:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          clockOut: '17:00',
          expectedDailyMinutes: 480,
          expectedManual: false,
        },
        {
          weekday: 5,
          clockIn: '08:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          clockOut: '14:00',
          expectedDailyMinutes: 300,
          expectedManual: true,
        },
      ],
      workweekDays: [1, 5],
    })

    expect(deriveExpectedMinutesForDate(schedule, '2026-10-26')).toBe(480) // segunda
    expect(deriveExpectedMinutesForDate(schedule, '2026-10-30')).toBe(300) // sexta
  })

  it('reconstrói weekdays a partir do modelo legado', () => {
    const weekdays = legacyScheduleToWeekdays({
      periods: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
      workweekDays: [1, 2, 3],
      expectedDailyMinutes: 480,
    })
    expect(weekdays).toHaveLength(3)
    expect(weekdays[0].clockIn).toBe('08:00')
    expect(weekdays[0].expectedManual).toBe(true)
  })
})
