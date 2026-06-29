const crypto = require('crypto')

const setupToken = crypto.randomBytes(24).toString('hex')

function getSetupToken() {
  return setupToken
}

function extractSetupToken(request) {
  return String(request.headers['x-setup-token'] || '').trim()
}

async function requireSetupToken(request, reply) {
  if (extractSetupToken(request) !== setupToken) {
    return reply.code(403).send({ error: 'setup token required' })
  }
}

async function requireSetupOrAuth(request, reply) {
  if (extractSetupToken(request) === setupToken) return
  const { extractToken, verifyToken } = require('./pairing')
  if (verifyToken(extractToken(request))) return
  return reply.code(403).send({ error: 'forbidden' })
}

function isLocalhost(request) {
  const ip = request.ip || ''
  return (
    ip === '127.0.0.1'
    || ip === '::1'
    || ip === '::ffff:127.0.0.1'
    || ip.endsWith('127.0.0.1')
  )
}

async function requireLocalhost(request, reply) {
  if (!isLocalhost(request)) {
    return reply.code(403).send({ error: 'localhost only' })
  }
}

async function requireLocalhostOrSetup(request, reply) {
  if (isLocalhost(request)) return
  if (extractSetupToken(request) === setupToken) return
  return reply.code(403).send({ error: 'forbidden' })
}

module.exports = {
  getSetupToken,
  extractSetupToken,
  requireSetupToken,
  requireSetupOrAuth,
  requireLocalhost,
  requireLocalhostOrSetup,
}
