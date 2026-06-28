const { execFile } = require('child_process')

function openSetupPage(port) {
  if (process.env.BRIDGE_NO_OPEN === '1') return

  const url = `http://localhost:${port}/setup`

  if (process.platform === 'win32') {
    execFile('cmd', ['/c', 'start', '', url], { windowsHide: true }, () => {})
    return
  }
  if (process.platform === 'darwin') {
    execFile('open', [url], () => {})
    return
  }
  execFile('xdg-open', [url], () => {})
}

module.exports = { openSetupPage }
