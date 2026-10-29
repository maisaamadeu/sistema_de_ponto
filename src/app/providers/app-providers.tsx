import type { ReactNode } from 'react'

import { GuestSessionProvider } from '@/hooks/guest-session-context'
import { DependenciesProvider } from '@/infrastructure/di/dependencies-provider'
import { ThemeProvider } from '@/lib/theme/theme-provider'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <DependenciesProvider>
        <GuestSessionProvider>{children}</GuestSessionProvider>
      </DependenciesProvider>
    </ThemeProvider>
  )
}
