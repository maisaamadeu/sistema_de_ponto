import type { UpdateWorkSettingsInput, WorkSettings } from '@/domain/entities'

/**
 * Porta de persistência das configurações de jornada.
 */
export interface WorkSettingsRepository {
  get(): Promise<WorkSettings | null>
  save(input: UpdateWorkSettingsInput): Promise<WorkSettings>
  clear(): Promise<void>
}
