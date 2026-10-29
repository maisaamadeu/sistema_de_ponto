import { describe, expect, it } from 'vitest'

import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  createBackupDocument,
  parseBackupJson,
} from './backup-schema'

function minimalBackup(overrides: Record<string, unknown> = {}) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_FORMAT_VERSION,
    exportedAt: '2026-10-29T12:00:00.000Z',
    schemaVersion: 3,
    data: {
      profiles: [],
      preferences: [],
      schedules: [],
      timeEntries: [],
      workDays: [],
      dayOverrides: [],
      meta: [],
    },
    ...overrides,
  }
}

describe('parseBackupJson', () => {
  it('aceita documento válido v1', () => {
    const result = parseBackupJson(minimalBackup())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.format).toBe(BACKUP_FORMAT)
    expect(result.value.version).toBe(1)
  })

  it('rejeita format incorreto', () => {
    const result = parseBackupJson(minimalBackup({ format: 'outro' }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toMatch(/format/i)
  })

  it('rejeita versão de backup não suportada', () => {
    const result = parseBackupJson(minimalBackup({ version: 99 }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toMatch(/não suportada|99/)
  })

  it('rejeita entrada com dateKey inválido', () => {
    const result = parseBackupJson(
      minimalBackup({
        data: {
          profiles: [],
          preferences: [],
          schedules: [],
          timeEntries: [
            {
              id: 'e1',
              userId: 'u1',
              dateKey: '29/10/2026',
              type: 'clock_in',
              occurredAt: '2026-10-29T11:00:00.000Z',
              createdAt: '2026-10-29T11:00:00.000Z',
              updatedAt: '2026-10-29T11:00:00.000Z',
            },
          ],
          workDays: [],
          dayOverrides: [],
        },
      }),
    )
    expect(result.ok).toBe(false)
  })
})

describe('createBackupDocument', () => {
  it('carimba format e versão atuais', () => {
    const doc = createBackupDocument({
      schemaVersion: 3,
      exportedAt: '2026-10-29T12:00:00.000Z',
      data: {
        profiles: [],
        preferences: [],
        schedules: [],
        timeEntries: [],
        workDays: [],
        dayOverrides: [],
      },
    })
    expect(doc.format).toBe(BACKUP_FORMAT)
    expect(doc.version).toBe(BACKUP_FORMAT_VERSION)
    expect(doc.schemaVersion).toBe(3)
  })
})
