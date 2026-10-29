import { describe, expect, it } from 'vitest'

import { calculateWorkDay } from './calculate-day'
import { makeDayEntries, makeOverride, makeSchedule, USER_ID } from './test-fixtures'

describe('calculateWorkDay', () => {
  it('calcula jornada completa no saldo zero', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T08:00:00.000Z' },
      { id: '2', type: 'break_start', occurredAt: '2026-10-28T12:00:00.000Z' },
      { id: '3', type: 'break_end', occurredAt: '2026-10-28T13:00:00.000Z' },
      { id: '4', type: 'clock_out', occurredAt: '2026-10-28T17:00:00.000Z' },
    ])

    const result = calculateWorkDay({
      userId: USER_ID,
      dateKey: '2026-10-28',
      schedule: makeSchedule(),
      entries,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.kind).toBe('complete')
    expect(result.value.workedMinutes).toBe(480)
    expect(result.value.expectedMinutes).toBe(480)
    expect(result.value.balanceMinutes).toBe(0)
    expect(result.value.expectedFrozen).toBe(true)
  })

  it('gera crédito quando trabalha além do esperado', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T08:00:00.000Z' },
      { id: '2', type: 'clock_out', occurredAt: '2026-10-28T17:30:00.000Z' },
    ])

    const result = calculateWorkDay({
      userId: USER_ID,
      dateKey: '2026-10-28',
      schedule: makeSchedule({
        periods: [{ start: '08:00', end: '17:00' }],
        expectedDailyMinutes: 480,
      }),
      entries,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    // 08:00–17:30 = 570 sem intervalo na marcação
    expect(result.value.workedMinutes).toBe(570)
    expect(result.value.balanceMinutes).toBe(90)
  })

  it('marca incompleta e calcula saldo parcial', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T08:00:00.000Z' },
      { id: '2', type: 'break_start', occurredAt: '2026-10-28T12:00:00.000Z' },
      { id: '3', type: 'break_end', occurredAt: '2026-10-28T13:00:00.000Z' },
    ])

    const result = calculateWorkDay({
      userId: USER_ID,
      dateKey: '2026-10-28',
      schedule: makeSchedule(),
      entries,
      asOfIso: '2026-10-28T15:00:00.000Z',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.kind).toBe('incomplete')
    // 08-12 + 13-15 = 360
    expect(result.value.workedMinutes).toBe(360)
    expect(result.value.balanceMinutes).toBe(360 - 480)
  })

  it('dia sem registros não gera débito automático', () => {
    const result = calculateWorkDay({
      userId: USER_ID,
      dateKey: '2026-10-28',
      schedule: makeSchedule(),
      entries: [],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.kind).toBe('no_records')
    expect(result.value.expectedMinutes).toBe(480)
    expect(result.value.workedMinutes).toBe(0)
    expect(result.value.balanceMinutes).toBe(0)
    expect(result.value.expectedFrozen).toBe(false)
  })

  it('falta confirmada gera débito do esperado', () => {
    const result = calculateWorkDay({
      userId: USER_ID,
      dateKey: '2026-10-28',
      schedule: makeSchedule(),
      entries: [],
      override: makeOverride('2026-10-28', 'confirmed_absence'),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.kind).toBe('confirmed_absence')
    expect(result.value.expectedMinutes).toBe(480)
    expect(result.value.balanceMinutes).toBe(-480)
  })

  it.each([
    ['rest', 'rest'],
    ['day_off', 'day_off'],
    ['vacation', 'vacation'],
    ['holiday', 'holiday'],
    ['excused', 'excused'],
  ] as const)('override %s zera expectativa e saldo', (overrideKind, dayKind) => {
    const result = calculateWorkDay({
      userId: USER_ID,
      dateKey: '2026-10-28',
      schedule: makeSchedule(),
      entries: [],
      override: makeOverride('2026-10-28', overrideKind),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.kind).toBe(dayKind)
    expect(result.value.expectedMinutes).toBe(0)
    expect(result.value.balanceMinutes).toBe(0)
  })

  it('fim de semana sem override é descanso', () => {
    const result = calculateWorkDay({
      userId: USER_ID,
      dateKey: '2026-10-25',
      schedule: makeSchedule(),
      entries: [],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.kind).toBe('rest')
    expect(result.value.expectedMinutes).toBe(0)
    expect(result.value.balanceMinutes).toBe(0)
  })

  it('preserva carga esperada histórica quando a escala muda', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T08:00:00.000Z' },
      { id: '2', type: 'clock_out', occurredAt: '2026-10-28T16:00:00.000Z' },
    ])

    const first = calculateWorkDay({
      userId: USER_ID,
      dateKey: '2026-10-28',
      schedule: makeSchedule({ expectedDailyMinutes: 480 }),
      entries,
    })
    expect(first.ok).toBe(true)
    if (!first.ok) return

    const afterScheduleChange = calculateWorkDay({
      userId: USER_ID,
      dateKey: '2026-10-28',
      schedule: makeSchedule({ expectedDailyMinutes: 360 }),
      entries,
      previous: {
        id: first.value.id,
        expectedMinutes: first.value.expectedMinutes,
        expectedFrozen: first.value.expectedFrozen,
        createdAt: first.value.createdAt,
      },
    })

    expect(afterScheduleChange.ok).toBe(true)
    if (!afterScheduleChange.ok) return
    expect(afterScheduleChange.value.expectedMinutes).toBe(480)
    expect(afterScheduleChange.value.workedMinutes).toBe(480)
    expect(afterScheduleChange.value.balanceMinutes).toBe(0)
  })

  it('sessão noturna permanece no dateKey de início', () => {
    const entries = makeDayEntries('2026-10-28', [
      { id: '1', type: 'clock_in', occurredAt: '2026-10-28T22:00:00.000Z' },
      { id: '2', type: 'clock_out', occurredAt: '2026-10-29T06:00:00.000Z' },
    ])

    const result = calculateWorkDay({
      userId: USER_ID,
      dateKey: '2026-10-28',
      schedule: makeSchedule({
        periods: [{ start: '22:00', end: '06:00' }],
        workweekDays: [0, 1, 2, 3, 4, 5, 6],
      }),
      entries,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.workedMinutes).toBe(480)
    expect(result.value.expectedMinutes).toBe(480)
    expect(result.value.balanceMinutes).toBe(0)
  })
})
