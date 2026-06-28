const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.join(__dirname, '..', 'config.json')
const EXAMPLE_PATH = path.join(__dirname, '..', 'config.example.json')

function getConfigPath() {
  return fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : EXAMPLE_PATH
}

function loadConfig() {
  const raw = fs.readFileSync(getConfigPath(), 'utf8')
  return JSON.parse(raw)
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8')
}

module.exports = { loadConfig, saveConfig, getConfigPath, CONFIG_PATH, EXAMPLE_PATH }
