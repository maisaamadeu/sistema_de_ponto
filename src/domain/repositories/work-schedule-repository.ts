import type {
  CreateWorkScheduleInput,
  UpdateWorkScheduleInput,
  WorkSchedule,
} from '@/domain/entities'

export interface WorkScheduleRepository {
  getById(id: string): Promise<WorkSchedule | null>
  listByUserId(userId: string): Promise<WorkSchedule[]>
  /** Escala vigente na data (maior effectiveFrom ≤ dateKey). */
  getEffectiveOn(userId: string, dateKey: string): Promise<WorkSchedule | null>
  create(input: CreateWorkScheduleInput): Promise<WorkSchedule>
  update(id: string, input: UpdateWorkScheduleInput): Promise<WorkSchedule>
  delete(id: string): Promise<void>
}
