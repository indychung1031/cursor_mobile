const { renderSetupHtml, getLanIp } = require('../src/setupPage')

async function main() {
  const port = 3921
  const tailscaleIp = process.env.TAILSCALE_IP || '100.0.0.1'
  const html = renderSetupHtml({
    port,
    tailscaleIp,
    pairingCode: '123456',
  })

  const hasQrRoute = html.includes('/setup/qr?url=')
  const hasPairUrl = html.includes('/pair?code=123456')
  const items = (html.match(/data-qr-host="/g) || []).length
  console.log('QR route img:', hasQrRoute)
  console.log('pair URL in page:', hasPairUrl)
  console.log('QR items:', items)

  if (!hasQrRoute || !hasPairUrl || items < 1) {
    process.exit(1)
  }
  console.log('LAN IP:', getLanIp() || '(none)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
