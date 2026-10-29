import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  PunchStrip,
  StatusIndicator,
  SummaryCard,
  type StatusTone,
} from '@/components/shared'
import { ManualPunchForm } from '@/features/dashboard/manual-punch-form'
import { useDashboardDay } from '@/features/dashboard/use-dashboard-day'
import type { JourneyStatus } from '@/domain/punching'

function toStatusTone(status: JourneyStatus): StatusTone {
  if (status === 'invalid') return 'error'
  return status
}

export function DashboardPage() {
  const {
    loading,
    error,
    statusMessage,
    setStatusMessage,
    setError,
    submitting,
    viewModel,
    dateKey,
    punch,
  } = useDashboardDay()

  if (loading) {
    return (
      <section className="space-y-2" aria-labelledby="dashboard-title" aria-busy="true">
        <h1
          id="dashboard-title"
          className="text-[1.75rem] font-bold tracking-tight text-[var(--text)]"
        >
          Hoje
        </h1>
        <p className="text-sm text-[var(--muted)]">Carregando jornada…</p>
      </section>
    )
  }

  if (!viewModel) {
    return (
      <section className="space-y-4" aria-labelledby="dashboard-title">
        <h1
          id="dashboard-title"
          className="text-[1.75rem] font-bold tracking-tight text-[var(--text)]"
        >
          Hoje
        </h1>
        <p className="text-sm text-[var(--negative)]" role="alert">
          {error ?? 'Configure sua jornada para começar a bater o ponto.'}
        </p>
        <Button type="button" asChild>
          <Link to="/configuracoes">Ir para configurações</Link>
        </Button>
      </section>
    )
  }

  const primary = viewModel.nextPunch
  const primaryDisabled = submitting || primary.disabled === true || primary.type === null

  async function handlePrimaryClick() {
    if (!primary.type || primaryDisabled) return
    setStatusMessage(null)
    setError(null)
    try {
      await punch(primary.type, new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao registrar marcação.')
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="dashboard-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1
            id="dashboard-title"
            className="text-[1.75rem] font-bold tracking-tight text-balance text-[var(--text)] lg:text-[2rem]"
          >
            Hoje
          </h1>
          <p className="text-sm text-[var(--muted)] capitalize">{viewModel.dateLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusIndicator status={toStatusTone(viewModel.status)} />
          <Button
            type="button"
            data-testid="primary-punch"
            disabled={primaryDisabled}
            aria-busy={submitting || undefined}
            onClick={() => void handlePrimaryClick()}
          >
            {submitting ? 'Salvando…' : primary.label}
          </Button>
        </div>
      </div>

      <div aria-live="polite" className="min-h-5 space-y-1 text-sm">
        {statusMessage ? <p className="text-[var(--positive)]">{statusMessage}</p> : null}
        {error ? (
          <p className="text-[var(--negative)]" role="alert">
            {error}
          </p>
        ) : null}
        {primary.disabled && primary.reason ? (
          <p className="text-[var(--warning)]">{primary.reason}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {viewModel.summaries.map((item) => (
          <SummaryCard
            key={item.id}
            label={item.label}
            value={item.value}
            caption={item.caption}
            data-testid={`summary-${item.id}`}
          />
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text)]">Fita de marcações</h2>
        <PunchStrip
          punches={viewModel.punchStrip}
          activeType={viewModel.activePunchType}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text)]">Resumo do mês</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {viewModel.monthSummaries.map((item) => (
            <SummaryCard
              key={item.id}
              label={item.label}
              value={item.value}
              caption={item.caption}
            />
          ))}
        </div>
      </div>

      <ManualPunchForm
        dateKey={dateKey}
        defaultType={primary.type}
        disabled={submitting}
        onSubmit={async ({ type, occurredAt }) => {
          setStatusMessage(null)
          setError(null)
          await punch(type, occurredAt)
        }}
      />

      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to="/historico">Ver histórico</Link>
        </Button>
      </div>
    </section>
  )
}
