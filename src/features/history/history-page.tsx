import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DataTable,
  type DataTableColumn,
  DateField,
  EmptyState,
  StatusIndicator,
} from '@/components/shared'
import {
  demoEmptyMonthLabel,
  demoHistoryRows,
  type DemoDayRow,
} from '@/features/demo/mock-data'

const columns: DataTableColumn<DemoDayRow>[] = [
  { id: 'date', header: 'Dia', cell: (row) => row.dateLabel },
  { id: 'in', header: 'Entrada', align: 'right', cell: (row) => row.clockIn },
  {
    id: 'breakStart',
    header: 'Intervalo',
    align: 'right',
    cell: (row) => row.breakStart,
  },
  { id: 'breakEnd', header: 'Retorno', align: 'right', cell: (row) => row.breakEnd },
  { id: 'out', header: 'Saída', align: 'right', cell: (row) => row.clockOut },
  { id: 'worked', header: 'Trabalhado', align: 'right', cell: (row) => row.worked },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <StatusIndicator status={row.status} />,
  },
]

export function HistoryPage() {
  const [monthAnchor, setMonthAnchor] = useState('2026-10-01')
  const showEmpty = monthAnchor.startsWith('2026-11')

  const monthLabel = useMemo(() => {
    const date = new Date(`${monthAnchor}T12:00:00`)
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  }, [monthAnchor])

  return (
    <section className="space-y-6" aria-labelledby="history-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1
            id="history-title"
            className="text-[1.75rem] font-bold tracking-tight text-balance text-[var(--text)] lg:text-[2rem]"
          >
            Histórico
          </h1>
          <p className="text-sm text-[var(--muted)] capitalize">
            {monthLabel} · demonstração sem lógica de ponto
          </p>
        </div>
        <DateField
          className="w-full max-w-xs"
          label="Mês de referência"
          name="month"
          value={monthAnchor}
          onChange={setMonthAnchor}
          hint="Use novembro/2026 para ver o estado vazio…"
        />
      </div>

      {showEmpty ? (
        <EmptyState
          icon={CalendarDays}
          title={`Nenhuma marcação em ${demoEmptyMonthLabel}`}
          description="Quando houver registros neste mês, eles aparecem aqui em ordem cronológica."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => setMonthAnchor('2026-10-01')}
            >
              Voltar a outubro
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={demoHistoryRows}
          getRowId={(row) => row.id}
          caption={`Marcações fictícias de ${monthLabel}`}
        />
      )}
    </section>
  )
}
