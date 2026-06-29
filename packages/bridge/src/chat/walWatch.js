const fs = require('fs')
const { getStateDbPath, dbExists } = require('./paths')

const DEBOUNCE_MS = 350
let debounceTimer = null
let watcherStarted = false
/** @type {Set<import('http').ServerResponse>} */
const sseClients = new Set()

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`
  for (const res of sseClients) {
    try {
      res.write(payload)
    } catch {
      sseClients.delete(res)
    }
  }
}

function scheduleBroadcast() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    broadcast({ type: 'wal', at: Date.now() })
  }, DEBOUNCE_MS)
}

function startWalWatch(app) {
  if (watcherStarted || !dbExists()) return
  watcherStarted = true

  const dbPath = getStateDbPath()
  const walPath = `${dbPath}-wal`

  const watchTarget = (target, label) => {
    if (!fs.existsSync(target)) return
    try {
      fs.watch(target, { persistent: false }, () => {
        app.log.debug({ label }, 'cursor db changed')
        scheduleBroadcast()
      })
    } catch (err) {
      app.log.warn({ err, label }, 'wal watch failed')
    }
  }

  watchTarget(dbPath, 'db')
  watchTarget(walPath, 'wal')

  app.log.info('C-mode WAL watch started')
}

function registerChatEvents(app, requireAuth) {
  app.get('/chat/events', { preHandler: requireAuth }, (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
    })
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', at: Date.now() })}\n\n`)
    sseClients.add(reply.raw)

    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(`: ping ${Date.now()}\n\n`)
      } catch {
        clearInterval(heartbeat)
      }
    }, 25000)

    req.raw.on('close', () => {
      clearInterval(heartbeat)
      sseClients.delete(reply.raw)
    })
  })
}

function stopWalWatchForTests() {
  sseClients.clear()
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

module.exports = { startWalWatch, registerChatEvents, broadcast, stopWalWatchForTests }
