/**
 * WP-B3: 모바일 집중 토글 (스모크 — inject 없음)
 * Bridge 실행 중: npm run test:mobile-b3
 *
 * POST /message inject는 Cursor Agent 채팅에 텍스트+Enter를 넣어
 * 이 세션과 feedback loop가 날 수 있어 스모크에서는 제외한다.
 * 실제 inject·집중 ON/OFF는 iPhone 또는 /dev에서 수동 검증.
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

  const dry = await fetch(`${base}/focus/dry-run`, {
    method: 'POST',
    headers,
    body: '{}',
  })
  const dryData = await dry.json().catch(() => ({}))
  if (!dry.ok || !dryData.windowTitle) {
    throw new Error('focus/dry-run failed in B3 smoke: ' + JSON.stringify(dryData))
  }
  console.log('focus dry-run (no inject): ok')

  console.log('WP-B3 test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
