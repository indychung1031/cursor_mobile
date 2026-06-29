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

async function captureRegion(config, options = {}) {
  const { selectedDisplay = 0, region, jpegQuality = 75 } = config
  const imgBuffer = await screenshot({ screen: selectedDisplay, format: 'png' })
  const image = await Jimp.read(imgBuffer)

  const { x, y, width, height } = region
  const imgW = image.bitmap.width
  const imgH = image.bitmap.height
  const safeX = Math.max(0, Math.min(x, imgW - 1))
  const safeY = Math.max(0, Math.min(y, imgH - 1))
  const safeW = Math.max(1, Math.min(width, imgW - safeX))
  const safeH = Math.max(1, Math.min(height, imgH - safeY))
  let cropped = image.crop(safeX, safeY, safeW, safeH)

  let scale = options.scale
  if (scale == null && options.forStream) {
    scale = config.streamScale ?? 0.85
  }
  if (scale > 0 && scale < 1) {
    cropped = cropped.resize(
      Math.max(1, Math.round(safeW * scale)),
      Math.max(1, Math.round(safeH * scale)),
    )
  }

  let quality = jpegQuality
  if (options.forStream) {
    const streamQ = config.streamJpegQuality
    quality = streamQ != null ? streamQ : Math.min(jpegQuality, 72)
  }

  return cropped.quality(quality).getBufferAsync(Jimp.MIME_JPEG)
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
