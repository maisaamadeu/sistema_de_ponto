import type { PunchType, TimeEntry } from '@/domain/entities'
import { buildWorkSessions } from '@/domain/calculation'

function sortEntries(entries: TimeEntry[]): TimeEntry[] {
  return [...entries].sort((a, b) => {
    const byTime = Date.parse(a.occurredAt) - Date.parse(b.occurredAt)
    if (byTime !== 0) return byTime
    return a.id.localeCompare(b.id)
  })
}

/** Valida sequência e sobreposição de uma lista completa de marcações do dia. */
export function validateDayEntries(
  entries: TimeEntry[],
): { ok: true } | { ok: false; message: string } {
  const result = buildWorkSessions(sortEntries(entries))
  if (!result.ok) {
    return { ok: false, message: result.error.message }
  }
  return { ok: true }
}

/** Simula edição de uma marcação e valida o resultado. */
export function validateEntryUpdate(
  entries: TimeEntry[],
  entryId: string,
  patch: { type?: PunchType; occurredAt?: string },
): { ok: true; next: TimeEntry[] } | { ok: false; message: string } {
  const next = entries.map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          type: patch.type ?? entry.type,
          occurredAt: patch.occurredAt ?? entry.occurredAt,
          updatedAt: new Date().toISOString(),
        }
      : entry,
  )
  const valid = validateDayEntries(next)
  if (!valid.ok) return valid
  return { ok: true, next }
}

/** Simula exclusão e valida o restante (permite lista vazia). */
export function validateEntryRemoval(
  entries: TimeEntry[],
  entryId: string,
): { ok: true; next: TimeEntry[] } | { ok: false; message: string } {
  const next = entries.filter((entry) => entry.id !== entryId)
  if (next.length === 0) return { ok: true, next }
  const valid = validateDayEntries(next)
  if (!valid.ok) return valid
  return { ok: true, next }
}
