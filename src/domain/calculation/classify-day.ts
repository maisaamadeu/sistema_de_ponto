import type { DayKind, DayOverride, WorkSchedule } from '@/domain/entities'

import { isScheduledWorkday } from './schedule'
import type { WorkSession } from './sessions'

const OVERRIDE_TO_KIND: Record<
  DayOverride['kind'],
  Exclude<DayKind, 'complete' | 'incomplete' | 'no_records'>
> = {
  rest: 'rest',
  day_off: 'day_off',
  vacation: 'vacation',
  holiday: 'holiday',
  excused: 'excused',
  confirmed_absence: 'confirmed_absence',
}

export function classifyDayKind(input: {
  dateKey: string
  schedule: WorkSchedule
  override?: DayOverride | null
  sessions: WorkSession[]
  hasEntries: boolean
}): DayKind {
  const { dateKey, schedule, override, sessions, hasEntries } = input

  if (override) {
    return OVERRIDE_TO_KIND[override.kind]
  }

  if (!isScheduledWorkday(schedule, dateKey)) {
    return 'rest'
  }

  if (!hasEntries) {
    return 'no_records'
  }

  const allClosed = sessions.length > 0 && sessions.every((session) => session.closed)
  return allClosed ? 'complete' : 'incomplete'
}
