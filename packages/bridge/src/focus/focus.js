const path = require('path')
const { execFileSync } = require('child_process')
const clipboardy = require('clipboardy')
const { listDisplays } = require('../capture')
const { findDisplayBounds } = require('../displayBounds')
const { withInjectLock } = require('./injectLock')

const INJECT_PS1 = path.join(__dirname, '..', '..', 'scripts', 'inject.ps1')
const INJECT_TIMEOUT_MS = Number(process.env.INJECT_TIMEOUT_MS || 20000)
const DISPLAY_LIST_TIMEOUT_MS = Number(process.env.DISPLAY_LIST_TIMEOUT_MS || 5000)

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    }),
  ])
}

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
    const displays = await withTimeout(
      listDisplays(),
      DISPLAY_LIST_TIMEOUT_MS,
      'listDisplays',
    )
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

async function buildInjectScriptArgs(config, mode = 'inject', options = {}) {
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
  else if (mode === 'scroll') {
    args.push('-ScrollOnly')
    args.push('-DeltaY', String(options.deltaY ?? -240))
    args.push('-ScrollMode', String(options.scrollMode || 'wheel'))
    if (options.scrollYRatio != null) {
      args.push('-ScrollYRatio', String(options.scrollYRatio))
    }
  }
  if (options.minimizeOthers) args.push('-MinimizeOthers')
  return args
}

function runInjectScript(args) {
  if (process.platform !== 'win32') {
    throw new Error('focus/inject is Windows-only in v1')
  }
  const stdout = execFileSync('powershell', args, {
    windowsHide: true,
    timeout: INJECT_TIMEOUT_MS,
    encoding: 'utf8',
    killSignal: 'SIGTERM',
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
async function runPrepareFocus(config = {}, options = {}) {
  const minimizeOthers = options.minimizeOthers === true
  const args = await buildInjectScriptArgs(config, 'focus', { minimizeOthers })
  runInjectScript(args)
  return { ok: true, minimizeOthers }
}

async function prepareFocus(config = {}, options = {}) {
  return withInjectLock(() => runPrepareFocus(config, options))
}

/** @deprecated alias — use prepareFocus */
async function focusWindow(config = {}) {
  return prepareFocus(config, { minimizeOthers: false })
}

/** Write clipboard + focus + paste + Enter (Phase 1 message inject). */
async function injectMessage(text, config = {}, options = {}) {
  return withInjectLock(async () => {
    await clipboardy.write(text)
    const minimizeOthers = options.minimizeOthers === true
    const args = await buildInjectScriptArgs(config, 'inject', { minimizeOthers })
    runInjectScript(args)
    return { ok: true }
  })
}

module.exports = {
  buildInjectScriptArgs,
  runInjectScript,
  dryRunFocus,
  prepareFocus,
  focusWindow,
  injectMessage,
  withInjectLock,
  INJECT_TIMEOUT_MS,
}
