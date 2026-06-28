/**
 * WP-F1: /health 확장 + 모바일 Health 패널
 * Bridge 실행 중: npm run test:health-f1
 */
const port = Number(process.env.BRIDGE_PORT || 3921)
const base = `http://127.0.0.1:${port}`

const HEALTH_FIELDS = ['bridge', 'cursor', 'tailscale', 'stream', 'streamFps']
const MOBILE_MARKERS = ['health-panel', 'health-btn', 'refreshHealthPanel', 'toggleHealthPanel']

async function main() {
  const health = await fetch(`${base}/health`)
  if (!health.ok) throw new Error(`Bridge not running on ${port}`)

  const data = await health.json()
  if (data.ok !== true && data.status !== 'ok') {
    throw new Error('health ok/status missing')
  }
  for (const field of HEALTH_FIELDS) {
    if (data[field] == null) {
      throw new Error(`health missing field: ${field}`)
    }
  }
  if (typeof data.cursor?.running !== 'boolean') {
    throw new Error('health.cursor.running must be boolean')
  }
  console.log('health API:', {
    bridge: data.bridge,
    cursor: data.cursor,
    tailscale: data.tailscale,
    streamFps: data.streamFps,
  })

  const html = await (await fetch(`${base}/`)).text()
  for (const needle of MOBILE_MARKERS) {
    if (!html.includes(needle)) {
      throw new Error(`mobile page missing F1 marker: ${needle}`)
    }
  }
  console.log('mobile F1 UI markers: ok')
  console.log('WP-F1 test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
