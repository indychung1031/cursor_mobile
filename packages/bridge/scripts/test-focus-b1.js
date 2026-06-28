/**
 * WP-B1: focus 공통 모듈 + inject dry-run
 * Bridge 실행 중: npm run test:focus-b1
 */
const port = Number(process.env.BRIDGE_PORT || 3921)
const base = `http://127.0.0.1:${port}`

async function main() {
  if (process.platform !== 'win32') {
    console.log('skip: Windows-only (dry-run needs PowerShell)')
    return
  }

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

  const pairRes = await fetch(`${base}/auth/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!pairRes.ok) throw new Error('pair failed')
  const { token } = await pairRes.json()

  const dry = await fetch(`${base}/focus/dry-run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })
  const data = await dry.json()
  if (!dry.ok) throw new Error(`dry-run failed: ${JSON.stringify(data)}`)
  if (!data.windowTitle || !data.click) {
    throw new Error('dry-run missing windowTitle or click')
  }
  console.log('dry-run:', data.windowTitle, 'click', data.click)
  console.log('WP-B1 test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
