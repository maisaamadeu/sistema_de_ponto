import type { WorkPeriod, WorkSchedule } from '@/domain/entities'

import { CalculationError } from './errors'
import {
  intervalsOverlap,
  parseTimeToMinutes,
  periodDurationMinutes,
  weekdayFromDateKey,
} from './time-math'

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
  return schedule.workweekDays.includes(weekday)
}
