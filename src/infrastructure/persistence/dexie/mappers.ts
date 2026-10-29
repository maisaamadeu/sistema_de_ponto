import { legacyScheduleToWeekdays } from '@/domain/calculation'
import type {
  DayOverride,
  TimeEntry,
  UserPreferences,
  UserProfile,
  WorkDay,
  WorkSchedule,
} from '@/domain/entities'

import type {
  DayOverrideRecord,
  TimeEntryRecord,
  UserPreferencesRecord,
  UserProfileRecord,
  WorkDayRecord,
  WorkScheduleRecord,
} from './ponto-db'

export function toUserProfile(record: UserProfileRecord): UserProfile {
  return { ...record }
}

export function toUserPreferences(record: UserPreferencesRecord): UserPreferences {
  return {
    ...record,
    absencePolicy: record.absencePolicy ?? 'no_debit',
  }
}

export function toWorkSchedule(record: WorkScheduleRecord): WorkSchedule {
  const weekdays =
    record.weekdays && record.weekdays.length > 0
      ? record.weekdays.map((day) => ({ ...day }))
      : legacyScheduleToWeekdays(record)

  return {
    id: record.id,
    userId: record.userId,
    mode: record.mode ?? 'weekday_uniform',
    weekdays,
    periods: record.periods.map((period) => ({ ...period })),
    workweekDays: [
      ...(record.workweekDays.length > 0
        ? record.workweekDays
        : weekdays.map((day) => day.weekday)),
    ],
    timezone: record.timezone,
    expectedDailyMinutes: record.expectedDailyMinutes,
    effectiveFrom: record.effectiveFrom,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

export function toTimeEntry(record: TimeEntryRecord): TimeEntry {
  return { ...record }
}

export function toWorkDay(record: WorkDayRecord): WorkDay {
  return {
    ...record,
    entryIds: [...record.entryIds],
  }
}

export function toDayOverride(record: DayOverrideRecord): DayOverride {
  return { ...record }
}

export function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-`
}
