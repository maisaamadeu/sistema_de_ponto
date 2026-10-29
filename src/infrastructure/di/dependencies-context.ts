import { createContext } from 'react'

import type { AppDependencies } from '@/infrastructure/di/container'

export const DependenciesContext = createContext<AppDependencies | null>(null)
