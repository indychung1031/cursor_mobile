/**
 * WP-A4: /setup Cursor 창 선택 → POST /config/window
 * Bridge 실행 중: npm run test:setup-window
 */
const fs = require('fs')
const path = require('path')
const port = Number(process.env.BRIDGE_PORT || 3921)
const base = `http://127.0.0.1:${port}`
const configPath = path.join(__dirname, '..', 'config.json')

async function main() {
  const health = await fetch(`${base}/health`)
  if (!health.ok) throw new Error(`Bridge not running on ${port}`)

  const setup = await (await fetch(`${base}/setup`)).text()
  for (const needle of ['window-pick', 'window-refresh', '/config/window', 'selectWindow']) {
    if (needle === 'selectWindow' && !setup.includes('selectWindow') && !setup.includes('/config/window')) {
      throw new Error('setup missing window picker script')
    }
    if (needle !== 'selectWindow' && !setup.includes(needle)) {
      throw new Error(`setup missing A4 marker: ${needle}`)
    }
  }
  console.log('setup window picker UI: ok')

  const listRes = await fetch(`${base}/setup/windows`)
  if (!listRes.ok) throw new Error('GET /setup/windows failed')
  const list = await listRes.json()
  if (!Array.isArray(list.windows)) throw new Error('windows must be array')
  console.log('GET /setup/windows:', list.windows.length, 'window(s)')

  const testTitle = list.windows[0] || 'cursor_mobile_test_window'
  const postRes = await fetch(`${base}/config/window`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetWindowTitle: testTitle }),
  })
  if (!postRes.ok) throw new Error(`POST /config/window HTTP ${postRes.status}`)
  const saved = await postRes.json()
  if (saved.targetWindowTitle !== testTitle) {
    throw new Error('saved targetWindowTitle mismatch')
  }
  console.log('POST /config/window: ok')

  const list2 = await (await fetch(`${base}/setup/windows`)).json()
  if (list2.targetWindowTitle !== testTitle) {
    throw new Error('GET /setup/windows targetWindowTitle not updated')
  }

  if (fs.existsSync(configPath)) {
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    if (cfg.targetWindowTitle !== testTitle) {
      throw new Error('config.json targetWindowTitle not updated')
    }
    console.log('config.json persisted: ok')
  }

  const empty = await fetch(`${base}/config/window`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetWindowTitle: '  ' }),
  })
  if (empty.status !== 400) throw new Error('empty title should return 400')
  console.log('empty title validation: ok')

  console.log('WP-A4 test passed')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
