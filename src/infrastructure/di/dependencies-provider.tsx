import type { ReactNode } from 'react'

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
  const deps = value ?? createAppDependencies()

  return (
    <DependenciesContext.Provider value={deps}>{children}</DependenciesContext.Provider>
  )
}
