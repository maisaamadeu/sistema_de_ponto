/**
 * Classificação do dia após aplicar escala, override e marcações.
 */
export type DayKind =
  | 'complete'
  | 'incomplete'
  | 'no_records'
  | 'rest'
  | 'day_off'
  | 'vacation'
  | 'holiday'
  | 'excused'
  | 'confirmed_absence'

/**
 * Resultado materializado de um dia.
 * `expectedMinutes` é um snapshot: mudanças posteriores na escala padrão
 * não devem recalcular a carga esperada de dias já registrados.
 */
export interface WorkDay {
  userId: string
  dateKey: string
  kind: DayKind
  expectedMinutes: number
  workedMinutes: number
  /** workedMinutes - expectedMinutes (0 quando o dia não gera débito automático). */
  balanceMinutes: number
  entryIds: string[]
  overrideId?: string
  /** Indica que expectedMinutes deve ser preservado em recálculos. */
  expectedFrozen: boolean
}
