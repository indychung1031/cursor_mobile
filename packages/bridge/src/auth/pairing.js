const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')

const SECRET_PATH = path.join(__dirname, '..', '..', '.bridge-secret')
const LEGACY_SECRET_PATH = path.join(__dirname, '..', '.bridge-secret')
let pairingCode = null

function loadSecret() {
  if (!fs.existsSync(SECRET_PATH) && fs.existsSync(LEGACY_SECRET_PATH)) {
    fs.copyFileSync(LEGACY_SECRET_PATH, SECRET_PATH)
  }
  try {
    const raw = fs.readFileSync(SECRET_PATH, 'utf8').trim()
    if (raw.length >= 32) return raw
  } catch {
    /* create on first run */
  }
  const secret = crypto.randomBytes(32).toString('hex')
  fs.writeFileSync(SECRET_PATH, secret, 'utf8')
  return secret
}

const SECRET = loadSecret()
const COOKIE_NAME = 'cm_token'
const COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60

function setAuthCookie(reply, token) {
  reply.setCookie(COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_SEC,
    secure: false,
  })
}

function clearAuthCookie(reply) {
  reply.clearCookie(COOKIE_NAME, { path: '/' })
}

function generatePairingCode() {
  pairingCode = Math.floor(100000 + Math.random() * 900000).toString()
  console.log(`\n=== Pairing Code: ${pairingCode} ===`)
  console.log(`=== PC 브라우저: http://localhost:${process.env.BRIDGE_PORT || 3921}/setup ===\n`)
  return pairingCode
}

function getPairingCode() {
  return pairingCode
}

function regeneratePairingCode() {
  return generatePairingCode()
}

function verifyPairingCode(code) {
  if (!pairingCode || code !== pairingCode) return false
  pairingCode = null
  return true
}

function signToken() {
  return jwt.sign({ paired: true }, SECRET, { expiresIn: '30d' })
}

function verifyToken(token) {
  if (!token) return false
  try {
    jwt.verify(token, SECRET)
    return true
  } catch {
    return false
  }
}

function extractToken(request) {
  const auth = request.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7)
  }
  if (request.cookies?.[COOKIE_NAME]) {
    return request.cookies[COOKIE_NAME]
  }
  return request.query?.token || null
}

async function requireAuth(request, reply) {
  const token = extractToken(request)
  if (!verifyToken(token)) {
    return reply.code(401).send({ error: 'unauthorized' })
  }
}

module.exports = {
  generatePairingCode,
  getPairingCode,
  regeneratePairingCode,
  verifyPairingCode,
  signToken,
  verifyToken,
  extractToken,
  requireAuth,
  setAuthCookie,
  clearAuthCookie,
  COOKIE_NAME,
}
