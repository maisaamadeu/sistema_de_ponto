/**
 * Período esperado de trabalho em HH:mm (horário local do usuário).
 * Se `end <= start`, o período atravessa a meia-noite.
 */
export interface WorkPeriod {
  start: string
  end: string
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * Modelo de um dia da semana na jornada.
 * `periods` espelha entrada→intervalo e retorno→saída.
 */
export interface WeekdaySchedule {
  weekday: Weekday
  clockIn: string
  breakStart: string
  breakEnd: string
  clockOut: string
  /** Carga esperada em minutos (auto ou manual). */
  expectedDailyMinutes: number
  /** true quando o usuário sobrescreveu o cálculo automático. */
  expectedManual: boolean
}

export type ScheduleMode = 'weekday_uniform' | 'custom'

/**
 * Configuração versionada de jornada.
 * Alterações criam um novo registro com `effectiveFrom` novo;
 * dias já materializados preservam `expectedMinutes` histórico.
 */
export interface WorkSchedule {
  id: string
  userId: string
  mode: ScheduleMode
  /** Dias trabalhados com horários. Dias omitidos não são trabalhados. */
  weekdays: WeekdaySchedule[]
  /**
   * Períodos representativos (primeiro dia útil) — compatível com o motor legado.
   * Derivados de `weekdays` na persistência.
   */
  periods: WorkPeriod[]
  /** Dias da semana com jornada esperada (0 = domingo … 6 = sábado). */
  workweekDays: ReadonlyArray<Weekday>
  timezone: string
  /**
   * Carga “padrão” representativa (média/primeiro dia).
   * O cálculo diário preferencialmente usa `weekdays`.
   */
  expectedDailyMinutes?: number
  /** Data a partir da qual esta versão vale (yyyy-MM-dd). */
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
