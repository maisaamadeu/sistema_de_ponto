/**
 * Período esperado de trabalho em HH:mm (horário local do usuário).
 * Se `end <= start`, o período atravessa a meia-noite.
 */
export interface WorkPeriod {
  start: string
  end: string
}

/**
 * Configuração padrão de jornada.
 * A carga diária efetiva pode ser explícita ou derivada da soma dos períodos.
 */
export interface WorkSchedule {
  id: string
  userId: string
  periods: WorkPeriod[]
  /** Dias da semana com jornada esperada (0 = domingo … 6 = sábado). */
  workweekDays: ReadonlyArray<0 | 1 | 2 | 3 | 4 | 5 | 6>
  timezone: string
  /** Quando definido, prevalece sobre a soma dos períodos. */
  expectedDailyMinutes?: number
  /** Data a partir da qual esta configuração vale (yyyy-MM-dd). */
  effectiveFrom: string
  createdAt: string
  updatedAt: string
}

export type CreateWorkScheduleInput = Omit<
  WorkSchedule,
  'id' | 'createdAt' | 'updatedAt'
> & { id?: string }

export type UpdateWorkScheduleInput = Partial<
  Omit<WorkSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>
