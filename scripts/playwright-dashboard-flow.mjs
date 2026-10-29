/**
 * Validação E2E do dashboard (Playwright).
 * Uso: node scripts/playwright-dashboard-flow.mjs
 */
import { chromium } from 'playwright'

const BASE = process.env.PONTO_URL ?? 'http://127.0.0.1:5173'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const log = []

  page.setDefaultTimeout(30_000)

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })

    await page.evaluate(async () => {
      localStorage.clear()
      const dbs = await indexedDB.databases()
      await Promise.all(
        (dbs ?? []).map(
          (db) =>
            db.name &&
            new Promise((resolve) => {
              const req = indexedDB.deleteDatabase(db.name)
              req.onsuccess = () => resolve(undefined)
              req.onerror = () => resolve(undefined)
              req.onblocked = () => resolve(undefined)
            }),
        ),
      )
    })
    await page.reload({ waitUntil: 'domcontentloaded' })

    await page.waitForURL('**/onboarding')
    await page.getByRole('button', { name: 'Começar a usar' }).click()
    await page.waitForURL((url) => url.pathname === '/')
    log.push('onboarding:ok')

    const primary = () => page.getByTestId('primary-punch')
    await page.getByRole('heading', { name: 'Hoje' }).waitFor()
    await primary().waitFor({ state: 'visible' })

    const label0 = (await primary().innerText()).trim()
    if (!/entrada/i.test(label0)) throw new Error(`Esperava entrada, veio: ${label0}`)
    log.push(`btn0:${label0}`)

    await primary().click()
    await page.getByText('Marcação salva neste navegador.').waitFor()
    await page.getByText('Em jornada').first().waitFor()
    log.push('entrada:ok')

    // Atualiza a página no meio da jornada — estado vem do IndexedDB
    await page.reload({ waitUntil: 'domcontentloaded' })
    await primary().waitFor({ state: 'visible' })
    const afterReload = (await primary().innerText()).trim()
    if (!/intervalo/i.test(afterReload)) {
      throw new Error(`Após refresh mid-jornada: ${afterReload}`)
    }
    await page.getByText('Em jornada').first().waitFor()
    log.push('refresh-mid-journey:ok')

    await primary().click()
    await page.getByText('Marcação salva neste navegador.').waitFor()
    await page.getByText('Em intervalo').first().waitFor()
    log.push('intervalo:ok')

    await primary().click()
    await page.getByText('Marcação salva neste navegador.').waitFor()
    const afterReturn = (await primary().innerText()).trim()
    if (!/saída/i.test(afterReturn)) throw new Error(`Após retorno: ${afterReturn}`)
    log.push('retorno:ok')

    await primary().click()
    await page.getByText('Marcação salva neste navegador.').waitFor()
    await page.getByText('Jornada fechada').first().waitFor()
    const afterOut = (await primary().innerText()).trim()
    if (!/entrada/i.test(afterOut)) throw new Error(`Após saída: ${afterOut}`)
    log.push('saida:ok')

    // Registro manual inválido
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: /Retornar do intervalo/i }).click()
    await page.getByRole('button', { name: 'Salvar marcação' }).click()
    await page.locator('[role=alert], .text-\\[var\\(--negative\\)\\]').first().waitFor({
      timeout: 8_000,
    })
    log.push('manual-invalid:ok')

    console.log(JSON.stringify({ ok: true, log }, null, 2))
  } catch (error) {
    const shot = '/tmp/ponto-dashboard-e2e-fail.png'
    await page.screenshot({ path: shot, fullPage: true }).catch(() => undefined)
    console.error(
      JSON.stringify({ ok: false, log, error: String(error), screenshot: shot }, null, 2),
    )
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

main()
