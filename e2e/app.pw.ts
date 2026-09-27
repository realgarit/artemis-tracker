import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const observedAt = '2026-09-26T12:00:00.000Z'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://ssd.jpl.nasa.gov/**', (route) => route.abort())
  await page.route('https://services.swpc.noaa.gov/**', (route) => route.abort())
  await page.route('https://eyes.nasa.gov/**', (route) => route.abort())
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort())
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort())
  await page.route('**/data/spaceweather.json', (route) => route.fulfill({ json: { schemaVersion: 1, generatedAt: observedAt, data: {
    kpIndex: 2, kpCategory: 'Quiet', solarWindSpeed: 500, solarWindDensity: 3.2, imfBz: -1, imfBt: 4,
    source: 'NOAA SWPC', timestamp: observedAt, fieldTimestamps: { kpIndex: observedAt, solarWindSpeed: observedAt, solarWindDensity: observedAt, imfBz: observedAt, imfBt: observedAt },
    provenance: { mode: 'snapshot', provider: 'NOAA SWPC', url: 'https://www.swpc.noaa.gov/', observedAt, generatedAt: observedAt, retrievedAt: observedAt, summary: 'Controlled browser fixture' },
  } } }))
  await page.route('**/data/dsn.json', (route) => route.fulfill({ json: { schemaVersion: 1, generatedAt: observedAt, data: {
    dishes: [], timestamp: observedAt, source: 'NASA DSN Now',
    provenance: { mode: 'snapshot', provider: 'NASA DSN Now', url: 'https://eyes.nasa.gov/dsn/dsn.html', observedAt, generatedAt: observedAt, retrievedAt: observedAt, summary: 'Controlled browser fixture' },
  } } }))
})

test('direct mission and crew routes render their matching catalog entry', async ({ page }) => {
  await page.goto('/artemis-i', { waitUntil: 'commit', timeout: 10_000 })
  await expect(page.getByRole('heading', { name: /mission timeline/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Select mission. Current mission: Artemis I/i })).toBeVisible()

  await page.goto('/artemis-ii/crew', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /ARTEMIS II CREW/i })).toBeVisible()
  await expect(page.getByText('Reid Wiseman', { exact: true }).first()).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('button', { name: /Select mission\. Current mission: Artemis I/i })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { name: /ARTEMIS II CREW/i })).toBeVisible()
})

test('mission selector switches data catalog entries and browser history restores the previous mission', async ({ page }) => {
  await page.goto('/artemis-i?view=2d', { waitUntil: 'domcontentloaded' })
  const selector = () => page.getByRole('button', { name: /select mission\. current mission:/i })
  await expect(selector()).toHaveAttribute('aria-label', /Artemis I/i)
  await selector().click()
  await page.getByRole('menuitem', { name: /^ARTEMIS II\b/i }).click()
  await expect(selector()).toHaveAttribute('aria-label', /Artemis II/i)
  await expect(page.getByRole('heading', { name: /2d trajectory and mission replay/i })).toBeVisible()
  await selector().click()
  await page.getByRole('menuitem', { name: /^ARTEMIS I\b/i }).click()
  await expect(selector()).toHaveAttribute('aria-label', /Artemis I/i)
  await page.goBack()
  await expect(selector()).toHaveAttribute('aria-label', /Artemis II/i)
  await page.goForward()
  await expect(selector()).toHaveAttribute('aria-label', /Artemis I/i)
})

test('planned mission route presents sourced uncertainty and the announced crew', async ({ page }) => {
  await page.goto('/artemis-iii', { waitUntil: 'commit', timeout: 10_000 })
  await expect(page.getByRole('heading', { name: 'Artemis III' })).toBeVisible()
  await expect(page.getByText('NASA launch window: 2027')).toBeVisible()
  await expect(page.getByText(/NASA source published 9 June 2026 · Catalog checked 2026-09-27/)).toBeVisible()
  await expect(page.getByText('Randy Bresnik')).toBeVisible()
  await expect(page.getByRole('link', { name: /subscribe to updates/i })).toHaveAttribute('href', 'webcal://artemis.realgar.ch/calendar/artemis-iii.ics')
})

test('comparison aligns both source profiles, supports keyboard-selectable moments, history, and share links', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/compare?alignment=event&event=lunar-flyby&metric=velocity', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /compare mission profiles/i })).toBeVisible()
  await expect(page.getByRole('region', { name: /artemis i sampled mission summary/i })).toContainText('NASA/JSC')
  await expect(page.getByRole('region', { name: /artemis ii sampled mission summary/i })).toContainText('NASA/JSC')
  const samples = page.getByText('Read aligned comparison samples')
  await samples.click()
  const choose = page.getByRole('button', { name: /select .* comparison point/i })
  await choose.nth(1).click()
  const first = new URL(page.url()).searchParams.get('at')
  expect(first).toBeTruthy()
  await choose.nth(2).click()
  const second = new URL(page.url()).searchParams.get('at')
  expect(second).not.toBe(first)
  await page.goBack()
  await expect.poll(() => new URL(page.url()).searchParams.get('at')).toBe(first)
  await page.getByRole('button', { name: /copy comparison link/i }).click()
  const copied = new URL(await page.evaluate(() => navigator.clipboard.readText()))
  expect(copied.searchParams.get('alignment')).toBe('event')
  expect(copied.searchParams.get('left')).toBe('artemis-i')
  expect(copied.searchParams.get('right')).toBe('artemis-ii')
  expect(copied.searchParams.get('event')).toBe('lunar-flyby')
  expect(copied.searchParams.get('metric')).toBe('velocity')
  expect(copied.searchParams.get('at')).toBe(first)
  const left = page.getByLabel('Left mission')
  const right = page.getByLabel('Right mission')
  await left.selectOption('artemis-ii')
  await expect(right).toHaveValue('artemis-ii')
  await left.selectOption('artemis-i')
  await expect(right).toHaveValue('artemis-ii')
  await right.selectOption('artemis-i')
  await expect(left).toHaveValue('artemis-i')
  await expect(new URL(page.url()).searchParams.get('left')).toBe('artemis-i')
  await expect(new URL(page.url()).searchParams.get('right')).toBe('artemis-i')
  const restored = await context.newPage()
  await restored.goto(copied.toString(), { waitUntil: 'domcontentloaded' })
  await expect(restored.getByLabel('Left mission')).toHaveValue('artemis-i')
  await expect(restored.getByLabel('Right mission')).toHaveValue('artemis-ii')
})

test('unknown mission route offers a known destination', async ({ page }) => {
  await page.goto('/artemis-999', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('This mission is not in the verified mission catalog.')).toBeVisible()
  await expect(page.getByRole('link', { name: /open artemis ii replay/i })).toHaveAttribute('href', '/artemis-ii')
})

test('malformed shared timestamps and event IDs recover without executing markup', async ({ page }) => {
  await page.goto('/artemis-ii?view=invalid&t=not-a-time&event=%3Cscript%3Ealert(1)%3C%2Fscript%3E', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /2d trajectory and mission replay/i })).toBeVisible()
  await expect(page.getByText('2026-04-01T22:35:12 UTC', { exact: true }).first()).toBeVisible()
  await expect(page.locator('script')).toHaveCount(1)
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('upstream snapshot failure renders unavailable states instead of quiet weather or an empty current DSN', async ({ page }) => {
  await page.route('**/data/spaceweather.json', (route) => route.fulfill({ status: 503, body: 'offline' }))
  await page.route('**/data/dsn.json', (route) => route.fulfill({ status: 503, body: 'offline' }))
  await page.goto('/artemis-ii?view=2d', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Unavailable', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/DSN feed is unavailable; this site’s antenna status cannot be inferred/i).first()).toBeVisible()
  await expect(page.getByText(/The current feed is unavailable; tracking status is unknown/i)).toBeVisible()
  await expect(page.getByText(/Quiet/i)).toHaveCount(0)
})

test('a shared UTC moment restores the lightweight view and has a useful 2D replay', async ({ page }) => {
  await page.goto('/artemis-ii?t=2026-04-06T23%3A00%3A00.000Z&view=2d&cam=moon&event=a2-closest', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /2d trajectory and mission replay/i })).toBeVisible()
  await expect(page.getByText('2026-04-06T23:00:00 UTC', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /current earth network view/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /replay this moment/i }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /explore the key moments/i })).toBeVisible()
  const guide = page.getByRole('region', { name: /explore the key moments/i })
  const launchEvent = guide.getByRole('listitem').filter({ hasText: 'Artemis II lifts off' })
  await page.evaluate(() => document.addEventListener('click', () => performance.mark('mission-event-input'), { once: true }))
  await launchEvent.getByRole('button', { name: /replay this moment/i }).click()
  await expect(launchEvent.getByText('Selected moment')).toBeVisible()
  const interactionMs = await page.evaluate(() => { const marks = performance.getEntriesByName('mission-event-input'); return performance.now() - marks[marks.length - 1].startTime })
  expect(interactionMs, `Event seek responded in ${interactionMs} ms; the target is 200 ms.`).toBeLessThanOrEqual(200)
  await page.screenshot({ path: 'test-results/mission-mobile-2d.png', fullPage: true })
  const screenshot = await page.screenshot()
  expect(screenshot.byteLength).toBeGreaterThan(10_000)
  const charts = page.getByRole('region', { name: /source-linked mission charts/i })
  await charts.scrollIntoViewIfNeeded()
  await expect(charts.getByRole('heading', { name: /velocity profile/i })).toBeVisible()
  await guide.scrollIntoViewIfNeeded()
  await guide.getByLabel('Filter by mission phase').selectOption('LEO')
  await expect(guide.getByText('1 event shown')).toBeVisible()
  await guide.getByLabel('Filter by mission phase').selectOption('all')
  await guide.getByRole('button', { name: /start guided tour/i }).click()
  await expect(guide.getByRole('status')).toContainText('Artemis II lifts off')
  await guide.getByRole('button', { name: /next tour stop/i }).click()
  await expect(guide.getByRole('status')).toContainText('Lunar observation period begins')
  await guide.getByRole('button', { name: /^pause$/i }).click()
  await expect(guide.getByRole('status')).toContainText('Paused')
  await guide.getByRole('button', { name: /resume tour/i }).click()
  await guide.getByRole('button', { name: /exit tour/i }).click()
  await guide.getByRole('button', { name: /resume guided tour/i }).click()
  await expect(guide.getByRole('heading', { name: /stop 2 of 9/i })).toBeVisible()
})

test('background suspension pauses replay without changing the selected mission epoch', async ({ page }) => {
  await page.goto('/artemis-ii?view=2d&t=2026-04-06T22%3A41%3A00.000Z', { waitUntil: 'domcontentloaded' })
  const exactTime = page.getByRole('textbox', { name: /jump to utc time/i })
  await page.getByLabel('Replay speed').selectOption('600')
  await page.getByRole('button', { name: 'Play mission replay' }).click()
  await page.waitForTimeout(300)
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.getByRole('button', { name: 'Play mission replay' })).toBeVisible()
  const pausedAt = await exactTime.inputValue()
  await page.waitForTimeout(600)
  await expect(exactTime).toHaveValue(pausedAt)
  await page.evaluate(() => { delete (document as Document & { visibilityState?: string }).visibilityState })
})

test('moment links copy the UTC timestamp and current view', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/artemis-ii?t=2026-04-06T23%3A00%3A00.000Z&view=2d&cam=moon', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /copy moment link/i }).click()
  await expect(page.getByRole('region', { name: /keep this mission moment/i }).getByRole('status')).toContainText('Share link copied')
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  const url = new URL(copied)
  expect(url.searchParams.get('t')).toBe('2026-04-06T23:00:00.000Z')
  expect(url.searchParams.get('view')).toBe('2d')
  expect(url.searchParams.get('cam')).toBe('moon')
  const restored = await context.newPage()
  await restored.goto(copied.toString(), { waitUntil: 'domcontentloaded' })
  await expect(restored.getByRole('heading', { name: /2d trajectory and mission replay/i })).toBeVisible()
  await expect(restored.getByText('2026-04-06T23:00:00 UTC', { exact: true }).first()).toBeVisible()
})

test('mobile layout avoids document overflow and key actions pass an axe scan', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/artemis-ii?view=2d', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /2d trajectory and mission replay/i })).toBeVisible()
    const widths = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }))
    const overflow = widths.document > widths.viewport ? await page.evaluate(() => [...document.querySelectorAll('body *')].map((element) => {
      const rect = element.getBoundingClientRect()
      return { tag: element.tagName, id: element.id, className: typeof element.className === 'string' ? element.className : '', left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), scrollWidth: element.scrollWidth, inHorizontalScroller: Boolean(element.closest('[class*="overflow-x-auto"]')) }
    }).filter((element) => (element.right > document.documentElement.clientWidth + 1 || element.left < -1) && !element.inHorizontalScroller).sort((a, b) => b.right - a.right).slice(0, 12)) : []
    expect(widths.document, `Unexpected horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`).toBeLessThanOrEqual(widths.viewport)
    await page.screenshot({ path: `test-results/mission-layout-${width}px.png` })
  }
  // Browser zoom doubles the effective pixel size and halves the CSS viewport;
  // model that reflow width rather than applying CSS `zoom`, which does not
  // change responsive breakpoints like a browser's 200% zoom setting.
  await page.setViewportSize({ width: 160, height: 400 })
  await expect(page.getByRole('heading', { name: /2d trajectory and mission replay/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /select mission. current mission: artemis ii/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /play mission replay/i })).toBeVisible()
  const shareButton = page.getByRole('button', { name: /copy moment link/i })
  await shareButton.scrollIntoViewIfNeeded()
  await expect(shareButton).toBeVisible()
  const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const serious = report.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
  const summary = serious.map((violation) => `${violation.id}: ${violation.nodes.map((node) => { const contrast = node.any.find((check) => check.id === 'color-contrast')?.data as { fgColor?: string; bgColor?: string; contrastRatio?: number } | undefined; return `${node.target.join(' ')} (${contrast?.fgColor || ''} on ${contrast?.bgColor || ''} = ${contrast?.contrastRatio || ''})` }).join('; ')}`)
  expect(summary, `Serious accessibility findings: ${summary.join(' | ')}`).toEqual([])
})

test('WebGL-unavailable browser defaults to the fully usable lightweight view', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: unknown[]) {
      if (kind === 'webgl' || kind === 'webgl2') return null
      return original.call(this, kind as never, ...(args as []))
    }
  })
  const webglChunks: string[] = []
  page.on('request', (request) => { if (/TrajectoryMap.*\.js/.test(request.url())) webglChunks.push(request.url()) })
  await page.goto('/artemis-ii?view=3d', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /2d trajectory and mission replay/i })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: /webgl is unavailable/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /load 3d view and spacecraft model/i })).toBeDisabled()
  expect(webglChunks).toEqual([])
})

test('reduced-motion preference keeps the lightweight view and does not request the 3D engine', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const webglChunks: string[] = []
  page.on('request', (request) => { if (/TrajectoryMap.*\.js/.test(request.url())) webglChunks.push(request.url()) })
  await page.goto('/artemis-ii', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /2d trajectory and mission replay/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /play mission replay/i })).toBeVisible()
  expect(webglChunks).toEqual([])
})

test('media archive filters by mission, event, and type and offers the timed event jump', async ({ page }) => {
  await page.goto('/artemis-ii?view=2d', { waitUntil: 'domcontentloaded' })
  const archive = page.getByRole('region', { name: /artemis ii mission media/i })
  await expect(archive.getByText('Artemis II Lunar Flyby')).toBeVisible()
  await archive.getByLabel('Filter by mission').selectOption('artemis-i')
  await archive.getByLabel('Filter by event').selectOption('a1-launch')
  await archive.getByLabel('Filter by media type').selectOption('Gallery')
  await expect(archive.getByRole('heading', { name: 'Artemis I Launch' })).toBeVisible()
  await expect(archive.getByRole('link', { name: /replay: artemis i lifts off/i })).toHaveAttribute('href', /artemis-i\?t=/)
  await expect(archive.getByText(/review the individual NASA asset notice/i)).toBeVisible()
  await expect(archive.getByText('archive', { exact: true })).toBeVisible()
})

test('a completed mission pack opens a deep route after a cold offline navigation', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/artemis-ii?view=2d', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /download offline pack/i }).click()
  await expect(page.getByRole('region', { name: /download this mission for offline use/i }).getByRole('status')).toContainText('Offline pack ready', { timeout: 20_000 })
  const pack = await page.evaluate(async () => {
    const name = (await caches.keys()).find((key) => key.startsWith('artemis-mission-pack-v2:artemis-ii:'))
    if (!name) return null
    const response = await (await caches.open(name)).match('/__artemis_offline_manifest__')
    return response ? response.json() as Promise<{ schemaVersion: number; appVersion: string; resources: string[]; checksums: Record<string, string> }> : null
  })
  expect(pack?.schemaVersion).toBe(2)
  expect(pack?.appVersion).toBeTruthy()
  expect(pack?.resources.length).toBeGreaterThan(5)
  for (const resource of pack?.resources || []) expect(pack?.checksums[resource]).toMatch(/^[a-f0-9]{64}$/)
  const offlineControls = page.getByRole('region', { name: /download this mission for offline use/i })
  await page.evaluate(() => {
    const original = window.fetch.bind(window)
    Object.assign(window, { __originalFetch: original })
    window.fetch = async (input, init) => String(input).includes('/data/missionEphemerides-artemis-ii.json')
      ? new Response('interrupted update fixture', { status: 503 })
      : original(input, init)
  })
  await offlineControls.getByRole('button', { name: /update offline pack/i }).click()
  await expect(offlineControls.getByRole('status')).toContainText('HTTP 503')
  await page.evaluate(() => { window.fetch = (window as Window & { __originalFetch: typeof fetch }).__originalFetch })
  const preservedInstall = await page.evaluate(async () => {
    const names = (await caches.keys()).filter((key) => key.startsWith('artemis-mission-pack-v2:artemis-ii:'))
    const installed: string[] = []
    for (const name of names) if (await (await caches.open(name)).match('/__artemis_offline_manifest__')) installed.push(name)
    return installed
  })
  expect(preservedInstall).toHaveLength(1)
  await page.evaluate(async () => {
    const partial = await caches.open('artemis-mission-pack-v2:artemis-ii:0000-interrupted')
    await partial.put('/data/missionEphemerides-artemis-ii.json', new Response('{ incomplete', { headers: { 'content-type': 'application/json' } }))
  })
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), { timeout: 10_000 })
  await context.setOffline(true)
  await page.close()
  const reopened = await context.newPage()
  await reopened.goto('/artemis-ii?view=2d&t=2026-04-06T23%3A00%3A00.000Z', { waitUntil: 'domcontentloaded', timeout: 10_000 })
  await expect(reopened.getByText(/mission timeline/i).first()).toBeVisible()
  await expect(reopened.getByRole('heading', { name: /2d trajectory and mission replay/i })).toBeVisible()
  await expect(reopened.getByRole('button', { name: /load 3d view and spacecraft model/i })).toBeDisabled()
  await expect(reopened.getByRole('status').filter({ hasText: /Offline mode · verified mission pack/i })).toBeVisible()
})

test('three cold mobile replay runs have median LCP under 2.5 seconds on a fixed throttled profile', async ({ browser }) => {
  test.setTimeout(90_000)
  const runs: { lcp: number; cls: number; element: string }[] = []
  for (let index = 0; index < 3; index++) {
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:55173', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.route('https://ssd.jpl.nasa.gov/**', (route) => route.abort())
    await page.route('https://services.swpc.noaa.gov/**', (route) => route.abort())
    await page.route('https://eyes.nasa.gov/**', (route) => route.abort())
    await page.route('https://fonts.googleapis.com/**', (route) => route.abort())
    await page.route('https://fonts.gstatic.com/**', (route) => route.abort())
    await page.route('https://**/*', (route) => route.abort())
    await page.addInitScript(() => {
      Object.assign(window, { __largestContentfulPaint: 0, __cumulativeLayoutShift: 0 })
      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          const element = (entry as PerformanceEntry & { element?: Element }).element
          const name = element ? `${element.tagName.toLowerCase()}#${element.id}.${element.getAttribute('class') || ''}: ${element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 90) || ''}` : 'image/resource'
          Object.assign(window, { __largestContentfulPaint: entry.startTime, __largestContentfulElement: name })
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
          if (!entry.hadRecentInput) Object.assign(window, { __cumulativeLayoutShift: (window as Window & { __cumulativeLayoutShift: number }).__cumulativeLayoutShift + entry.value })
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    const protocol = await context.newCDPSession(page)
    await protocol.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await protocol.send('Network.enable')
    await protocol.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8, connectionType: 'cellular3g' })
    await page.goto('/artemis-ii?view=2d', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /2d trajectory and mission replay/i })).toBeVisible({ timeout: 25_000 })
    await page.waitForLoadState('networkidle', { timeout: 10_000 })
    await page.waitForTimeout(100)
    runs.push(await page.evaluate(() => ({ lcp: (window as Window & { __largestContentfulPaint: number }).__largestContentfulPaint, cls: (window as Window & { __cumulativeLayoutShift: number }).__cumulativeLayoutShift, element: (window as Window & { __largestContentfulElement: string }).__largestContentfulElement })))
    await context.close()
  }
  const medianLcp = [...runs].sort((left, right) => left.lcp - right.lcp)[1].lcp
  const medianCls = [...runs].sort((left, right) => left.cls - right.cls)[1].cls
  console.info(`Cold mobile metrics: ${JSON.stringify(runs.map((run) => ({ lcpMs: Math.round(run.lcp), cls: Number(run.cls.toFixed(4)), element: run.element })))}`)
  expect(medianLcp, `Cold mobile LCP median was ${Math.round(medianLcp)} ms; runs: ${JSON.stringify(runs)}; target is 2,500 ms.`).toBeGreaterThan(0)
  expect(medianLcp, `Cold mobile LCP median was ${Math.round(medianLcp)} ms; runs: ${JSON.stringify(runs)}; target is 2,500 ms.`).toBeLessThanOrEqual(2500)
  expect(medianCls, `Cold mobile CLS median was ${medianCls.toFixed(4)}; runs: ${JSON.stringify(runs)}; target is 0.1.`).toBeLessThanOrEqual(0.1)
})
