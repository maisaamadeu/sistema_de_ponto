import { useCallback, useEffect, useRef, useState } from 'react'

import { accumulateBalances, type BalanceTotals } from '@/domain/calculation'
import type { TimeEntry, WorkDay, WorkSchedule } from '@/domain/entities'
import {
  buildDashboardViewModel,
  deriveJourneyStatus,
  localDateKey,
  registerPunch,
  type DashboardViewModel,
} from '@/domain/punching'
import type { PunchType } from '@/domain/entities'
import { useGuestSession } from '@/hooks/use-guest-session'

interface MonthStats {
  totals: BalanceTotals
  expectedMinutes: number
  workedMinutes: number
}

const EMPTY_MONTH: MonthStats = {
  totals: { creditsMinutes: 0, debitsMinutes: 0, netMinutes: 0, daysCounted: 0 },
  expectedMinutes: 0,
  workedMinutes: 0,
}

export function useDashboardDay() {
  const {
    session,
    loading: sessionLoading,
    error: sessionError,
    refresh,
  } = useGuestSession()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [persistedDay, setPersistedDay] = useState<WorkDay | null>(null)
  const [schedule, setSchedule] = useState<WorkSchedule | null>(null)
  const [month, setMonth] = useState<MonthStats>(EMPTY_MONTH)
  const [nowIso, setNowIso] = useState(() => new Date().toISOString())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submitLock = useRef(false)

  const dateKey = localDateKey()

  const reload = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const userId = session.profile.id
      const effective =
        (await session.deps.schedules.getEffectiveOn(userId, dateKey)) ?? session.schedule
      if (!effective) {
        setError('Configure sua jornada em Configurações antes de bater o ponto.')
        setSchedule(null)
        setEntries([])
        setPersistedDay(null)
        return
      }

      const [dayEntries, workDay, monthDays] = await Promise.all([
        session.deps.timeEntries.listByDate(dateKey, userId),
        session.deps.workDays.getByUserAndDate(userId, dateKey),
        session.deps.workDays.listByMonth(userId, {
          year: Number(dateKey.slice(0, 4)),
          month: Number(dateKey.slice(5, 7)),
        }),
      ])

      setSchedule(effective)
      setEntries(dayEntries)
      setPersistedDay(workDay)

      const totals = accumulateBalances(monthDays)
      setMonth({
        totals,
        expectedMinutes: monthDays.reduce((sum, day) => sum + day.expectedMinutes, 0),
        workedMinutes: monthDays.reduce((sum, day) => sum + day.workedMinutes, 0),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar o dia')
    } finally {
      setLoading(false)
    }
  }, [session, dateKey])

  useEffect(() => {
    if (sessionLoading || !session) return
    let cancelled = false
    void (async () => {
      await reload()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [session, sessionLoading, reload])

  // Relógio ao vivo — só na UI, sem gravar. Atualiza enquanto a jornada está aberta.
  const journeyStatus = deriveJourneyStatus(entries)
  const journeyOpen = journeyStatus === 'working' || journeyStatus === 'on_break'

  useEffect(() => {
    if (!journeyOpen) return
    const tick = () => {
      if (document.visibilityState === 'hidden') return
      setNowIso(new Date().toISOString())
    }
    tick()
    const id = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [journeyOpen])

  const viewModel: DashboardViewModel | null =
    schedule && session
      ? buildDashboardViewModel({
          dateKey,
          entries,
          schedule,
          persistedDay,
          absencePolicy: session.preferences.absencePolicy,
          asOfIso: nowIso,
          monthTotals: month.totals,
          monthExpectedMinutes: month.expectedMinutes,
          monthWorkedMinutes: month.workedMinutes,
        })
      : null

  const punch = useCallback(
    async (type: PunchType, occurredAt: string, note?: string) => {
      if (!session || !schedule) {
        throw new Error('Sessão ou jornada indisponível.')
      }
      if (submitLock.current) {
        throw new Error('Aguarde a confirmação da marcação anterior.')
      }

      submitLock.current = true
      setSubmitting(true)
      setStatusMessage(null)
      setError(null)

      try {
        const result = await registerPunch({
          userId: session.profile.id,
          dateKey,
          type,
          occurredAt,
          note,
          existingEntries: entries,
          timeEntries: session.deps.timeEntries,
        })

        // Só após persistência confirmada:
        setEntries(result.entries)
        const workDay = await session.deps.workDays.getByUserAndDate(
          session.profile.id,
          dateKey,
        )
        setPersistedDay(workDay)

        const monthDays = await session.deps.workDays.listByMonth(session.profile.id, {
          year: Number(dateKey.slice(0, 4)),
          month: Number(dateKey.slice(5, 7)),
        })
        setMonth({
          totals: accumulateBalances(monthDays),
          expectedMinutes: monthDays.reduce((sum, day) => sum + day.expectedMinutes, 0),
          workedMinutes: monthDays.reduce((sum, day) => sum + day.workedMinutes, 0),
        })

        setStatusMessage('Marcação salva neste navegador.')
        return result.entry
      } finally {
        submitLock.current = false
        setSubmitting(false)
      }
    },
    [session, schedule, dateKey, entries],
  )

  const waitingSession = sessionLoading || (!session && !sessionError)

  return {
    session,
    sessionLoading,
    loading: waitingSession || (Boolean(session) && loading),
    error: sessionError ?? error,
    statusMessage,
    setStatusMessage,
    setError,
    submitting,
    viewModel,
    entries,
    dateKey,
    punch,
    reload,
    refreshSession: refresh,
  }
}
