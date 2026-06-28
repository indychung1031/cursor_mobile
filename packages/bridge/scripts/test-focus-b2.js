/**
 * WP-B2: POST /focus/prepare
 * Bridge 실행 중: npm run test:focus-b2
 */
const port = Number(process.env.BRIDGE_PORT || 3921)
const base = `http://127.0.0.1:${port}`

async function pairToken() {
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
  return (await pairRes.json()).token
}

async function main() {
  if (process.platform !== 'win32') {
    console.log('skip: Windows-only')
    return
  }

  const health = await fetch(`${base}/health`)
  if (!health.ok) throw new Error(`Bridge not running on ${port}`)

  const token = await pairToken()
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const res = await fetch(`${base}/focus/prepare`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ minimizeOthers: false }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`prepare failed: ${JSON.stringify(data)}`)
  if (!data.ok || data.minimizeOthers !== false) {
    throw new Error('expected ok:true minimizeOthers:false')
  }
  console.log('focus/prepare:', data)

  const aggressive = await fetch(`${base}/focus/prepare`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ minimizeOthers: true }),
  })
  const agData = await aggressive.json()
  if (!aggressive.ok || !agData.ok) {
    throw new Error(`prepare minimizeOthers:true failed: ${JSON.stringify(agData)}`)
  }
  console.log('focus/prepare minimizeOthers:true:', agData)

  console.log('WP-B2 test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
