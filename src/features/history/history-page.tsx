import { CalendarDays } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function HistoryPage() {
  return (
    <section className="space-y-4" aria-labelledby="history-title">
      <div className="flex items-center gap-2">
        <CalendarDays className="text-muted-foreground size-5" aria-hidden />
        <h1 id="history-title" className="text-xl font-semibold tracking-tight">
          Histórico
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
          <CardDescription>
            Navegação mensal e edição de registros anteriores serão adicionadas depois.
          </CardDescription>
        </CardHeader>
      </Card>
    </section>
  )
}
