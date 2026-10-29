import { NotFoundError, NotImplementedError } from '@/domain/errors/repository-error'
import type {
  CreateTimeEntryInput,
  TimeEntry,
  UpdateTimeEntryInput,
} from '@/domain/entities'
import type { TimeEntryMonthQuery, TimeEntryRepository } from '@/domain/repositories'

import { getPontoDatabase, type TimeEntryRecord } from './ponto-db'

function toDomain(record: TimeEntryRecord): TimeEntry {
  return {
    id: record.id,
    dateKey: record.dateKey,
    type: record.type,
    occurredAt: record.occurredAt,
    note: record.note,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

/**
 * Adapter IndexedDB via Dexie.
 * Persistência completa será habilitada nas próximas etapas;
 * aqui a estrutura e o contrato já estão prontos.
 */
export class DexieTimeEntryRepository implements TimeEntryRepository {
  private readonly db: ReturnType<typeof getPontoDatabase>

  constructor(db = getPontoDatabase()) {
    this.db = db
  }

  async listByDate(dateKey: string): Promise<TimeEntry[]> {
    const rows = await this.db.timeEntries
      .where('dateKey')
      .equals(dateKey)
      .sortBy('occurredAt')
    return rows.map(toDomain)
  }

  async listByMonth(_query: TimeEntryMonthQuery): Promise<TimeEntry[]> {
    // Consulta mensal depende de helpers de data/cálculo — fora do escopo desta etapa.
    throw new NotImplementedError('TimeEntryRepository.listByMonth')
  }

  async getById(id: string): Promise<TimeEntry | null> {
    const row = await this.db.timeEntries.get(id)
    return row ? toDomain(row) : null
  }

  async create(_input: CreateTimeEntryInput): Promise<TimeEntry> {
    throw new NotImplementedError('TimeEntryRepository.create')
  }

  async update(id: string, _input: UpdateTimeEntryInput): Promise<TimeEntry> {
    const existing = await this.db.timeEntries.get(id)
    if (!existing) {
      throw new NotFoundError('TimeEntry', id)
    }
    throw new NotImplementedError('TimeEntryRepository.update')
  }

  async delete(_id: string): Promise<void> {
    throw new NotImplementedError('TimeEntryRepository.delete')
  }
}
