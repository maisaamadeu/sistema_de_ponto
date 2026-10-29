/**
 * Configuração da jornada de trabalho do usuário (modo convidado ou autenticado).
 */
export interface WorkSettings {
  id: string
  displayName: string
  /** Início esperado da jornada, HH:mm. */
  workdayStart: string
  /** Fim esperado da jornada, HH:mm. */
  workdayEnd: string
  /** Duração planejada do intervalo em minutos. */
  breakMinutes: number
  /** Carga horária diária esperada em minutos. */
  expectedDailyMinutes: number
  timezone: string
  theme: 'system' | 'light' | 'dark'
  createdAt: string
  updatedAt: string
}

export type UpdateWorkSettingsInput = Partial<
  Omit<WorkSettings, 'id' | 'createdAt' | 'updatedAt'>
>
