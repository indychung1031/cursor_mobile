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

  const pairRes = await fetch(`${base}/pair?code=${encodeURIComponent(code)}`, {
    redirect: 'manual',
  })
  if (pairRes.status !== 302) {
    throw new Error(`pair should redirect with 302, got ${pairRes.status}`)
  }
  const location = pairRes.headers.get('location') || ''
  const redirectUrl = new URL(location, base)
  const token = redirectUrl.searchParams.get('cm_token')
  if (!token) throw new Error('pair redirect missing cm_token')
  console.log('token from pair redirect: ok')

  const session = await fetch(`${base}/auth/session`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!session.ok) throw new Error('session failed after pair')
  console.log('session:', await session.json())

  const badPair = await fetch(`${base}/pair?code=000000`, { redirect: 'manual' })
  const badLocation = badPair.headers.get('location') || ''
  if (!badLocation.includes('pair_error=invalid')) {
    throw new Error('invalid pair should redirect with pair_error')
  }
  console.log('invalid code handling: ok')

  const home = await (await fetch(`${base}/`)).text()
  if (!home.includes('Cache-Control')) {
    throw new Error('mobile page should disable cache')
  }
  if (!home.includes("getElementById('pair-btn')")) {
    throw new Error('mobile page should wire pair button with addEventListener')
  }

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
