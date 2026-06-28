/**
 * WP-A2: /pair?code= 자동 페어링
 * Bridge 실행 중: npm run test:pair
 * 또는: BRIDGE_PORT=3925 node scripts/test-pair.js
 */
const port = Number(process.env.BRIDGE_PORT || 3921)
const base = `http://127.0.0.1:${port}`

async function main() {
  const health = await fetch(`${base}/health`)
  if (!health.ok) throw new Error(`Bridge not running on ${port}`)

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
  console.log('pairing code:', code)

  const pairRes = await fetch(`${base}/pair?code=${encodeURIComponent(code)}`)
  const pairHtml = await pairRes.text()
  if (!pairRes.ok) throw new Error(`pair HTTP ${pairRes.status}`)
  if (!pairHtml.includes("localStorage.setItem('cm_token'")) {
    throw new Error('pair page missing token storage script')
  }
  if (!pairHtml.includes('#cm=')) {
    throw new Error('pair page missing hash token redirect')
  }
  const tokenMatch = pairHtml.match(/var t = ("[^"]+"|'[^']+')/)
  if (!tokenMatch) throw new Error('token not found in pair page')
  const token = JSON.parse(tokenMatch[1])
  console.log('token from pair page: ok')

  const session = await fetch(`${base}/auth/session`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!session.ok) throw new Error('session failed after pair')
  console.log('session:', await session.json())

  const badPair = await fetch(`${base}/pair?code=000000`)
  const badHtml = await badPair.text()
  if (!badHtml.includes('pair_error=invalid')) {
    throw new Error('invalid pair should redirect with pair_error')
  }
  console.log('invalid code handling: ok')

  const setup = await (await fetch(`${base}/setup`)).text()
  if (!setup.includes('/pair?code=')) {
    throw new Error('setup QR should use /pair?code= URLs')
  }
  console.log('setup pair URLs: ok')

  console.log('WP-A2 test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
