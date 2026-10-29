import type { ReactNode } from 'react'

import { DependenciesProvider } from '@/infrastructure/di/dependencies-provider'
import { ThemeProvider } from '@/lib/theme/theme-provider'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <DependenciesProvider>{children}</DependenciesProvider>
    </ThemeProvider>
  )
}
