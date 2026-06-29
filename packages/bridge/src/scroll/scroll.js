const { buildInjectScriptArgs, runInjectScript, withInjectLock } = require('../focus/focus')

const SCROLL_MODES = new Set(['wheel', 'page', 'home', 'end'])

/**
 * Scroll the Cursor Agent panel via wheel or keyboard.
 * @param {number} deltaY negative = up, positive = down (ignored for home/end)
 * @param {object} config bridge config
 * @param {{ mode?: string, scrollYRatio?: number }} options
 */
async function injectScroll(deltaY, config = {}, options = {}) {
  return withInjectLock(async () => {
    const mode = String(options.mode || 'wheel')
    if (!SCROLL_MODES.has(mode)) {
      throw new Error(`invalid scroll mode: ${mode}`)
    }
    const args = await buildInjectScriptArgs(config, 'scroll', {
      deltaY,
      scrollMode: mode,
      scrollYRatio: options.scrollYRatio,
    })
    runInjectScript(args)
    return { ok: true, deltaY, mode }
  })
}

module.exports = { injectScroll, SCROLL_MODES }
