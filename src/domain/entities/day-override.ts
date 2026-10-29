/**
 * Sobrescreve o tratamento de um dia específico.
 * `rest` aqui é descanso explícito (diferente do descanso semanal implícito da escala).
 */
export type DayOverrideKind =
  'rest' | 'day_off' | 'vacation' | 'holiday' | 'excused' | 'confirmed_absence'

export interface DayOverride {
  id: string
  userId: string
  dateKey: string
  kind: DayOverrideKind
  note?: string
  createdAt: string
  updatedAt: string
}

export type CreateDayOverrideInput = Omit<
  DayOverride,
  'id' | 'createdAt' | 'updatedAt'
> & { id?: string }

export type UpdateDayOverrideInput = Partial<
  Omit<DayOverride, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>
