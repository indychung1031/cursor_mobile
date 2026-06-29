/**
 * C-mode API smoke — Bridge must run with BRIDGE_CHAT=1
 * npm run test:chat-api
 */
const port = Number(process.env.BRIDGE_PORT || 3921)
const base = `http://127.0.0.1:${port}`

async function getToken() {
  const regen = await fetch(`${base}/auth/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!regen.ok) throw new Error('regenerate failed (localhost only)')
  const code = (await regen.json()).code
  const pair = await fetch(`${base}/auth/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!pair.ok) throw new Error('pair failed')
  return (await pair.json()).token
}

async function main() {
  const health = await fetch(`${base}/health`)
  if (!health.ok) throw new Error(`Bridge not running on ${port}`)

  const token = await getToken()
  const auth = { Authorization: `Bearer ${token}` }

  const chatHealth = await fetch(`${base}/chat/health`, { headers: auth })
  if (chatHealth.status === 404) {
    throw new Error('BRIDGE_CHAT=1 로 Bridge를 재시작하세요')
  }
  const ch = await chatHealth.json()
  if (!ch.ok) throw new Error(`chat/health not ok: ${JSON.stringify(ch)}`)
  if (ch.dbPath) throw new Error('chat/health should not expose dbPath')
  console.log('chat/health:', { dbExists: ch.dbExists, sqliteAvailable: ch.sqliteAvailable })

  const unauth = await fetch(`${base}/chat/health`)
  if (unauth.status !== 401) {
    throw new Error('chat/health should require auth')
  }

  const sessionsRes = await fetch(`${base}/chat/sessions?limit=10`, { headers: auth })
  if (!sessionsRes.ok) throw new Error(`chat/sessions ${sessionsRes.status}`)
  const { sessions } = await sessionsRes.json()
  if (!sessions?.length) throw new Error('no sessions')
  console.log('sessions:', sessions.length)

  const composerId = sessions[0].composerId
  const msgRes = await fetch(
    `${base}/chat/messages?composerId=${encodeURIComponent(composerId)}&tail=20`,
    { headers: auth },
  )
  if (!msgRes.ok) throw new Error(`chat/messages ${msgRes.status}`)
  const body = await msgRes.json()
  if (!body.messages?.length) throw new Error('no messages with tail=20')
  if (body.messages.length > 25) throw new Error('tail should cap messages')
  console.log('messages tail:', body.messages.length)

  const remoteRegen = await fetch(`${base}/auth/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '8.8.8.8' },
    body: '{}',
  })
  if (remoteRegen.status !== 403) {
    throw new Error('regenerate should reject non-localhost without setup token')
  }

  const html = await (await fetch(`${base}/chat`)).text()
  if (!html.includes('EventSource')) throw new Error('/chat missing SSE')
  if (!html.includes('/chat/inject-status')) throw new Error('/chat missing inject-status')
  console.log('/chat UI: ok')
  console.log('C-mode API test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
