import type {
  DayOverride,
  DayOverrideKind,
  PunchType,
  TimeEntry,
  WorkSchedule,
} from '@/domain/entities'

export const USER_ID = 'user-ana'

const DEFAULT_WEEKDAYS: WorkSchedule['weekdays'] = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday: weekday as 1 | 2 | 3 | 4 | 5,
  clockIn: '08:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  clockOut: '17:00',
  expectedDailyMinutes: 480,
  expectedManual: false,
}))

export function makeSchedule(overrides: Partial<WorkSchedule> = {}): WorkSchedule {
  return {
    id: 'schedule-default',
    userId: USER_ID,
    mode: 'weekday_uniform',
    weekdays: DEFAULT_WEEKDAYS,
    periods: [
      { start: '08:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ],
    workweekDays: [1, 2, 3, 4, 5],
    timezone: 'America/Sao_Paulo',
    effectiveFrom: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function makeEntry(
  partial: Partial<TimeEntry> & Pick<TimeEntry, 'id' | 'type' | 'occurredAt' | 'dateKey'>,
): TimeEntry {
  return {
    userId: USER_ID,
    createdAt: partial.occurredAt,
    updatedAt: partial.occurredAt,
    ...partial,
  }
}

export function makeDayEntries(
  dateKey: string,
  punches: Array<{ id: string; type: PunchType; occurredAt: string }>,
): TimeEntry[] {
  return punches.map((punch) =>
    makeEntry({
      id: punch.id,
      dateKey,
      type: punch.type,
      occurredAt: punch.occurredAt,
    }),
  )
}

export function makeOverride(
  dateKey: string,
  kind: DayOverrideKind,
  id = `override-${dateKey}`,
): DayOverride {
  return {
    id,
    userId: USER_ID,
    dateKey,
    kind,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}
