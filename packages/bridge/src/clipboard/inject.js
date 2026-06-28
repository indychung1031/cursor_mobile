const path = require('path')
const { execFileSync } = require('child_process')
const clipboardy = require('clipboardy')
const { listDisplays } = require('../capture')
const { findDisplayBounds } = require('../displayBounds')

const INJECT_PS1 = path.join(__dirname, '..', '..', 'scripts', 'inject.ps1')

async function injectMessage(text, config = {}) {
  if (process.platform !== 'win32') {
    throw new Error('clipboard inject is Windows-only in v1')
  }

  await clipboardy.write(text)

  const args = [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    INJECT_PS1,
  ]

  if (config.targetWindowTitle) {
    args.push('-WindowTitle', config.targetWindowTitle)
  }

  if (config.inputOffset) {
    const { xRatio = 0.72, fromBottom = 38 } = config.inputOffset
    args.push('-XRatio', String(xRatio), '-FromBottom', String(Math.round(fromBottom)))
  } else if (config.inputCoord) {
    args.push(
      '-UseAbsolute',
      '-X',
      String(Math.round(config.inputCoord.x)),
      '-Y',
      String(Math.round(config.inputCoord.y)),
    )
  } else {
    args.push('-XRatio', '0.72', '-FromBottom', '38')
  }

  try {
    const displays = await listDisplays()
    const bounds = findDisplayBounds(displays, config.selectedDisplay)
    if (bounds) {
      args.push(
        '-DisplayLeft',
        String(bounds.left),
        '-DisplayTop',
        String(bounds.top),
        '-DisplayRight',
        String(bounds.right),
        '-DisplayBottom',
        String(bounds.bottom),
      )
    }
  } catch {
    /* inject without display filter */
  }

  try {
    execFileSync('powershell', args, { windowsHide: true, timeout: 15000 })
  } catch (err) {
    const msg = err.stderr?.toString().trim() || err.message || 'inject failed'
    throw new Error(msg)
  }
}

module.exports = { injectMessage }
