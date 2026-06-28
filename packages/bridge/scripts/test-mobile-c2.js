/**
 * WP-C2: 모바일 스크롤 UI (↑↓ 버튼 + 스와이프)
 * Bridge 실행 중: npm run test:mobile-c2
 */
const port = Number(process.env.BRIDGE_PORT || 3921)
const base = `http://127.0.0.1:${port}`

const MARKERS = [
  'scroll-up',
  'scroll-down',
  'SCROLL_STEP',
  '/scroll',
  'onStreamTouchStart',
  'sendScroll',
]

async function main() {
  const health = await fetch(`${base}/health`)
  if (!health.ok) throw new Error(`Bridge not running on ${port}`)

  const html = await (await fetch(`${base}/`)).text()
  for (const needle of MARKERS) {
    if (!html.includes(needle)) {
      throw new Error(`mobile page missing C2 marker: ${needle}`)
    }
  }
  console.log('mobile C2 UI markers: ok')
  console.log('WP-C2 test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
