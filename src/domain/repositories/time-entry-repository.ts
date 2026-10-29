import type {
  CreateTimeEntryInput,
  TimeEntry,
  UpdateTimeEntryInput,
} from '@/domain/entities'

export interface TimeEntryMonthQuery {
  /** Ano civil, ex.: 2026. */
  year: number
  /** Mês 1–12. */
  month: number
}

/**
 * Porta de persistência de marcações.
 * Implementações concretas (Dexie/IndexedDB, Firestore, etc.)
 * residem em `infrastructure` e não vazam para o domínio.
 */
export interface TimeEntryRepository {
  listByDate(dateKey: string, userId: string): Promise<TimeEntry[]>
  listByMonth(query: TimeEntryMonthQuery, userId: string): Promise<TimeEntry[]>
  getById(id: string): Promise<TimeEntry | null>
  create(input: CreateTimeEntryInput): Promise<TimeEntry>
  update(id: string, input: UpdateTimeEntryInput): Promise<TimeEntry>
  delete(id: string): Promise<void>
}
