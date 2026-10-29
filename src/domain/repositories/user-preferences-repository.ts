import type { UpdateUserPreferencesInput, UserPreferences } from '@/domain/entities'

export interface UserPreferencesRepository {
  getByUserId(userId: string): Promise<UserPreferences | null>
  save(preferences: UserPreferences): Promise<UserPreferences>
  update(userId: string, input: UpdateUserPreferencesInput): Promise<UserPreferences>
  delete(userId: string): Promise<void>
}
