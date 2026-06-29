const { listComposers, listMessages, getChatHealth } = require('./cursorDb')

function registerChatRoutes(app, requireAuth) {
  app.get('/chat/health', async () => {
    const health = getChatHealth()
    return {
      ok: health.dbExists && health.sqliteAvailable,
      mode: 'c',
      ...health,
    }
  })

  app.get('/chat/sessions', { preHandler: requireAuth }, async (_req, reply) => {
    try {
      const sessions = listComposers()
      return { sessions }
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
      const messages = listMessages(composerId)
      return { composerId, messages }
    } catch (err) {
      app.log.warn({ err, composerId }, 'chat/messages failed')
      return reply.code(500).send({ error: err.message || 'messages failed' })
    }
  })
}

module.exports = { registerChatRoutes }
