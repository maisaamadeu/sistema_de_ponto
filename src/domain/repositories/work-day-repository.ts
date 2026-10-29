import type { WorkDay } from '@/domain/entities'
import type { TimeEntryMonthQuery } from '@/domain/repositories/time-entry-repository'

export interface WorkDayRepository {
  getById(id: string): Promise<WorkDay | null>
  getByUserAndDate(userId: string, dateKey: string): Promise<WorkDay | null>
  listByMonth(userId: string, query: TimeEntryMonthQuery): Promise<WorkDay[]>
  save(workDay: WorkDay): Promise<WorkDay>
  delete(id: string): Promise<void>
  deleteByUserAndDate(userId: string, dateKey: string): Promise<void>
}
