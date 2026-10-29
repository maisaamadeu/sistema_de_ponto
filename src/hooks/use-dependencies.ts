import { useContext } from 'react'

import { DependenciesContext } from '@/infrastructure/di/dependencies-context'

export function useDependencies() {
  const context = useContext(DependenciesContext)
  if (!context) {
    throw new Error('useDependencies deve ser usado dentro de DependenciesProvider')
  }
  return context
}
