const fs = require('fs')
const path = require('path')

const ROOT_ENV = path.join(__dirname, '..', '..', '..', '.env')
const LOCAL_ENV = path.join(__dirname, '..', '.env')

function getEnvPath() {
  if (fs.existsSync(ROOT_ENV)) return ROOT_ENV
  if (fs.existsSync(LOCAL_ENV)) return LOCAL_ENV
  return null
}

function loadEnv() {
  const dotenv = require('dotenv')
  const envPath = getEnvPath()
  if (envPath) {
    dotenv.config({ path: envPath })
    return envPath
  }
  dotenv.config()
  return null
}

function getTailscaleIp() {
  const ip = (process.env.TAILSCALE_IP || '').trim()
  return ip || null
}

function getBridgeUrls(port) {
  const local = `http://localhost:${port}/health`
  const ip = getTailscaleIp()
  const tailscale = ip ? `http://${ip}:${port}/health` : null
  return { local, tailscale }
}

module.exports = { loadEnv, getEnvPath, getTailscaleIp, getBridgeUrls, ROOT_ENV }
