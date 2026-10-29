export type ThemePreference = 'system' | 'light' | 'dark'

export interface UserPreferences {
  userId: string
  theme: ThemePreference
  /** 0 = domingo, 1 = segunda. */
  weekStartsOn: 0 | 1
  createdAt: string
  updatedAt: string
}
