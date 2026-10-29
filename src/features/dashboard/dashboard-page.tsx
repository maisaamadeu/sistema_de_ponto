import { Clock3 } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DashboardPage() {
  return (
    <section className="space-y-4" aria-labelledby="dashboard-title">
      <div className="flex items-center gap-2">
        <Clock3 className="text-muted-foreground size-5" aria-hidden />
        <h1 id="dashboard-title" className="text-xl font-semibold tracking-tight">
          Dashboard
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
          <CardDescription>
            Registro de ponto, intervalo e cálculos diários serão implementados nas
            próximas etapas.
          </CardDescription>
        </CardHeader>
      </Card>
    </section>
  )
}
