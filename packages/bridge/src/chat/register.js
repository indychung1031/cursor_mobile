const { registerChatRoutes } = require('./routes')
const { renderChatHtml } = require('./chatPage')

function registerChatMode(app, requireAuth, sendHtml) {
  registerChatRoutes(app, requireAuth)

  app.get('/chat', async (_req, reply) => sendHtml(reply, renderChatHtml()))

  app.get('/chat/pair', async (req, reply) => {
    const code = String(req.query?.code || '').trim()
    if (!code) {
      return reply.redirect('/chat?pair_error=missing')
    }
    const { verifyPairingCode, signToken } = require('../auth/pairing')
    if (!verifyPairingCode(code)) {
      return reply.redirect('/chat?pair_error=invalid')
    }
    const token = signToken()
    return reply.redirect(`/chat?cm_token=${encodeURIComponent(token)}`)
  })
}

module.exports = { registerChatMode }
