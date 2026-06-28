const { execFileSync } = require('child_process')
const path = require('path')

const LIST_SCRIPT = path.join(__dirname, '..', 'scripts', 'list-cursor-windows.ps1')
const LIST_DETAIL_SCRIPT = path.join(
  __dirname,
  '..',
  'scripts',
  'list-cursor-windows-detail.ps1',
)

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

function listCursorWindowsDetailed() {
  if (process.platform !== 'win32') return []
  try {
    const out = execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', LIST_DETAIL_SCRIPT],
      {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 15000,
      },
    )
    const trimmed = out.trim()
    if (!trimmed || trimmed === '[]') return []
    const parsed = JSON.parse(trimmed)
    const items = Array.isArray(parsed) ? parsed : [parsed]
    return items
      .map((item) => {
        try {
          const title = Buffer.from(String(item.titleB64 || ''), 'base64')
            .toString('utf8')
            .trim()
          if (!title) return null
          return {
            title,
            left: Number(item.left) || 0,
            top: Number(item.top) || 0,
            right: Number(item.right) || 0,
            bottom: Number(item.bottom) || 0,
          }
        } catch {
          return null
        }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

module.exports = { listCursorWindows, listCursorWindowsDetailed }
