const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const STATE_PATH = path.join(__dirname, '..', '.powercfg-state.json')

function runPowerCfg(args) {
  execSync(`powercfg ${args}`, { stdio: 'pipe', windowsHide: true })
}

function readMonitorTimeouts() {
  const out = execSync('powercfg /query SCHEME_CURRENT SUB_VIDEO VIDEOIDLE', {
    encoding: 'utf8',
    windowsHide: true,
  })

  const acMatch = out.match(/AC Power Setting Index:\s*0x([0-9a-f]+)/i)
  const dcMatch = out.match(/DC Power Setting Index:\s*0x([0-9a-f]+)/i)

  return {
    acMinutes: acMatch ? parseInt(acMatch[1], 16) : null,
    dcMinutes: dcMatch ? parseInt(dcMatch[1], 16) : null,
  }
}

function preventDisplaySleep() {
  if (process.platform !== 'win32') {
    console.warn('[Bridge] display sleep prevention is Windows-only')
    return { applied: false }
  }

  if (!fs.existsSync(STATE_PATH)) {
    const previous = readMonitorTimeouts()
    fs.writeFileSync(STATE_PATH, JSON.stringify(previous, null, 2), 'utf8')
    console.log('[Bridge] saved previous monitor timeouts:', previous)
  }

  runPowerCfg('/change monitor-timeout-ac 0')
  runPowerCfg('/change monitor-timeout-dc 0')
  console.log('[Bridge] display auto-off disabled (monitor-timeout = 0)')

  return { applied: true }
}

function restoreDisplaySleep() {
  if (process.platform !== 'win32' || !fs.existsSync(STATE_PATH)) {
    return
  }

  try {
    const { acMinutes, dcMinutes } = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'))
    if (acMinutes != null) {
      runPowerCfg(`/change monitor-timeout-ac ${acMinutes}`)
    }
    if (dcMinutes != null) {
      runPowerCfg(`/change monitor-timeout-dc ${dcMinutes}`)
    }
    fs.unlinkSync(STATE_PATH)
    console.log('[Bridge] restored monitor timeouts:', { acMinutes, dcMinutes })
  } catch (err) {
    console.warn('[Bridge] failed to restore powercfg:', err.message)
  }
}

function registerShutdownHooks() {
  const cleanup = () => {
    restoreDisplaySleep()
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

module.exports = {
  preventDisplaySleep,
  restoreDisplaySleep,
  registerShutdownHooks,
  STATE_PATH,
}
