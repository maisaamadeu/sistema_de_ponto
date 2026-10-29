import { useRef } from 'react'
import { CalendarDays, Download, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DataTable,
  type DataTableColumn,
  EmptyState,
  StatusIndicator,
  SummaryCard,
} from '@/components/shared'
import { DayDetailPanel } from '@/features/history/day-detail-panel'
import { useMonthHistory } from '@/features/history/use-month-history'
import {
  buildMonthCsv,
  monthCsvFilename,
  type HistoryDayRow,
} from '@/domain/history'
import { cn } from '@/lib/utils'

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const columns: DataTableColumn<HistoryDayRow>[] = [
  {
    id: 'date',
    header: 'Data',
    cell: (row) => (
      <span>
        <span className="font-medium">{row.dateLabel}</span>
        <span className="ml-2 text-[var(--muted)] capitalize">{row.weekdayLabel}</span>
      </span>
    ),
  },
  { id: 'in', header: 'Entrada', align: 'right', cell: (row) => row.clockIn },
  {
    id: 'breakStart',
    header: 'Intervalo',
    align: 'right',
    cell: (row) => row.breakStart,
  },
  { id: 'breakEnd', header: 'Retorno', align: 'right', cell: (row) => row.breakEnd },
  { id: 'out', header: 'Saída', align: 'right', cell: (row) => row.clockOut },
  {
    id: 'worked',
    header: 'Trabalhado',
    align: 'right',
    cell: (row) => row.workedLabel,
  },
  {
    id: 'expected',
    header: 'Esperado',
    align: 'right',
    cell: (row) => row.expectedLabel,
  },
  {
    id: 'balance',
    header: 'Saldo',
    align: 'right',
    cell: (row) => (
      <span
        className={cn(
          row.balanceMinutes > 0 && 'text-[var(--positive)]',
          row.balanceMinutes < 0 && 'text-[var(--negative)]',
        )}
      >
        {row.balanceLabel}
      </span>
    ),
  },
  {
    id: 'situation',
    header: 'Situação',
    cell: (row) => (
      <span className="inline-flex items-center gap-2">
        <StatusIndicator status={row.statusTone} showLabel={false} />
        <span
          className={cn(
            row.isIncomplete && 'text-[var(--warning)]',
            row.isComplete && 'text-[var(--text)]',
          )}
        >
          {row.situationLabel}
        </span>
      </span>
    ),
  },
]

export function HistoryPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const {
    loading,
    error,
    setError,
    statusMessage,
    setStatusMessage,
    busy,
    monthValue,
    setMonthValue,
    year,
    month,
    monthLabel,
    rows,
    summary,
    selectedDateKey,
    selectDay,
    clearSelection,
    dayEntries,
    dayOverride,
    addEntry,
    updateEntry,
    removeEntry,
    setOverride,
    exportBackup,
    importBackup,
  } = useMonthHistory()

  const visibleRows = rows.filter((row) => row.hasRecords)
  const empty = !loading && visibleRows.length === 0

  async function handleExportCsv() {
    if (!summary) return
    const csv = buildMonthCsv({ year, month, rows, summary })
    downloadBlob(
      monthCsvFilename(year, month),
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    )
    setStatusMessage('CSV do mês baixado.')
  }

  async function handleExportJson() {
    try {
      const backup = await exportBackup()
      if (!backup) throw new Error('Backup indisponível')
      downloadBlob(
        `ponto-facil-backup-${backup.exportedAt.slice(0, 10)}.json`,
        new Blob([JSON.stringify(backup, null, 2)], {
          type: 'application/json;charset=utf-8',
        }),
      )
      setStatusMessage('Backup JSON baixado.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao exportar backup')
    }
  }

  async function handleImportFile(file: File) {
    setError(null)
    setStatusMessage(null)
    try {
      const text = await file.text()
      const raw: unknown = JSON.parse(text)
      await importBackup(raw)
      setStatusMessage('Backup importado com sucesso.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao importar JSON. Verifique schema e versão.',
      )
    }
  }

  if (loading) {
    return (
      <section className="space-y-2" aria-labelledby="history-title" aria-busy="true">
        <h1
          id="history-title"
          className="text-[1.75rem] font-bold tracking-tight text-[var(--text)]"
        >
          Histórico
        </h1>
        <p className="text-sm text-[var(--muted)]">Carregando mês…</p>
      </section>
    )
  }

  return (
    <section className="space-y-6" aria-labelledby="history-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1
            id="history-title"
            className="text-balance text-[1.75rem] font-bold tracking-tight text-[var(--text)] lg:text-[2rem]"
          >
            Histórico
          </h1>
          <p className="text-sm capitalize text-[var(--muted)]">{monthLabel}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="history-month">Mês e ano</Label>
            <Input
              id="history-month"
              name="month"
              type="month"
              value={monthValue}
              autoComplete="off"
              onChange={(event) => {
                clearSelection()
                setMonthValue(event.target.value)
              }}
              className="tabular h-9 w-full min-w-[12rem] border-[var(--control)] bg-[var(--surface)]"
              data-testid="history-month"
            />
          </div>
          <Button type="button" variant="outline" onClick={() => void handleExportCsv()}>
            <Download className="size-4" aria-hidden="true" />
            CSV do mês
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleExportJson()}>
            <Download className="size-4" aria-hidden="true" />
            Backup JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" aria-hidden="true" />
            Importar JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Arquivo de backup JSON"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleImportFile(file)
              event.target.value = ''
            }}
          />
        </div>
      </div>

      <div aria-live="polite" className="min-h-5 space-y-1 text-sm">
        {statusMessage ? (
          <p className="text-[var(--positive)]" data-testid="history-status">
            {statusMessage}
          </p>
        ) : null}
        {error ? (
          <p className="text-[var(--negative)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {summary.cards.map((card) => (
            <SummaryCard
              key={card.id}
              label={card.label}
              value={card.value}
              caption={card.caption}
              data-testid={`month-summary-${card.id}`}
            />
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          'grid gap-6',
          selectedDateKey && 'xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]',
        )}
      >
        <div className="min-w-0 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--text)]">Jornadas do mês</h2>
          {empty ? (
            <EmptyState
              icon={CalendarDays}
              title={`Nenhuma marcação em ${monthLabel}`}
              description="Selecione outro mês ou registre pontos no dashboard. Você também pode importar um backup JSON."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={visibleRows}
              getRowId={(row) => row.dateKey}
              caption={`Jornadas de ${monthLabel}`}
              onRowClick={(row) => void selectDay(row.dateKey)}
              selectedRowId={selectedDateKey}
            />
          )}
          {!empty ? (
            <p className="text-xs text-[var(--muted)]">
              Clique em um dia para ver e editar os eventos. Completas e incompletas
              aparecem com situações distintas.
            </p>
          ) : null}
        </div>

        {selectedDateKey ? (
          <DayDetailPanel
            dateKey={selectedDateKey}
            entries={dayEntries}
            override={dayOverride}
            busy={busy}
            onClose={clearSelection}
            onAdd={addEntry}
            onUpdate={updateEntry}
            onRemove={removeEntry}
            onSetOverride={setOverride}
          />
        ) : null}
      </div>
    </section>
  )
}
