/**
 * WP-A3: 모바일 재연결 UX
 * Bridge 실행 중: npm run test:mobile-a3
 */
const port = Number(process.env.BRIDGE_PORT || 3921)
const base = `http://127.0.0.1:${port}`

const REQUIRED = [
  'retryStream',
  'handleUnauthorized',
  'stream-overlay-msg',
  '새 코드로 연결',
  '재연결',
  'checkSession',
  'startSessionPoll',
]

async function main() {
  const health = await fetch(`${base}/health`)
  if (!health.ok) throw new Error(`Bridge not running on ${port}`)

  const html = await (await fetch(`${base}/`)).text()
  for (const needle of REQUIRED) {
    if (!html.includes(needle)) {
      throw new Error(`mobile page missing A3 marker: ${needle}`)
    }
  }
  console.log('mobile A3 UI markers: ok')

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

  const pairRes = await fetch(`${base}/auth/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!pairRes.ok) throw new Error('pair failed')
  const { token } = await pairRes.json()

  const session = await fetch(`${base}/auth/session`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!session.ok) throw new Error('session should work after pair')
  console.log('session after pair: ok')

  const badPair = await fetch(`${base}/auth/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: '000000' }),
  })
  if (badPair.status !== 401) {
    throw new Error('invalid pair code should return 401')
  }
  console.log('401 on invalid code: ok')

  console.log('WP-A3 test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
