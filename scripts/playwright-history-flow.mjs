/**
 * Validação E2E do histórico mensal (Playwright).
 * Uso: node scripts/playwright-history-flow.mjs
 *
 * Prefira servidor estático (vite preview) via PONTO_URL — HMR do dev
 * pode interromper o submit do onboarding.
 */
import { chromium } from 'playwright'

const BASE = process.env.PONTO_URL ?? 'http://127.0.0.1:4173'

async function clearStorage(page) {
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
}

async function completeOnboarding(page) {
  await page.waitForURL('**/onboarding')
  await page.getByRole('heading', { name: 'Defina sua jornada' }).waitFor()

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const submit = page.getByRole('button', { name: 'Começar a usar' })
    await submit.scrollIntoViewIfNeeded()
    await submit.click()
    try {
      await page.getByRole('heading', { name: 'Hoje' }).waitFor({ timeout: 20_000 })
      await page.getByTestId('primary-punch').waitFor({ state: 'visible' })
      return
    } catch (error) {
      if (attempt === 3) throw error
      if (!page.url().includes('/onboarding')) {
        await page.goto(`${BASE}/onboarding`, { waitUntil: 'domcontentloaded' })
      }
    }
  }
}

async function punchFourTimes(page) {
  const primary = () => page.getByTestId('primary-punch')
  await primary().waitFor({ state: 'visible' })
  for (const expectStatus of [
    'Em jornada',
    'Em intervalo',
    null,
    'Jornada fechada',
  ]) {
    await primary().click()
    await page.getByText('Marcação salva neste navegador.').waitFor()
    if (expectStatus) {
      await page.getByText(expectStatus).first().waitFor()
    }
  }
}

async function summaryValue(page, id) {
  const card = page.getByTestId(`month-summary-${id}`)
  await card.waitFor({ state: 'visible' })
  return (await card.locator('p').nth(1).innerText()).trim()
}

async function expectCount(locator, n) {
  const count = await locator.count()
  if (count !== n) {
    throw new Error(`Esperava ${n} elementos, veio ${count}`)
  }
}

async function selectPunchType(page, trigger, label) {
  await trigger.click()
  await page.getByRole('option', { name: label }).click()
}

async function addEvent(page, typeLabel, timeHHmm) {
  await selectPunchType(page, page.locator('#add-type'), typeLabel)
  await page.locator('input[name=add-time]').fill(timeHHmm)
  await page.getByTestId('add-event').click()
  await page.getByTestId('history-status').getByText('Evento adicionado.').waitFor()
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const log = []

  page.setDefaultTimeout(30_000)

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await clearStorage(page)
    await completeOnboarding(page)
    log.push('onboarding:ok')

    await punchFourTimes(page)
    log.push('dashboard-complete-day:ok')

    await page.getByRole('link', { name: 'Histórico', exact: true }).click()
    await page.waitForURL('**/historico')
    await page.getByRole('heading', { name: 'Histórico' }).waitFor()
    await page.getByTestId('month-summary-worked').waitFor()
    await page.getByText('Completa').first().waitFor()
    log.push('history-page:ok')

    const dayRow = page.locator('tbody tr[role=button]').first()
    await dayRow.waitFor({ state: 'visible' })
    await dayRow.click()
    await page.getByTestId('day-detail-panel').waitFor()
    const eventItems = page.locator('[data-testid^="event-"]')
    await eventItems.first().waitFor({ state: 'visible' })
    await expectCount(eventItems, 4)
    log.push('day-detail:ok')

    // Remove do fim → início (cliques rápidos compartilham o mesmo segundo)
    for (let left = 4; left >= 1; left -= 1) {
      await page.locator('[data-testid^="remove-event-"]').last().click()
      await page.getByTestId('history-status').getByText('Evento removido.').waitFor()
      await expectCount(page.locator('[data-testid^="event-"]'), left - 1)
    }
    log.push('remove-all:ok')

    await addEvent(page, 'Registrar entrada', '08:00')
    await addEvent(page, 'Iniciar intervalo', '12:00')
    await addEvent(page, 'Retornar do intervalo', '13:00')
    await addEvent(page, 'Registrar saída', '17:00')
    log.push('add-schedule-8h:ok')

    const worked8h = await summaryValue(page, 'worked')
    const expected8h = await summaryValue(page, 'expected')
    if (worked8h !== '8h') {
      throw new Error(`Após recriar jornada 8h, trabalhado=${worked8h}`)
    }
    if (expected8h !== '8h') {
      throw new Error(`Esperado inesperado: ${expected8h}`)
    }
    await page.getByText('Completa').first().waitFor()
    log.push(`summary-8h:${worked8h}/${expected8h}`)

    // Edita saída para +1h → totais sobem
    const lastTime = page.locator('[data-testid^="event-"]').last().locator('input[type=time]')
    await lastTime.fill('18:00')
    await page.getByTestId('history-status').getByText('Evento atualizado.').waitFor()
    const workedAfterEdit = await summaryValue(page, 'worked')
    if (workedAfterEdit !== '9h') {
      throw new Error(`Após +1h na saída, trabalhado=${workedAfterEdit}`)
    }
    log.push(`summary-after-edit:${workedAfterEdit}`)

    // Remove saída → incompleta e totais mudam
    await page.locator('[data-testid^="remove-event-"]').last().click()
    await page.getByTestId('history-status').getByText('Evento removido.').waitFor()
    await expectCount(page.locator('[data-testid^="event-"]'), 3)
    await page.getByText('Incompleta').first().waitFor()
    const workedAfterRemove = await summaryValue(page, 'worked')
    if (workedAfterRemove === workedAfterEdit) {
      throw new Error(
        `Totais não atualizaram após exclusão (${workedAfterEdit} → ${workedAfterRemove})`,
      )
    }
    log.push(`summary-after-remove:${workedAfterRemove}`)

    await page.getByTestId('day-override').click()
    await page.getByRole('option', { name: 'Folga' }).click()
    await page.getByTestId('history-status').getByText(/Situação do dia/).waitFor()
    await page.getByText('Folga').first().waitFor()
    log.push('override-folga:ok')

    const csvDownloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'CSV do mês' }).click()
    const csv = await csvDownloadPromise
    if (!csv.suggestedFilename().endsWith('.csv')) {
      throw new Error(`CSV filename: ${csv.suggestedFilename()}`)
    }
    log.push('export-csv:ok')

    const jsonDownloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Backup JSON', exact: true }).click()
    const json = await jsonDownloadPromise
    if (!json.suggestedFilename().endsWith('.json')) {
      throw new Error(`JSON filename: ${json.suggestedFilename()}`)
    }
    const backupPath = await json.path()
    const fs = await import('node:fs/promises')
    const backupRaw = JSON.parse(await fs.readFile(backupPath, 'utf8'))
    if (backupRaw.format !== 'ponto-facil-backup' || backupRaw.version !== 1) {
      throw new Error(`Backup inválido: ${JSON.stringify(backupRaw).slice(0, 200)}`)
    }
    log.push('export-json:ok')

    await page.setInputFiles('input[type=file][accept*="json"]', backupPath)
    await page
      .getByTestId('history-status')
      .getByText('Backup importado com sucesso.')
      .waitFor()
    log.push('import-json:ok')

    console.log(JSON.stringify({ ok: true, log }, null, 2))
  } catch (error) {
    const shot = '/tmp/ponto-history-e2e-fail.png'
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
