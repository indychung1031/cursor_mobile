const { execSync } = require('child_process')

function isCursorRunning() {
  if (process.platform !== 'win32') {
    return false
  }
  try {
    const out = execSync('tasklist /FI "IMAGENAME eq Cursor.exe" /NH', {
      encoding: 'utf8',
      windowsHide: true,
    })
    return /Cursor\.exe/i.test(out)
  } catch {
    return false
  }
}

module.exports = { isCursorRunning }
