const { execSync } = require('child_process')

function decodeTitlesFromJson(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return []
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
    const script = [
      '@(Get-Process -Name Cursor -ErrorAction SilentlyContinue',
      '| Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle }',
      '| ForEach-Object { [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($_.MainWindowTitle)) }',
      '| Select-Object -Unique) | ConvertTo-Json -Compress',
    ].join(' ')
    const out = execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script}"`,
      {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 8000,
      },
    )
    return decodeTitlesFromJson(out)
  } catch {
    return []
  }
}

module.exports = { listCursorWindows }
