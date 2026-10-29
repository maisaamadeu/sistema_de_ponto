export interface UserProfile {
  id: string
  displayName: string
  email?: string
  /** Indica perfil local sem autenticação. */
  isGuest: boolean
  createdAt: string
  updatedAt: string
}

export type UpdateUserProfileInput = Partial<
  Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'isGuest'>
>
