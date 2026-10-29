import type { UpdateUserProfileInput, UserProfile } from '@/domain/entities'

export interface UserProfileRepository {
  getById(id: string): Promise<UserProfile | null>
  save(profile: UserProfile): Promise<UserProfile>
  update(id: string, input: UpdateUserProfileInput): Promise<UserProfile>
  delete(id: string): Promise<void>
}
