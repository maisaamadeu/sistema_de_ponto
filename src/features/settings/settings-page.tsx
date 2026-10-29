import { Settings2 } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsPage() {
  return (
    <section className="space-y-4" aria-labelledby="settings-title">
      <div className="flex items-center gap-2">
        <Settings2 className="text-muted-foreground size-5" aria-hidden />
        <h1 id="settings-title" className="text-xl font-semibold tracking-tight">
          Configurações
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
          <CardDescription>
            Jornada inicial, tema e preferências serão configurados com React Hook Form +
            Zod em uma etapa futura.
          </CardDescription>
        </CardHeader>
      </Card>
    </section>
  )
}
