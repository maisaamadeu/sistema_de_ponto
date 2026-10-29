import type { WorkSchedule } from '@/domain/entities'

import { ensureGuestSession, type GuestSession } from './guest-session'
import type { PontoDatabase } from './ponto-db'
import { DexieWorkScheduleRepository } from './dexie-work-schedule-repository'

/** Bootstrap de convidado com jornada padrão (útil em testes que precisam de escala). */
export async function ensureGuestWithSchedule(
  db: PontoDatabase,
  effectiveFrom = '1970-01-01',
): Promise<GuestSession & { schedule: WorkSchedule }> {
  const guest = await ensureGuestSession(db)
  if (guest.schedule) {
    return { ...guest, schedule: guest.schedule }
  }

  const schedules = new DexieWorkScheduleRepository(db)
  const schedule = await schedules.create({
    userId: guest.profile.id,
    mode: 'weekday_uniform',
    weekdays: [1, 2, 3, 4, 5].map((weekday) => ({
      weekday: weekday as 1 | 2 | 3 | 4 | 5,
      clockIn: '08:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      clockOut: '17:00',
      expectedDailyMinutes: 480,
      expectedManual: false,
    })),
    periods: [
      { start: '08:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ],
    workweekDays: [1, 2, 3, 4, 5],
    timezone: 'America/Sao_Paulo',
    expectedDailyMinutes: 480,
    effectiveFrom,
  })

  return {
    ...guest,
    schedule,
  }
}
