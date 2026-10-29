import type {
  CreateDayOverrideInput,
  DayOverride,
  UpdateDayOverrideInput,
} from '@/domain/entities'
import type { TimeEntryMonthQuery } from '@/domain/repositories/time-entry-repository'

export interface DayOverrideRepository {
  getById(id: string): Promise<DayOverride | null>
  getByUserAndDate(userId: string, dateKey: string): Promise<DayOverride | null>
  listByMonth(userId: string, query: TimeEntryMonthQuery): Promise<DayOverride[]>
  create(input: CreateDayOverrideInput): Promise<DayOverride>
  update(id: string, input: UpdateDayOverrideInput): Promise<DayOverride>
  delete(id: string): Promise<void>
}
