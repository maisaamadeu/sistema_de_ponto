/**
 * Tipos de marcação de ponto.
 * Sessões são reconstruídas ordenando marcações por `occurredAt`.
 */
export type PunchType = 'clock_in' | 'break_start' | 'break_end' | 'clock_out'

export interface TimeEntry {
  id: string
  userId: string
  /**
   * Dia lógico da jornada (yyyy-MM-dd).
   * Sessões que atravessam a meia-noite permanecem vinculadas ao dia de início.
   */
  dateKey: string
  type: PunchType
  /** Instantâneo ISO-8601 da marcação. */
  occurredAt: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTimeEntryInput {
  userId: string
  dateKey: string
  type: PunchType
  occurredAt: string
  note?: string
}

export interface UpdateTimeEntryInput {
  occurredAt?: string
  note?: string | null
  type?: PunchType
  dateKey?: string
}
