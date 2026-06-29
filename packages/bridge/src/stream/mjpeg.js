const { loadConfig } = require('../config')
const { captureRegion } = require('../capture')
const {
  recordStreamFrame,
  streamClientConnected,
  streamClientDisconnected,
} = require('../bridgeState')

const BOUNDARY = 'frame'
/** 전송 간격 (ms) — env STREAM_SEND_MS 로 조정 */
const SEND_MS = Number(process.env.STREAM_SEND_MS || 120)
/** 캡처 시도 간격 (ms) — env STREAM_CAPTURE_MS */
const CAPTURE_MS = Number(process.env.STREAM_CAPTURE_MS || 100)

function registerMjpegStream(app, requireAuth) {
  app.get('/stream', { preHandler: requireAuth }, async (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'close',
    })

    let active = true
    let captureLoopRunning = true
    let latestFrame = null
    let latestFrameId = 0
    let lastSentId = -1
    let captureInFlight = false

    streamClientConnected()
    req.raw.on('close', () => {
      active = false
      captureLoopRunning = false
      streamClientDisconnected()
    })

    async function captureLoop() {
      while (captureLoopRunning) {
        const start = Date.now()
        if (!captureInFlight) {
          captureInFlight = true
          try {
            const config = loadConfig()
            latestFrame = await captureRegion(config, { forStream: true })
            latestFrameId += 1
          } catch (err) {
            app.log.warn({ err }, 'stream capture error')
          } finally {
            captureInFlight = false
          }
        }
        const elapsed = Date.now() - start
        await new Promise((r) => setTimeout(r, Math.max(0, CAPTURE_MS - elapsed)))
      }
    }

    captureLoop()

    while (active) {
      if (latestFrame && latestFrameId !== lastSentId) {
        try {
          reply.raw.write(`--${BOUNDARY}\r\n`)
          reply.raw.write('Content-Type: image/jpeg\r\n')
          reply.raw.write(`Content-Length: ${latestFrame.length}\r\n\r\n`)
          reply.raw.write(latestFrame)
          reply.raw.write('\r\n')
          lastSentId = latestFrameId
          recordStreamFrame()
        } catch (err) {
          app.log.warn({ err }, 'stream send error')
          active = false
          break
        }
      }
      await new Promise((r) => setTimeout(r, SEND_MS))
    }
  })
}

module.exports = { registerMjpegStream, SEND_MS, CAPTURE_MS }
