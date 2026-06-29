/**
 * WP-C3: Freeze (스트림 탭 고정 + 라이브 복귀)
 * Bridge 실행 중: npm run test:mobile-c3
 */
const port = Number(process.env.BRIDGE_PORT || 3921)
const base = `http://127.0.0.1:${port}`

const MARKERS = [
  'stream-freeze',
  'freezeStream',
  'resumeLiveStream',
  'replaceStreamImg',
  'live-btn',
  'streamFrozen',
]

async function main() {
  const health = await fetch(`${base}/health`)
  if (!health.ok) throw new Error(`Bridge not running on ${port}`)

  const html = await (await fetch(`${base}/`)).text()
  for (const needle of MARKERS) {
    if (!html.includes(needle)) {
      throw new Error(`mobile page missing C3 marker: ${needle}`)
    }
  }
  console.log('mobile C3 UI markers: ok')
  console.log('WP-C3 test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
