import type { ReactNode } from 'react'

import { DependenciesProvider } from '@/infrastructure/di/dependencies-provider'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return <DependenciesProvider>{children}</DependenciesProvider>
}
