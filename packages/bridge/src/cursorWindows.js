const { execFileSync } = require('child_process')
const path = require('path')

const LIST_SCRIPT = path.join(__dirname, '..', 'scripts', 'list-cursor-windows.ps1')

function decodeTitlesFromJson(raw) {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '[]') return []
  const parsed = JSON.parse(trimmed)
  const items = typeof parsed === 'string' ? [parsed] : Array.isArray(parsed) ? parsed : []
  return items
    .map((b64) => {
      try {
        return Buffer.from(String(b64), 'base64').toString('utf8').trim()
      } catch {
        return ''
      }
    })
    .filter(Boolean)
}

function listCursorWindows() {
  if (process.platform !== 'win32') return []
  try {
    const out = execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', LIST_SCRIPT],
      {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 15000,
      },
    )
    return decodeTitlesFromJson(out)
  } catch {
    return []
  }
}

module.exports = { listCursorWindows }
