/**
 * C-mode API smoke — Bridge must run with BRIDGE_CHAT=1
 * $env:BRIDGE_CHAT='1'; npm start
 * npm run test:chat-api
 */
const port = Number(process.env.BRIDGE_PORT || 3921)
const base = `http://127.0.0.1:${port}`

async function getToken() {
  let code = (await (await fetch(`${base}/auth/pairing-code`)).json()).code
  if (!code) {
    code = (await (
      await fetch(`${base}/auth/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
    ).json()).code
  }
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

  const chatHealth = await fetch(`${base}/chat/health`)
  if (chatHealth.status === 404) {
    throw new Error('BRIDGE_CHAT=1 로 Bridge를 재시작하세요')
  }
  const ch = await chatHealth.json()
  if (!ch.ok) throw new Error(`chat/health not ok: ${JSON.stringify(ch)}`)
  console.log('chat/health:', { dbExists: ch.dbExists, sqliteAvailable: ch.sqliteAvailable })

  const token = await getToken()
  const auth = { Authorization: `Bearer ${token}` }

  const sessionsRes = await fetch(`${base}/chat/sessions`, { headers: auth })
  if (!sessionsRes.ok) throw new Error(`chat/sessions ${sessionsRes.status}`)
  const { sessions } = await sessionsRes.json()
  if (!sessions?.length) throw new Error('no sessions')
  console.log('sessions:', sessions.length)

  const composerId = sessions[0].composerId
  const msgRes = await fetch(
    `${base}/chat/messages?composerId=${encodeURIComponent(composerId)}`,
    { headers: auth },
  )
  if (!msgRes.ok) throw new Error(`chat/messages ${msgRes.status}`)
  const { messages } = await msgRes.json()
  if (!messages?.length) throw new Error('no messages')
  console.log('messages:', messages.length, 'sample role:', messages[0].role)

  const html = await (await fetch(`${base}/chat`)).text()
  if (!html.includes('cursor_mobile · Chat')) {
    throw new Error('/chat page missing title')
  }
  if (!html.includes('/chat/sessions')) {
    throw new Error('/chat page missing sessions fetch')
  }
  console.log('/chat UI: ok')
  console.log('C-mode API test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
