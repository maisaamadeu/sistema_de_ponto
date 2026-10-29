import type {
  Weekday,
  WeekdaySchedule,
  WorkPeriod,
  WorkSchedule,
} from '@/domain/entities'

import { CalculationError } from './errors'
import {
  intervalsOverlap,
  parseTimeToMinutes,
  periodDurationMinutes,
  weekdayFromDateKey,
} from './time-math'

/**
 * Carga esperada a partir de entrada / intervalo / saída.
 * Auto: (entrada→início intervalo) + (fim intervalo→saída).
 */
export function computeExpectedMinutesFromTimes(input: {
  clockIn: string
  breakStart: string
  breakEnd: string
  clockOut: string
}): number {
  return (
    periodDurationMinutes(input.clockIn, input.breakStart) +
    periodDurationMinutes(input.breakEnd, input.clockOut)
  )
}

/** Converte um dia da jornada em períodos de trabalho (compatível com o motor). */
export function weekdayToPeriods(day: WeekdaySchedule): WorkPeriod[] {
  return [
    { start: day.clockIn, end: day.breakStart },
    { start: day.breakEnd, end: day.clockOut },
  ]
}

export function resolveWeekdaySchedule(
  schedule: WorkSchedule,
  weekday: Weekday,
): WeekdaySchedule | undefined {
  return schedule.weekdays?.find((day) => day.weekday === weekday)
}

/**
 * Carga esperada para uma data, preferindo `weekdays` quando disponível.
 */
export function deriveExpectedMinutesForDate(
  schedule: WorkSchedule,
  dateKey: string,
): number {
  const weekday = weekdayFromDateKey(dateKey)
  const day = resolveWeekdaySchedule(schedule, weekday)
  if (day) {
    if (day.expectedManual) {
      if (!Number.isInteger(day.expectedDailyMinutes) || day.expectedDailyMinutes < 0) {
        throw new CalculationError(
          'INVALID_PERIOD',
          'expectedDailyMinutes do dia deve ser inteiro ≥ 0',
        )
      }
      return day.expectedDailyMinutes
    }
    return computeExpectedMinutesFromTimes(day)
  }
  return deriveExpectedDailyMinutes(schedule)
}

/** Normaliza um período para minutos absolutos em uma janela de 48h (dia + seguinte). */
export function expandPeriodToAbsoluteRanges(
  period: WorkPeriod,
): Array<{ start: number; end: number }> {
  const start = parseTimeToMinutes(period.start)
  const end = parseTimeToMinutes(period.end)

  if (end > start) {
    return [{ start, end }]
  }
  if (end < start) {
    return [
      { start, end: 24 * 60 },
      { start: 0, end },
    ]
  }
  throw new CalculationError(
    'INVALID_PERIOD',
    `Período com duração zero: ${period.start}–${period.end}`,
  )
}

export function assertNoOverlappingPeriods(periods: WorkPeriod[]): void {
  const ranges: Array<{ start: number; end: number; index: number }> = []

  periods.forEach((period, index) => {
    for (const range of expandPeriodToAbsoluteRanges(period)) {
      ranges.push({ ...range, index })
    }
  })

  for (let i = 0; i < ranges.length; i += 1) {
    for (let j = i + 1; j < ranges.length; j += 1) {
      if (ranges[i].index === ranges[j].index) continue
      if (
        intervalsOverlap(ranges[i].start, ranges[i].end, ranges[j].start, ranges[j].end)
      ) {
        throw new CalculationError(
          'OVERLAPPING_PERIODS',
          'Períodos da escala se sobrepõem',
          { left: ranges[i].index, right: ranges[j].index },
        )
      }
    }
  }
}

export function sumPeriodsMinutes(periods: WorkPeriod[]): number {
  assertNoOverlappingPeriods(periods)
  return periods.reduce(
    (total, period) => total + periodDurationMinutes(period.start, period.end),
    0,
  )
}

export function deriveExpectedDailyMinutes(schedule: WorkSchedule): number {
  if (schedule.expectedDailyMinutes !== undefined) {
    if (
      !Number.isInteger(schedule.expectedDailyMinutes) ||
      schedule.expectedDailyMinutes < 0
    ) {
      throw new CalculationError(
        'INVALID_PERIOD',
        'expectedDailyMinutes deve ser inteiro ≥ 0',
      )
    }
    return schedule.expectedDailyMinutes
  }
  if (schedule.periods.length === 0) {
    throw new CalculationError(
      'INVALID_PERIOD',
      'Escala sem períodos e sem expectedDailyMinutes',
    )
  }
  return sumPeriodsMinutes(schedule.periods)
}

export function isScheduledWorkday(schedule: WorkSchedule, dateKey: string): boolean {
  const weekday = weekdayFromDateKey(dateKey)
  if (schedule.weekdays && schedule.weekdays.length > 0) {
    return schedule.weekdays.some((day) => day.weekday === weekday)
  }
  return schedule.workweekDays.includes(weekday)
}

/** Monta weekdays a partir do modelo legado (periods + workweekDays). */
export function legacyScheduleToWeekdays(schedule: {
  periods: WorkPeriod[]
  workweekDays: ReadonlyArray<Weekday>
  expectedDailyMinutes?: number
}): WeekdaySchedule[] {
  const morning = schedule.periods[0] ?? { start: '08:00', end: '12:00' }
  const afternoon = schedule.periods[1] ?? { start: '13:00', end: '17:00' }
  const expected =
    schedule.expectedDailyMinutes ??
    sumPeriodsMinutes([
      { start: morning.start, end: morning.end },
      { start: afternoon.start, end: afternoon.end },
    ])

  return schedule.workweekDays.map((weekday) => ({
    weekday,
    clockIn: morning.start,
    breakStart: morning.end,
    breakEnd: afternoon.start,
    clockOut: afternoon.end,
    expectedDailyMinutes: expected,
    expectedManual: schedule.expectedDailyMinutes !== undefined,
  }))
}
