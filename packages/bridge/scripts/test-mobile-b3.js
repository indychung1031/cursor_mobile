/**
 * WP-B3: 모바일 집중 토글
 * Bridge 실행 중: npm run test:mobile-b3
 */
const port = Number(process.env.BRIDGE_PORT || 3921)
const base = `http://127.0.0.1:${port}`

const MARKERS = [
  'focus-toggle',
  'cm_focus_mode',
  '/focus/prepare',
  'minimizeOthers: false',
]

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
  const health = await fetch(`${base}/health`)
  if (!health.ok) throw new Error(`Bridge not running on ${port}`)

  const html = await (await fetch(`${base}/`)).text()
  for (const needle of MARKERS) {
    if (!html.includes(needle)) {
      throw new Error(`mobile page missing B3 marker: ${needle}`)
    }
  }
  console.log('mobile B3 UI markers: ok')

  const token = await pairToken()
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const prep = await fetch(`${base}/focus/prepare`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ minimizeOthers: false }),
  })
  if (!prep.ok) throw new Error('focus/prepare failed in B3 flow')

  const msg = await fetch(`${base}/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: 'b3 smoke' }),
  })
  if (!msg.ok) {
    const data = await msg.json().catch(() => ({}))
    throw new Error('message after prepare failed: ' + JSON.stringify(data))
  }
  console.log('focus + message flow: ok')
  console.log('WP-B3 test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
