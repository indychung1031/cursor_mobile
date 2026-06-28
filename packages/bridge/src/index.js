const { loadEnv, getEnvPath, getTailscaleIp, getBridgeUrls } = require('./env')
loadEnv()

const fastify = require('fastify')
const { loadConfig, saveConfig } = require('./config')
const { isCursorRunning } = require('./cursorDetect')
const {
  preventDisplaySleep,
  registerShutdownHooks,
} = require('./displaySleep')
const { listDisplays } = require('./capture')
const { getHealthPayload } = require('./statusPage')
const { renderMobileHtml } = require('./mobilePage')
const { renderSetupHtml, getLanIp } = require('./setupPage')
const { toPngBuffer, isAllowedQrUrl } = require('./qr')
const { renderDevHtml } = require('./devPage')
const { listCursorWindows, listCursorWindowsDetailed } = require('./cursorWindows')
const { findDisplayBounds, windowCenterOnDisplay } = require('./displayBounds')
const { registerMjpegStream } = require('./stream/mjpeg')
const { injectMessage, dryRunFocus, prepareFocus } = require('./focus/focus')
const { injectScroll, SCROLL_MODES } = require('./scroll/scroll')
const { recordInjectError, clearInjectError } = require('./bridgeState')
const { openSetupPage } = require('./openBrowser')
const {
  generatePairingCode,
  getPairingCode,
  regeneratePairingCode,
  verifyPairingCode,
  signToken,
  requireAuth,
} = require('./auth/pairing')

const PORT = Number(process.env.BRIDGE_PORT || 3921)
const HOST = process.env.BRIDGE_HOST || '0.0.0.0'

const app = fastify({ logger: true })

function sendHtml(reply, html) {
  return reply
    .header('Cache-Control', 'no-store, no-cache, must-revalidate')
    .header('Pragma', 'no-cache')
    .type('text/html; charset=utf-8')
    .send(html)
}

const healthDeps = () => ({
  port: PORT,
  isCursorRunning,
  getTailscaleIp,
  getBridgeUrls,
})

app.get('/', async (_req, reply) => sendHtml(reply, renderMobileHtml()))

app.get('/setup', async (_req, reply) => {
  const config = loadConfig()
  const html = renderSetupHtml({
    port: PORT,
    tailscaleIp: getTailscaleIp(),
    pairingCode: getPairingCode(),
    cursorWindows: listCursorWindows(),
    targetWindowTitle: config.targetWindowTitle || '',
  })
  return sendHtml(reply, html)
})

app.get('/setup/qr', async (req, reply) => {
  const url = String(req.query?.url || '')
  const tailscaleIp = getTailscaleIp()
  const lanIp = getLanIp()
  if (!isAllowedQrUrl(url, PORT, { tailscaleIp, lanIp })) {
    return reply.code(400).send({ error: 'invalid url' })
  }
  try {
    const buf = await toPngBuffer(url)
    return reply
      .header('Cache-Control', 'no-store')
      .type('image/png')
      .send(buf)
  } catch (err) {
    app.log.warn({ err }, 'setup/qr failed')
    return reply.code(500).send({ error: 'qr failed' })
  }
})

app.get('/pair', async (req, reply) => {
  const code = String(req.query?.code || '').trim()
  if (!code) {
    return reply.redirect('/')
  }
  if (!verifyPairingCode(code)) {
    return reply.redirect('/?pair_error=invalid')
  }
  const token = signToken()
  return reply.redirect(`/?cm_token=${encodeURIComponent(token)}`)
})

if (process.env.BRIDGE_DEV === '1') {
  app.get('/dev', async (_req, reply) => {
    const html = renderDevHtml({ port: PORT })
    return reply.type('text/html; charset=utf-8').send(html)
  })
}

app.get('/auth/pairing-code', async () => ({
  code: getPairingCode(),
}))

app.post('/auth/regenerate', async () => {
  const code = regeneratePairingCode()
  return { code }
})

app.get('/health', async () => getHealthPayload(healthDeps()))

app.post('/auth/pair', async (req, reply) => {
  const code = String(req.body?.code || '').trim()
  if (!verifyPairingCode(code)) {
    return reply.code(401).send({ error: 'invalid code' })
  }
  return { token: signToken() }
})

app.get('/auth/session', { preHandler: requireAuth }, async () => ({ ok: true }))

app.get('/displays', { preHandler: requireAuth }, async () => {
  const config = loadConfig()
  const displays = await listDisplays()
  return { displays, selectedDisplay: config.selectedDisplay ?? 0 }
})

app.get('/setup/windows', async () => {
  const config = loadConfig()
  return {
    windows: listCursorWindows(),
    targetWindowTitle: config.targetWindowTitle || '',
  }
})

app.post('/config/window', async (req, reply) => {
  const title = String(
    req.body?.targetWindowTitle ?? req.body?.title ?? '',
  ).trim()
  if (!title) {
    return reply.code(400).send({ error: 'empty targetWindowTitle' })
  }
  const config = loadConfig()
  config.targetWindowTitle = title
  saveConfig(config)
  app.log.info({ targetWindowTitle: title }, 'config window updated')
  return { ok: true, targetWindowTitle: title }
})

app.post('/config/display', { preHandler: requireAuth }, async (req) => {
  const config = loadConfig()
  const raw = req.body?.displayId
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    config.selectedDisplay = raw
  } else if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw)
    config.selectedDisplay = Number.isFinite(n) ? n : raw
  } else {
    config.selectedDisplay = raw
  }

  const displays = await listDisplays()
  const bounds = findDisplayBounds(displays, config.selectedDisplay)
  if (bounds) {
    const onDisplay = listCursorWindowsDetailed().filter((w) =>
      windowCenterOnDisplay(w, bounds),
    )
    if (onDisplay.length === 1) {
      config.targetWindowTitle = onDisplay[0].title
    } else if (onDisplay.length > 1) {
      const current = onDisplay.find((w) => w.title === config.targetWindowTitle)
      if (!current) {
        config.targetWindowTitle = onDisplay[0].title
      }
    }
  }

  saveConfig(config)
  return {
    ok: true,
    selectedDisplay: config.selectedDisplay,
    targetWindowTitle: config.targetWindowTitle || '',
  }
})

app.post('/message', { preHandler: requireAuth }, async (req, reply) => {
  const text = String(req.body?.text || '').trim()
  if (!text) {
    return reply.code(400).send({ error: 'empty message' })
  }

  const config = loadConfig()
  if (!config.inputOffset && !config.inputCoord) {
    return reply.code(503).send({ error: 'inputOffset not configured in config.json' })
  }

  try {
    await injectMessage(text, config)
    clearInjectError()
    return { ok: true }
  } catch (err) {
    recordInjectError(err)
    app.log.error({ err }, 'inject failed')
    return reply.code(500).send({ error: err.message || 'inject failed' })
  }
})

app.post('/focus/dry-run', { preHandler: requireAuth }, async (req, reply) => {
  const config = loadConfig()
  try {
    const result = await dryRunFocus(config)
    return result
  } catch (err) {
    app.log.warn({ err }, 'focus dry-run failed')
    return reply.code(500).send({ error: err.message || 'dry-run failed' })
  }
})

app.post('/focus/prepare', { preHandler: requireAuth }, async (req, reply) => {
  const config = loadConfig()
  const minimizeOthers = req.body?.minimizeOthers === true
  try {
    const result = await prepareFocus(config, { minimizeOthers })
    clearInjectError()
    return result
  } catch (err) {
    recordInjectError(err)
    app.log.warn({ err, minimizeOthers }, 'focus prepare failed')
    return reply.code(500).send({ error: err.message || 'focus prepare failed' })
  }
})

app.post('/scroll', { preHandler: requireAuth }, async (req, reply) => {
  const rawDelta = req.body?.deltaY
  const deltaY = typeof rawDelta === 'number' ? rawDelta : Number(rawDelta)
  if (!Number.isFinite(deltaY)) {
    return reply.code(400).send({ error: 'deltaY must be a number' })
  }

  const mode = String(req.body?.mode || 'wheel')
  if (!SCROLL_MODES.has(mode)) {
    return reply.code(400).send({ error: 'invalid mode' })
  }

  const config = loadConfig()
  try {
    const result = await injectScroll(deltaY, config, { mode })
    clearInjectError()
    return result
  } catch (err) {
    recordInjectError(err)
    app.log.warn({ err, deltaY, mode }, 'scroll inject failed')
    return reply.code(500).send({ error: err.message || 'scroll failed' })
  }
})

registerMjpegStream(app, requireAuth)

async function main() {
  preventDisplaySleep()
  registerShutdownHooks()
  generatePairingCode()

  await app.listen({ port: PORT, host: HOST })

  const config = loadConfig()
  app.log.info(
    {
      port: PORT,
      host: HOST,
      configRegion: config.region,
      selectedDisplay: config.selectedDisplay,
    },
    'cursor_mobile Bridge ready (Phase 1 B-mode)',
  )
  const urls = getBridgeUrls(PORT)
  const envPath = getEnvPath()
  app.log.info(`env: ${envPath || '(default)'}`)
  app.log.info(`app (PC):     http://localhost:${PORT}/`)
  app.log.info(`setup (PC):   http://localhost:${PORT}/setup  ← 페어링 코드`)
  if (process.env.BRIDGE_DEV === '1') {
    app.log.info(`dev (PC):     http://localhost:${PORT}/dev  ← WP 스모크 검증`)
  }
  if (urls.tailscale) {
    const base = urls.tailscale.replace('/health', '')
    app.log.info(`app (iPhone): ${base}/`)
  } else {
    app.log.warn('TAILSCALE_IP not set — add it to cursor_mobile/.env')
  }

  openSetupPage(PORT)
  app.log.info('PC 설정 페이지를 브라우저에서 열었습니다 (/setup)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
