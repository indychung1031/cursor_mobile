const { getStateDbPath, dbExists } = require('./paths')

let DatabaseSync
try {
  ;({ DatabaseSync } = require('node:sqlite'))
} catch {
  DatabaseSync = null
}

function openReadonly() {
  if (!DatabaseSync) {
    throw new Error('node:sqlite unavailable — Node 22+ required')
  }
  if (!dbExists()) {
    throw new Error('Cursor state.vscdb not found — is Cursor installed?')
  }
  return new DatabaseSync(getStateDbPath(), { readOnly: true })
}

function parseJsonValue(raw) {
  if (raw == null) return null
  const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw)
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** @returns {{ composerId: string, name: string, updatedAt?: string }[]} */
function listComposers() {
  const db = openReadonly()
  try {
    const row = db
      .prepare("SELECT value FROM ItemTable WHERE key = 'composer.composerHeaders' LIMIT 1")
      .get()
    const data = parseJsonValue(row?.value)
    const all = data?.allComposers || data?.composers || []
    if (!Array.isArray(all)) return []
    return all
      .map((c) => ({
        composerId: String(c.composerId || c.id || ''),
        name: String(c.name || c.title || '(제목 없음)').trim() || '(제목 없음)',
        updatedAt: c.updatedAt || c.lastUpdatedAt || null,
      }))
      .filter((c) => c.composerId)
  } finally {
    db.close()
  }
}

/** @returns {{ id: string, role: string, type: number, text: string, createdAt: string|null }[]} */
function listMessages(composerId) {
  const id = String(composerId || '').trim()
  if (!id) throw new Error('composerId required')

  const db = openReadonly()
  try {
    const rows = db
      .prepare('SELECT key, value FROM cursorDiskKV WHERE key LIKE ? ORDER BY key')
      .all(`bubbleId:${id}:%`)

    const messages = []
    for (const row of rows) {
      const msg = parseJsonValue(row.value)
      if (!msg || typeof msg.text !== 'string') continue
      const type = Number(msg.type)
      const role = type === 1 ? 'user' : type === 2 ? 'assistant' : 'unknown'
      const parts = String(row.key).split(':')
      const bubbleId = parts.length >= 3 ? parts.slice(2).join(':') : row.key
      messages.push({
        id: bubbleId,
        role,
        type,
        text: msg.text,
        createdAt: msg.createdAt || msg.timestamp || null,
      })
    }

    messages.sort((a, b) => {
      if (a.createdAt && b.createdAt) return String(a.createdAt).localeCompare(String(b.createdAt))
      return String(a.id).localeCompare(String(b.id))
    })
    return messages
  } finally {
    db.close()
  }
}

function getChatHealth() {
  return {
    dbPath: getStateDbPath(),
    dbExists: dbExists(),
    sqliteAvailable: Boolean(DatabaseSync),
    sqliteEngine: 'node:sqlite',
  }
}

module.exports = {
  listComposers,
  listMessages,
  getChatHealth,
  openReadonly,
}
