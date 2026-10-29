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
  return { ...record }
}

export function toWorkSchedule(record: WorkScheduleRecord): WorkSchedule {
  return {
    ...record,
    workweekDays: [...record.workweekDays],
    periods: record.periods.map((period) => ({ ...period })),
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
