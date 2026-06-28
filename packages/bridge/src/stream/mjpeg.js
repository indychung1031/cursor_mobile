const { loadConfig } = require('../config')
const { captureRegion } = require('../capture')

const BOUNDARY = 'frame'
const FRAME_MS = 200

function registerMjpegStream(app, requireAuth) {
  app.get('/stream', { preHandler: requireAuth }, async (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'close',
    })

    let active = true
    req.raw.on('close', () => {
      active = false
    })

    while (active) {
      try {
        const config = loadConfig()
        const frame = await captureRegion(config)
        reply.raw.write(`--${BOUNDARY}\r\n`)
        reply.raw.write('Content-Type: image/jpeg\r\n')
        reply.raw.write(`Content-Length: ${frame.length}\r\n\r\n`)
        reply.raw.write(frame)
        reply.raw.write('\r\n')
      } catch (err) {
        app.log.warn({ err }, 'stream frame error')
      }

      await new Promise((r) => setTimeout(r, FRAME_MS))
    }
  })
}

module.exports = { registerMjpegStream }
