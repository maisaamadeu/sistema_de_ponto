/**
 * Tipos de marcação de ponto suportados pela jornada.
 * Cálculos e regras de sequência ficam para etapas posteriores.
 */
export type PunchType = 'clock_in' | 'break_start' | 'break_end' | 'clock_out'

export interface TimeEntry {
  id: string
  /** Data local da jornada no formato yyyy-MM-dd. */
  dateKey: string
  type: PunchType
  /** Instantâneo ISO-8601 da marcação. */
  occurredAt: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTimeEntryInput {
  dateKey: string
  type: PunchType
  occurredAt: string
  note?: string
}

export interface UpdateTimeEntryInput {
  occurredAt?: string
  note?: string | null
  type?: PunchType
}
