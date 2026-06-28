const { execSync } = require('child_process')

function listCursorWindows() {
  if (process.platform !== 'win32') return []
  try {
    const script =
      "Get-Process -Name Cursor -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle } | ForEach-Object { $_.MainWindowTitle }"
    const out = execSync(`powershell -NoProfile -Command "${script}"`, {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 8000,
    })
    return out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

module.exports = { listCursorWindows }
