const path = require('path')
const { execFileSync } = require('child_process')
const clipboardy = require('clipboardy')
const { listDisplays } = require('../capture')
const { findDisplayBounds } = require('../displayBounds')

const INJECT_PS1 = path.join(__dirname, '..', '..', 'scripts', 'inject.ps1')

function appendWindowArgs(args, config) {
  if (config.targetWindowTitle) {
    args.push('-WindowTitle', config.targetWindowTitle)
  }
}

function appendInputArgs(args, config) {
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
}

async function appendDisplayArgs(args, config) {
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
    /* optional display filter */
  }
}

async function buildInjectScriptArgs(config, mode = 'inject') {
  const args = [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    INJECT_PS1,
  ]
  appendWindowArgs(args, config)
  appendInputArgs(args, config)
  await appendDisplayArgs(args, config)
  if (mode === 'dry-run') args.push('-DryRun')
  else if (mode === 'focus') args.push('-FocusOnly')
  return args
}

function runInjectScript(args) {
  if (process.platform !== 'win32') {
    throw new Error('focus/inject is Windows-only in v1')
  }
  const stdout = execFileSync('powershell', args, {
    windowsHide: true,
    timeout: 15000,
    encoding: 'utf8',
  })
  return stdout.trim()
}

/** @returns {Promise<object>} window title, click coords (no mouse/keyboard) */
async function dryRunFocus(config = {}) {
  const args = await buildInjectScriptArgs(config, 'dry-run')
  const raw = runInjectScript(args)
  if (!raw) {
    throw new Error('dry-run returned empty output')
  }
  return JSON.parse(raw)
}

/** Activate Cursor window and click the Agent input field. */
async function focusWindow(config = {}) {
  const args = await buildInjectScriptArgs(config, 'focus')
  runInjectScript(args)
  return { ok: true }
}

/** Write clipboard + focus + paste + Enter (Phase 1 message inject). */
async function injectMessage(text, config = {}) {
  await clipboardy.write(text)
  const args = await buildInjectScriptArgs(config, 'inject')
  runInjectScript(args)
  return { ok: true }
}

module.exports = {
  buildInjectScriptArgs,
  dryRunFocus,
  focusWindow,
  injectMessage,
}
