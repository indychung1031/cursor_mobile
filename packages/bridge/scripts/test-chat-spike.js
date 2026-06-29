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
  if (health.dbPath) {
    throw new Error('getChatHealth should not expose dbPath')
  }

  const sessions = listComposers({ limit: 5 })
  console.log('sessions:', sessions.length)
  if (!sessions.length) {
    throw new Error('no composer sessions in DB')
  }
  sessions.forEach((s) => {
    console.log(' -', s.composerId.slice(0, 8) + '…', s.name)
  })

  const pick = sessions[0]
  const all = listMessages(pick.composerId, { tail: 100 })
  const empty = all.filter((m) => !m.text.trim()).length
  if (empty > 0) throw new Error('empty text messages should be filtered')

  const tail = listMessages(pick.composerId, { tail: 10 })
  console.log('tail=10:', tail.length)
  if (tail.length > 10) throw new Error('tail limit failed')

  console.log('C-mode chat spike passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
