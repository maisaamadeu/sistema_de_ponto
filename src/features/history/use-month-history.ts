import { useCallback, useEffect, useMemo, useState } from 'react'

import type { DayOverride, DayOverrideKind, PunchType, TimeEntry } from '@/domain/entities'
import {
  buildMonthHistoryRows,
  buildMonthSummary,
  monthLabelPt,
  validateEntryRemoval,
  validateEntryUpdate,
  type HistoryDayRow,
  type MonthSummary,
} from '@/domain/history'
import {
  combineLocalDateAndTime,
  isPunchTransitionAllowed,
  localDateKey,
} from '@/domain/punching'
import { useGuestSession } from '@/hooks/use-guest-session'
import {
  exportFullBackup,
  importFullBackup,
} from '@/infrastructure/persistence/dexie'

function parseYearMonth(value: string): { year: number; month: number } {
  const [year, month] = value.split('-').map(Number)
  return { year, month }
}

export function useMonthHistory() {
  const { session, loading: sessionLoading, error: sessionError, refresh } =
    useGuestSession()
  const today = localDateKey()
  const [monthValue, setMonthValue] = useState(() => today.slice(0, 7))
  const [rows, setRows] = useState<HistoryDayRow[]>([])
  const [summary, setSummary] = useState<MonthSummary | null>(null)
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [dayEntries, setDayEntries] = useState<TimeEntry[]>([])
  const [dayOverride, setDayOverride] = useState<DayOverride | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { year, month } = useMemo(() => parseYearMonth(monthValue), [monthValue])

  const loadMonth = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const userId = session.profile.id
      const query = { year, month }
      const [workDays, entries, overrides] = await Promise.all([
        session.deps.workDays.listByMonth(userId, query),
        session.deps.timeEntries.listByMonth(query, userId),
        session.deps.dayOverrides.listByMonth(userId, query),
      ])

      const entriesByDate = new Map<string, TimeEntry[]>()
      for (const entry of entries) {
        const list = entriesByDate.get(entry.dateKey) ?? []
        list.push(entry)
        entriesByDate.set(entry.dateKey, list)
      }
      const overridesByDate = new Map(
        overrides.map((item) => [item.dateKey, item] as const),
      )

      const nextRows = buildMonthHistoryRows({
        year,
        month,
        workDays,
        entriesByDate,
        overridesByDate,
      })
      setRows(nextRows)
      setSummary(buildMonthSummary(nextRows))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar o histórico')
    } finally {
      setLoading(false)
    }
  }, [session, year, month])

  const loadDay = useCallback(
    async (dateKey: string) => {
      if (!session) return
      const [entries, override] = await Promise.all([
        session.deps.timeEntries.listByDate(dateKey, session.profile.id),
        session.deps.dayOverrides.getByUserAndDate(session.profile.id, dateKey),
      ])
      setDayEntries(
        [...entries].sort(
          (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt),
        ),
      )
      setDayOverride(override)
    },
    [session],
  )

  const reload = useCallback(async () => {
    await loadMonth()
    if (selectedDateKey) await loadDay(selectedDateKey)
  }, [loadMonth, loadDay, selectedDateKey])

  useEffect(() => {
    if (sessionLoading || !session) return
    let cancelled = false
    const handle = window.setTimeout(() => {
      void loadMonth().then(() => {
        if (cancelled) return
      })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [session, sessionLoading, loadMonth])

  const selectDay = useCallback(
    async (dateKey: string) => {
      setSelectedDateKey(dateKey)
      setStatusMessage(null)
      await loadDay(dateKey)
    },
    [loadDay],
  )

  const addEntry = useCallback(
    async (type: PunchType, timeHHmm: string) => {
      if (!session || !selectedDateKey) return
      setBusy(true)
      setError(null)
      setStatusMessage(null)
      try {
        const occurredAt = combineLocalDateAndTime(selectedDateKey, timeHHmm)
        const allowed = isPunchTransitionAllowed(dayEntries, type, occurredAt)
        if (!allowed.ok) throw new Error(allowed.message)
        await session.deps.timeEntries.create({
          userId: session.profile.id,
          dateKey: selectedDateKey,
          type,
          occurredAt,
        })
        setStatusMessage('Evento adicionado.')
        await reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao adicionar evento')
        throw err
      } finally {
        setBusy(false)
      }
    },
    [session, selectedDateKey, dayEntries, reload],
  )

  const updateEntry = useCallback(
    async (entryId: string, patch: { type?: PunchType; timeHHmm?: string }) => {
      if (!session || !selectedDateKey) return
      setBusy(true)
      setError(null)
      setStatusMessage(null)
      try {
        const occurredAt = patch.timeHHmm
          ? combineLocalDateAndTime(selectedDateKey, patch.timeHHmm)
          : undefined
        const valid = validateEntryUpdate(dayEntries, entryId, {
          type: patch.type,
          occurredAt,
        })
        if (!valid.ok) throw new Error(valid.message)
        await session.deps.timeEntries.update(entryId, {
          type: patch.type,
          occurredAt,
        })
        setStatusMessage('Evento atualizado.')
        await reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao editar evento')
        throw err
      } finally {
        setBusy(false)
      }
    },
    [session, selectedDateKey, dayEntries, reload],
  )

  const removeEntry = useCallback(
    async (entryId: string) => {
      if (!session || !selectedDateKey) return
      setBusy(true)
      setError(null)
      setStatusMessage(null)
      try {
        const valid = validateEntryRemoval(dayEntries, entryId)
        if (!valid.ok) throw new Error(valid.message)
        await session.deps.timeEntries.delete(entryId)
        setStatusMessage('Evento removido.')
        await reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao remover evento')
        throw err
      } finally {
        setBusy(false)
      }
    },
    [session, selectedDateKey, dayEntries, reload],
  )

  const setOverride = useCallback(
    async (kind: DayOverrideKind | null) => {
      if (!session || !selectedDateKey) return
      setBusy(true)
      setError(null)
      setStatusMessage(null)
      try {
        const existing = await session.deps.dayOverrides.getByUserAndDate(
          session.profile.id,
          selectedDateKey,
        )
        if (kind === null) {
          if (existing) await session.deps.dayOverrides.delete(existing.id)
          setStatusMessage('Marcação de dia removida.')
        } else if (existing) {
          await session.deps.dayOverrides.update(existing.id, { kind })
          setStatusMessage('Situação do dia atualizada.')
        } else {
          await session.deps.dayOverrides.create({
            userId: session.profile.id,
            dateKey: selectedDateKey,
            kind,
          })
          setStatusMessage('Situação do dia definida.')
        }
        await reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao marcar o dia')
        throw err
      } finally {
        setBusy(false)
      }
    },
    [session, selectedDateKey, reload],
  )

  return {
    session,
    loading: sessionLoading || loading,
    error: sessionError ?? error,
    setError,
    statusMessage,
    setStatusMessage,
    busy,
    monthValue,
    setMonthValue,
    year,
    month,
    monthLabel: monthLabelPt(year, month),
    rows,
    summary,
    selectedDateKey,
    selectDay,
    clearSelection: () => {
      setSelectedDateKey(null)
      setDayEntries([])
      setDayOverride(null)
    },
    dayEntries,
    dayOverride,
    addEntry,
    updateEntry,
    removeEntry,
    setOverride,
    reload,
    exportBackup: () => exportFullBackup(session?.deps.db),
    importBackup: async (raw: unknown) => {
      if (!session) throw new Error('Sessão indisponível')
      await importFullBackup(raw, session.deps.db)
      await refresh()
      await loadMonth()
    },
  }
}
