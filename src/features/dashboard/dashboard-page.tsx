import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  DataTable,
  type DataTableColumn,
  PunchStrip,
  StatusIndicator,
  SummaryCard,
} from '@/components/shared'
import {
  demoHistoryRows,
  demoPunchStrip,
  demoTodaySummaries,
  type DemoDayRow,
} from '@/features/demo/mock-data'

const recentColumns: DataTableColumn<DemoDayRow>[] = [
  {
    id: 'date',
    header: 'Dia',
    cell: (row) => row.dateLabel,
  },
  {
    id: 'in',
    header: 'Entrada',
    align: 'right',
    cell: (row) => row.clockIn,
  },
  {
    id: 'out',
    header: 'Saída',
    align: 'right',
    cell: (row) => row.clockOut,
  },
  {
    id: 'worked',
    header: 'Trabalhado',
    align: 'right',
    cell: (row) => row.worked,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <StatusIndicator status={row.status} />,
  },
]

export function DashboardPage() {
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
          <p className="text-sm text-[var(--muted)]">
            Terça-feira, 28 de out. de 2026 · dados de demonstração
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusIndicator status="working" />
          <Button type="button" disabled title="Lógica de ponto fora desta etapa">
            Registrar saída
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {demoTodaySummaries.map((item) => (
          <SummaryCard
            key={item.id}
            label={item.label}
            value={item.value}
            caption={item.caption}
          />
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text)]">Fita de marcações</h2>
        <PunchStrip punches={demoPunchStrip} activeType="clock_out" />
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text)]">Dias recentes</h2>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/historico">Ver histórico</Link>
          </Button>
        </div>
        <DataTable
          columns={recentColumns}
          rows={demoHistoryRows.slice(0, 3)}
          getRowId={(row) => row.id}
          caption="Últimos dias com marcações fictícias"
        />
      </div>
    </section>
  )
}
