export type ThemePreference = 'system' | 'light' | 'dark'

/**
 * Política para dias úteis sem marcações.
 * - `no_debit`: não gera débito (padrão)
 * - `confirm_to_debit`: só debita após falta confirmada (override)
 * - `auto_debit`: debita automaticamente a carga esperada
 */
export type AbsencePolicy = 'no_debit' | 'confirm_to_debit' | 'auto_debit'

export interface UserPreferences {
  userId: string
  theme: ThemePreference
  /** 0 = domingo, 1 = segunda. */
  weekStartsOn: 0 | 1
  absencePolicy: AbsencePolicy
  /** Preenchido ao concluir o onboarding inicial. */
  onboardingCompletedAt?: string
  createdAt: string
  updatedAt: string
}

export type UpdateUserPreferencesInput = Partial<
  Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'>
>
