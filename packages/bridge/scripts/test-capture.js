/**
 * Phase 0 게이트: 채팅 패널 crop JPEG 생성
 * 사용: npm run test:capture
 * config.json region 좌표를 Cursor Agent 패널에 맞게 수정한 뒤 실행
 */
const path = require('path')
const { loadConfig, getConfigPath } = require('../src/config')
const { captureRegionToFile } = require('../src/capture')

async function main() {
  const config = loadConfig()
  const outputPath = path.join(__dirname, '..', 'output', 'test_capture.jpg')

  console.log('Using config:', getConfigPath())
  console.log('Region:', config.region)
  console.log('Display:', config.selectedDisplay)

  const saved = await captureRegionToFile(config, outputPath)
  console.log(`Saved: ${saved}`)
  console.log('iPhone에서 이 파일을 열어 텍스트 가독성을 확인하세요.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
