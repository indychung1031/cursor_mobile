const fs = require('fs')
const path = require('path')
const screenshot = require('screenshot-desktop')
const Jimp = require('jimp')

async function listDisplays() {
  const displays = await screenshot.listDisplays()
  const sorted = [...displays].sort((a, b) => (a.left ?? 0) - (b.left ?? 0))
  return sorted.map((d, index) => ({
    id: d.id ?? index,
    name: `모니터 ${index + 1}`,
    deviceId: d.name || String(d.id ?? index),
    left: d.left ?? 0,
    top: d.top ?? 0,
    width: d.width,
    height: d.height,
  }))
}

async function captureRegion(config) {
  const { selectedDisplay = 0, region, jpegQuality = 75 } = config
  const imgBuffer = await screenshot({ screen: selectedDisplay, format: 'png' })
  const image = await Jimp.read(imgBuffer)

  const { x, y, width, height } = region
  const cropped = image.crop(x, y, width, height).quality(jpegQuality)
  return cropped.getBufferAsync(Jimp.MIME_JPEG)
}

async function captureRegionToFile(config, outputPath) {
  const buffer = await captureRegion(config)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, buffer)
  return outputPath
}

module.exports = {
  listDisplays,
  captureRegion,
  captureRegionToFile,
}
