/**
 * 전체 화면 + 우측 영역 후보 캡처 (좌표 튜닝용)
 * npm run calibrate
 */
const path = require('path')
const screenshot = require('screenshot-desktop')
const Jimp = require('jimp')

async function main() {
  const outDir = path.join(__dirname, '..', 'output', 'calibrate')
  const fs = require('fs')
  fs.mkdirSync(outDir, { recursive: true })

  const displays = await screenshot.listDisplays()
  console.log('Displays:', displays)

  const imgBuffer = await screenshot({ screen: 0, format: 'png' })
  const full = await Jimp.read(imgBuffer)
  const w = full.getWidth()
  const h = full.getHeight()
  console.log(`Display 0 size: ${w} x ${h}`)

  await full.writeAsync(path.join(outDir, 'fullscreen.png'))

  // Agent 패널: 화면 우측 고정 폭 (Cursor 채팅 열만)
  const panelW = Math.min(560, Math.round(w * 0.28))
  const panelX = w - panelW
  const panelH = Math.round(h * 0.88)
  const panelY = Math.round(h * 0.06)

  const panel = full.clone().crop(panelX, panelY, panelW, panelH).quality(80)
  await panel.writeAsync(path.join(outDir, 'panel_candidate.jpg'))

  const inputY = panelY + panelH - 80
  const inputX = panelX + Math.round(panelW / 2)

  const suggested = {
    selectedDisplay: 0,
    region: { x: panelX, y: panelY, width: panelW, height: panelH },
    inputCoord: { x: inputX, y: inputY },
    jpegQuality: 82,
  }

  const configPath = path.join(__dirname, '..', 'config.json')
  fs.writeFileSync(configPath, JSON.stringify(suggested, null, 2), 'utf8')

  console.log('\nSuggested config.json written:')
  console.log(JSON.stringify(suggested, null, 2))
  console.log(`\nPreview: output/calibrate/panel_candidate.jpg`)
  console.log('Bridge 재시작 후 iPhone 새로고침')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
