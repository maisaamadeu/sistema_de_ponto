import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { DateField, TimeField } from '@/components/shared'
import { demoSettings } from '@/features/demo/mock-data'

export function SettingsPage() {
  const [displayDate, setDisplayDate] = useState(demoSettings.referenceDate)
  const [start, setStart] = useState(demoSettings.workdayStart)
  const [end, setEnd] = useState(demoSettings.workdayEnd)
  const [startError, setStartError] = useState<string | undefined>()

  function validateStart(next: string) {
    setStart(next)
    if (next && end && next >= end) {
      setStartError('A entrada precisa ser anterior à saída. Ajuste o horário…')
      return
    }
    setStartError(undefined)
  }

  return (
    <section className="space-y-8" aria-labelledby="settings-title">
      <div className="space-y-1">
        <h1
          id="settings-title"
          className="text-[1.75rem] font-bold tracking-tight text-balance text-[var(--text)] lg:text-[2rem]"
        >
          Configurações
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Preferências de aparência e jornada — apenas demonstração visual.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Jornada padrão</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Campos compartilhados de data e horário com validação visual.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DateField
              label="Data de referência"
              name="referenceDate"
              value={displayDate}
              onChange={setDisplayDate}
            />
            <div className="rounded-md border border-[var(--rule)] bg-[var(--raised)] px-3 py-2 text-sm text-[var(--muted)] sm:self-end">
              Perfil demo:{' '}
              <span className="text-[var(--text)]">{demoSettings.displayName}</span>
            </div>
            <TimeField
              label="Início da jornada"
              name="workdayStart"
              value={start}
              onChange={validateStart}
              error={startError}
            />
            <TimeField
              label="Fim da jornada"
              name="workdayEnd"
              value={end}
              onChange={(value) => {
                setEnd(value)
                if (start && value && start >= value) {
                  setStartError(
                    'A entrada precisa ser anterior à saída. Ajuste o horário…',
                  )
                } else {
                  setStartError(undefined)
                }
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled>
              Salvar jornada
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStart(demoSettings.workdayStart)
                setEnd(demoSettings.workdayEnd)
                setDisplayDate(demoSettings.referenceDate)
                setStartError(undefined)
              }}
            >
              Restaurar exemplo
            </Button>
          </div>
        </div>

        <aside className="space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Tema</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Claro, escuro ou preferência do sistema.
            </p>
          </div>
          <ThemeToggle />
          <p className="text-xs text-[var(--muted)]">
            A escolha é guardada neste navegador. “Sistema” acompanha{' '}
            <span className="font-medium text-[var(--text)]">prefers-color-scheme</span>.
          </p>
        </aside>
      </div>
    </section>
  )
}
