/**
 * C-mode spike: Cursor state.vscdb read-only (Bridge 불필요)
 * npm run test:chat-spike
 */
const { getChatHealth, listComposers, listMessages } = require('../src/chat/cursorDb')

async function main() {
  const health = getChatHealth()
  console.log('chat health:', health)
  if (!health.sqliteAvailable) {
    throw new Error('node:sqlite unavailable — Node 22+ required')
  }
  if (!health.dbExists) {
    throw new Error('state.vscdb not found — start Cursor on this PC first')
  }

  const sessions = listComposers()
  console.log('sessions:', sessions.length)
  if (!sessions.length) {
    throw new Error('no composer sessions in DB')
  }
  sessions.slice(0, 5).forEach((s) => {
    console.log(' -', s.composerId.slice(0, 8) + '…', s.name)
  })

  const pick = sessions[0]
  const messages = listMessages(pick.composerId)
  console.log('messages in first session:', messages.length)
  if (messages.length < 1) {
    throw new Error('expected at least 1 message in first session')
  }
  const sample = messages[messages.length - 1]
  console.log('last message:', {
    role: sample.role,
    textLen: sample.text.length,
    preview: sample.text.slice(0, 80).replace(/\s+/g, ' '),
  })

  console.log('C-mode chat spike passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
