const { loadConfig } = require('../config')
const {
  listComposers,
  listMessages,
  getComposerById,
  getChatHealth,
  DEFAULT_TAIL,
  DEFAULT_SESSION_LIMIT,
} = require('./cursorDb')

function parseMessageQuery(query) {
  const since = String(query?.since || '').trim() || undefined
  const tailRaw = query?.tail
  const tail = tailRaw != null && tailRaw !== ''
    ? Number(tailRaw)
    : since
      ? undefined
      : DEFAULT_TAIL
  const limit = query?.limit != null ? Number(query.limit) : undefined
  return { since, tail, limit }
}

function registerChatRoutes(app, requireAuth) {
  app.get('/chat/health', { preHandler: requireAuth }, async () => {
    const health = getChatHealth()
    return {
      ok: health.dbExists && health.sqliteAvailable,
      mode: 'c',
      ...health,
    }
  })

  app.get('/chat/sessions', { preHandler: requireAuth }, async (req, reply) => {
    try {
      const limit = req.query?.limit != null
        ? Number(req.query.limit)
        : DEFAULT_SESSION_LIMIT
      const sessions = listComposers({ limit })
      return { sessions, limit: sessions.length }
    } catch (err) {
      app.log.warn({ err }, 'chat/sessions failed')
      return reply.code(500).send({ error: err.message || 'sessions failed' })
    }
  })

  app.get('/chat/messages', { preHandler: requireAuth }, async (req, reply) => {
    const composerId = String(req.query?.composerId || '').trim()
    if (!composerId) {
      return reply.code(400).send({ error: 'composerId query required' })
    }
    try {
      const opts = parseMessageQuery(req.query)
      const messages = listMessages(composerId, opts)
      const lastCreatedAt = messages.length
        ? messages[messages.length - 1].createdAt
        : null
      return {
        composerId,
        messages,
        count: messages.length,
        lastCreatedAt,
        incremental: Boolean(opts.since),
      }
    } catch (err) {
      app.log.warn({ err, composerId }, 'chat/messages failed')
      return reply.code(500).send({ error: err.message || 'messages failed' })
    }
  })

  app.get('/chat/inject-status', { preHandler: requireAuth }, async (req, reply) => {
    const composerId = String(req.query?.composerId || '').trim()
    if (!composerId) {
      return reply.code(400).send({ error: 'composerId query required' })
    }
    try {
      const session = getComposerById(composerId)
      const config = loadConfig()
      const targetWindow = config.targetWindowTitle || ''
      return {
        composerId,
        sessionName: session?.name || null,
        targetWindow,
        hint: '전송(inject)은 PC에서 설정한 Cursor 창으로 들어갑니다. PC Agent에서 동일 세션을 선택한 뒤 보내세요.',
      }
    } catch (err) {
      app.log.warn({ err, composerId }, 'chat/inject-status failed')
      return reply.code(500).send({ error: err.message || 'inject-status failed' })
    }
  })
}

module.exports = { registerChatRoutes, parseMessageQuery }
