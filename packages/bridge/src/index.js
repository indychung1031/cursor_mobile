const { loadEnv, getEnvPath, getTailscaleIp, getBridgeUrls } = require('./env')
loadEnv()

const fastify = require('fastify')
const { loadConfig } = require('./config')
const { isCursorRunning } = require('./cursorDetect')
const {
  preventDisplaySleep,
  registerShutdownHooks,
} = require('./displaySleep')
const { listDisplays } = require('./capture')
const { getHealthPayload, renderStatusHtml } = require('./statusPage')

const PORT = Number(process.env.BRIDGE_PORT || 3921)
const HOST = process.env.BRIDGE_HOST || '0.0.0.0'

const app = fastify({ logger: true })

const healthDeps = () => ({
  port: PORT,
  isCursorRunning,
  getTailscaleIp,
  getBridgeUrls,
})

app.get('/', async (_req, reply) => {
  const payload = getHealthPayload(healthDeps())
  return reply.type('text/html; charset=utf-8').send(renderStatusHtml(payload))
})

app.get('/health', async () => getHealthPayload(healthDeps()))

app.get('/displays', async () => {
  const displays = await listDisplays()
  return { displays }
})

async function main() {
  preventDisplaySleep()
  registerShutdownHooks()

  await app.listen({ port: PORT, host: HOST })

  const config = loadConfig()
  app.log.info(
    {
      port: PORT,
      host: HOST,
      configRegion: config.region,
      selectedDisplay: config.selectedDisplay,
    },
    'cursor_mobile Bridge ready',
  )
  const urls = getBridgeUrls(PORT)
  const envPath = getEnvPath()
  app.log.info(`env: ${envPath || '(default)'}`)
  app.log.info(`health (PC):  ${urls.local}`)
  if (urls.tailscale) {
    const base = urls.tailscale.replace('/health', '')
    app.log.info(`status (iPhone): ${base}/`)
    app.log.info(`health API:      ${urls.tailscale}`)
  } else {
    app.log.warn(
      'TAILSCALE_IP not set — add it to cursor_mobile/.env (see .env.example)',
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
