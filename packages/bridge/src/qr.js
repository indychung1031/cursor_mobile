const QRCode = require('qrcode')

const QR_OPTS = {
  width: 200,
  margin: 1,
  color: { dark: '#000000', light: '#ffffff' },
}

async function toDataUrl(text, size = 200) {
  if (!text) return null
  return QRCode.toDataURL(text, { ...QR_OPTS, width: size })
}

async function toPngBuffer(text) {
  if (!text) return null
  return QRCode.toBuffer(text, QR_OPTS)
}

/** @param {string} urlString @param {number} port @param {{ tailscaleIp?: string|null, lanIp?: string|null }} hosts */
function isAllowedQrUrl(urlString, port, { tailscaleIp = null, lanIp = null } = {}) {
  try {
    const u = new URL(urlString)
    if (u.protocol !== 'http:') return false
    const reqPort = u.port ? Number(u.port) : 80
    if (reqPort !== port) return false

    const host = u.hostname
    if (host === 'localhost' || host === '127.0.0.1') return true
    if (tailscaleIp && host === tailscaleIp) return true
    if (lanIp && host === lanIp) return true
    if (/^100\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return true
    return false
  } catch {
    return false
  }
}

function buildConnectUrl(host, port, pairingCode) {
  if (!host) return null
  const base = `http://${host}:${port}`
  if (pairingCode) {
    return `${base}/pair?code=${encodeURIComponent(pairingCode)}`
  }
  return `${base}/`
}

module.exports = { toDataUrl, toPngBuffer, isAllowedQrUrl, buildConnectUrl }
