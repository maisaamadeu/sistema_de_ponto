/**
 * Agregado legado usado pelos adapters de persistência da etapa base.
 * Novas regras devem usar UserProfile + WorkSchedule + UserPreferences.
 */
export interface WorkSettings {
  id: string
  displayName: string
  workdayStart: string
  workdayEnd: string
  breakMinutes: number
  expectedDailyMinutes: number
  timezone: string
  theme: 'system' | 'light' | 'dark'
  createdAt: string
  updatedAt: string
}

export type UpdateWorkSettingsInput = Partial<
  Omit<WorkSettings, 'id' | 'createdAt' | 'updatedAt'>
>
