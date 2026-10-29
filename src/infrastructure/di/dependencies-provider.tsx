import { useState, type ReactNode } from 'react'

import {
  createAppDependencies,
  type AppDependencies,
} from '@/infrastructure/di/container'
import { DependenciesContext } from '@/infrastructure/di/dependencies-context'

interface DependenciesProviderProps {
  children: ReactNode
  value?: AppDependencies
}

export function DependenciesProvider({ children, value }: DependenciesProviderProps) {
  // Mantém a composition root estável entre renders — evita loops em effects
  // que dependem de `deps` (ex.: useGuestSession).
  const [fallback] = useState(() => createAppDependencies())
  const deps = value ?? fallback

  return (
    <DependenciesContext.Provider value={deps}>{children}</DependenciesContext.Provider>
  )
}
