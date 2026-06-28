/**
 * WP-C1: POST /scroll — Agent 패널 wheel inject
 * Bridge 실행 중: npm run test:scroll-c1
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
    console.log('skip: Windows-only (scroll inject needs PowerShell)')
    return
  }

  const health = await fetch(`${base}/health`)
  if (!health.ok) throw new Error(`Bridge not running on ${port}`)

  const token = await pairToken()
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const up = await fetch(`${base}/scroll`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ deltaY: -240, mode: 'wheel' }),
  })
  const upData = await up.json()
  if (!up.ok) throw new Error(`scroll up failed: ${JSON.stringify(upData)}`)
  console.log('scroll up:', upData)

  const down = await fetch(`${base}/scroll`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ deltaY: 240, mode: 'wheel' }),
  })
  const downData = await down.json()
  if (!down.ok) throw new Error(`scroll down failed: ${JSON.stringify(downData)}`)
  console.log('scroll down:', downData)

  const bad = await fetch(`${base}/scroll`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mode: 'wheel' }),
  })
  if (bad.status !== 400) {
    throw new Error(`expected 400 for missing deltaY, got ${bad.status}`)
  }
  console.log('validation: missing deltaY → 400 ok')

  console.log('WP-C1 test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
