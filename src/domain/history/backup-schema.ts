import { z } from 'zod'

/** Versão do formato de backup JSON (independente do schema IndexedDB). */
export const BACKUP_FORMAT = 'ponto-facil-backup' as const
export const BACKUP_FORMAT_VERSION = 1 as const
/** Versões de formato aceitas na importação. */
export const SUPPORTED_BACKUP_FORMAT_VERSIONS = [1] as const

const timeEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['clock_in', 'break_start', 'break_end', 'clock_out']),
  occurredAt: z.string().min(1),
  note: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

const workDaySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum([
    'complete',
    'incomplete',
    'no_records',
    'rest',
    'day_off',
    'vacation',
    'holiday',
    'excused',
    'confirmed_absence',
  ]),
  expectedMinutes: z.number().int(),
  workedMinutes: z.number().int(),
  balanceMinutes: z.number().int(),
  entryIds: z.array(z.string()),
  overrideId: z.string().optional(),
  expectedFrozen: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

const dayOverrideSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum([
    'rest',
    'day_off',
    'vacation',
    'holiday',
    'excused',
    'confirmed_absence',
  ]),
  note: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

const periodSchema = z.object({
  start: z.string(),
  end: z.string(),
})

const weekdayScheduleSchema = z.object({
  weekday: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  clockIn: z.string(),
  breakStart: z.string(),
  breakEnd: z.string(),
  clockOut: z.string(),
  expectedDailyMinutes: z.number().int(),
  expectedManual: z.boolean(),
})

const scheduleSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  mode: z.enum(['weekday_uniform', 'custom']).optional(),
  weekdays: z.array(weekdayScheduleSchema).optional(),
  periods: z.array(periodSchema),
  workweekDays: z.array(
    z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
    ]),
  ),
  timezone: z.string(),
  expectedDailyMinutes: z.number().int().optional(),
  effectiveFrom: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const profileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string(),
  email: z.string().optional(),
  isGuest: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const preferencesSchema = z.object({
  userId: z.string().min(1),
  theme: z.enum(['system', 'light', 'dark']),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  absencePolicy: z.enum(['no_debit', 'confirm_to_debit', 'auto_debit']).optional(),
  onboardingCompletedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const metaSchema = z.object({
  key: z.string(),
  value: z.string(),
})

export const backupDocumentSchema = z
  .object({
    format: z.literal(BACKUP_FORMAT),
    version: z.number().int().positive(),
    exportedAt: z.string().min(1),
    schemaVersion: z.number().int().positive(),
    data: z.object({
      profiles: z.array(profileSchema),
      preferences: z.array(preferencesSchema),
      schedules: z.array(scheduleSchema),
      timeEntries: z.array(timeEntrySchema),
      workDays: z.array(workDaySchema),
      dayOverrides: z.array(dayOverrideSchema),
      meta: z.array(metaSchema).optional(),
    }),
  })
  .superRefine((doc, ctx) => {
    if (
      !(SUPPORTED_BACKUP_FORMAT_VERSIONS as readonly number[]).includes(doc.version)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['version'],
        message: `Versão de backup não suportada: ${doc.version}. Aceitas: ${SUPPORTED_BACKUP_FORMAT_VERSIONS.join(', ')}.`,
      })
    }
  })

export type BackupDocument = z.infer<typeof backupDocumentSchema>

export function parseBackupJson(raw: unknown):
  | { ok: true; value: BackupDocument }
  | { ok: false; message: string } {
  const parsed = backupDocumentSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const path = first?.path?.length ? `${first.path.join('.')}: ` : ''
    return {
      ok: false,
      message: `${path}${first?.message ?? 'Backup JSON inválido.'}`,
    }
  }
  return { ok: true, value: parsed.data }
}

export function createBackupDocument(input: {
  schemaVersion: number
  data: BackupDocument['data']
  exportedAt?: string
}): BackupDocument {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_FORMAT_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    schemaVersion: input.schemaVersion,
    data: input.data,
  }
}
