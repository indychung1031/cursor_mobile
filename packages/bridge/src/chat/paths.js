const fs = require('fs')
const path = require('path')
const os = require('os')

function getCursorGlobalStorageDir() {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'Cursor', 'User', 'globalStorage')
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage')
  }
  return path.join(os.homedir(), '.config', 'Cursor', 'User', 'globalStorage')
}

function getStateDbPath() {
  return path.join(getCursorGlobalStorageDir(), 'state.vscdb')
}

function dbExists() {
  return fs.existsSync(getStateDbPath())
}

module.exports = { getCursorGlobalStorageDir, getStateDbPath, dbExists }
