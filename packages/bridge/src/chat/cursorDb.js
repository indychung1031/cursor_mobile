const { getStateDbPath, dbExists } = require('./paths')

let DatabaseSync
try {
  ;({ DatabaseSync } = require('node:sqlite'))
} catch {
  DatabaseSync = null
}

const DEFAULT_TAIL = 80
const DEFAULT_SESSION_LIMIT = 50
const MAX_MESSAGES = 500

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

function parseLimit(raw, fallback, max) {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(Math.floor(n), max)
}

function rowToMessage(row) {
  const msg = parseJsonValue(row.value)
  if (!msg || typeof msg.text !== 'string') return null
  const text = msg.text.trim()
  if (!text) return null
  const type = Number(msg.type)
  const role = type === 1 ? 'user' : type === 2 ? 'assistant' : 'unknown'
  const parts = String(row.key).split(':')
  const bubbleId = parts.length >= 3 ? parts.slice(2).join(':') : row.key
  const createdAt = msg.createdAt || msg.timestamp || null
  return {
    id: bubbleId,
    role,
    type,
    text,
    createdAt,
  }
}

/** @returns {{ composerId: string, name: string, updatedAt?: string }[]} */
function listComposers(options = {}) {
  const limit = parseLimit(options.limit, DEFAULT_SESSION_LIMIT, 200)
  const db = openReadonly()
  try {
    const row = db
      .prepare("SELECT value FROM ItemTable WHERE key = 'composer.composerHeaders' LIMIT 1")
      .get()
    const data = parseJsonValue(row?.value)
    const all = data?.allComposers || data?.composers || []
    if (!Array.isArray(all)) return []

    const composers = all
      .map((c) => ({
        composerId: String(c.composerId || c.id || ''),
        name: String(c.name || c.title || '(제목 없음)').trim() || '(제목 없음)',
        updatedAt: c.updatedAt || c.lastUpdatedAt || c.createdAt || null,
      }))
      .filter((c) => c.composerId)

    composers.sort((a, b) => {
      if (a.updatedAt && b.updatedAt) {
        return String(b.updatedAt).localeCompare(String(a.updatedAt))
      }
      return String(b.composerId).localeCompare(String(a.composerId))
    })

    return composers.slice(0, limit)
  } finally {
    db.close()
  }
}

function getComposerById(composerId) {
  const id = String(composerId || '').trim()
  if (!id) return null
  return listComposers({ limit: 200 }).find((c) => c.composerId === id) || null
}

/**
 * @param {string} composerId
 * @param {{ since?: string, limit?: number, tail?: number }} options
 */
function listMessages(composerId, options = {}) {
  const id = String(composerId || '').trim()
  if (!id) throw new Error('composerId required')

  const since = options.since ? String(options.since).trim() : ''
  const tail = parseLimit(options.tail, 0, MAX_MESSAGES)
  const limit = parseLimit(options.limit, tail || DEFAULT_TAIL, MAX_MESSAGES)

  const db = openReadonly()
  try {
    const rows = db
      .prepare('SELECT key, value FROM cursorDiskKV WHERE key LIKE ? ORDER BY key')
      .all(`bubbleId:${id}:%`)

    let messages = []
    for (const row of rows) {
      const m = rowToMessage(row)
      if (m) messages.push(m)
    }

    messages.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return String(a.createdAt).localeCompare(String(b.createdAt))
      }
      return String(a.id).localeCompare(String(b.id))
    })

    if (since) {
      messages = messages.filter((m) => m.createdAt && String(m.createdAt) > since)
      if (limit) messages = messages.slice(0, limit)
    } else if (tail > 0) {
      messages = messages.slice(-tail)
    } else if (limit) {
      messages = messages.slice(-limit)
    }

    return messages
  } finally {
    db.close()
  }
}

function getChatHealth() {
  return {
    dbExists: dbExists(),
    sqliteAvailable: Boolean(DatabaseSync),
    sqliteEngine: 'node:sqlite',
  }
}

module.exports = {
  listComposers,
  listMessages,
  getComposerById,
  getChatHealth,
  openReadonly,
  DEFAULT_TAIL,
  DEFAULT_SESSION_LIMIT,
}
