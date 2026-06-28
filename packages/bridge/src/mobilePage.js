function renderMobileHtml() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <title>cursor_mobile</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; background: #000; color: #f0f0f0;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex; flex-direction: column; height: 100dvh;
    }
    #pair-screen, #app { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    #pair-screen {
      justify-content: center; align-items: center; padding: 24px;
    }
    .card {
      background: #1a1a1a; border-radius: 16px; padding: 24px;
      border: 1px solid #333; max-width: 360px; width: 100%;
    }
    h1 { font-size: 1.1rem; margin: 0 0 16px; }
    input, select, button {
      width: 100%; padding: 12px; font-size: 16px; border-radius: 8px;
      border: none; margin-bottom: 10px;
    }
    input, select { background: #2a2a2a; color: #fff; }
    button.primary { background: #0066ff; color: #fff; font-weight: 600; }
    button.secondary { background: #333; color: #eee; font-weight: 500; }
    button:disabled { opacity: 0.5; }
    .btn-row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; width: 100%; }
    .btn-row button { width: auto; min-width: 120px; margin: 0; flex: 1; max-width: 160px; }
    #toolbar {
      display: flex; gap: 8px; padding: 8px 10px; background: #111;
      align-items: center; flex-shrink: 0;
    }
    #toolbar-label {
      font-size: 0.8rem; color: #aaa; white-space: nowrap; flex-shrink: 0;
    }
    #display-select { flex: 1; margin: 0; min-width: 0; font-size: 15px; }
    #focus-toggle-wrap {
      display: flex; align-items: center; gap: 4px; font-size: 0.8rem;
      color: #aaa; white-space: nowrap; flex-shrink: 0; cursor: pointer;
      user-select: none;
    }
    #focus-toggle { width: auto; margin: 0; padding: 0; accent-color: #0066ff; }
    #status-dot {
      width: 10px; height: 10px; border-radius: 50%; background: #6ee7a0; flex-shrink: 0;
    }
    #stream-wrap {
      flex: 1; min-height: 0; display: flex; align-items: center;
      justify-content: center; background: #0a0a0a; overflow: hidden;
      position: relative;
    }
    #stream-overlay {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 12px; padding: 24px;
      background: rgba(0,0,0,0.85); text-align: center;
    }
    #stream-overlay.hidden { display: none !important; }
    #stream-overlay p { margin: 0; color: #ccc; font-size: 0.9rem; line-height: 1.5; }
    #stream {
      max-width: 100%; max-height: 100%; width: 100%; object-fit: contain;
    }
    #input-area {
      display: flex; gap: 8px; padding: 10px; background: #1a1a1a;
      flex-shrink: 0; padding-bottom: max(10px, env(safe-area-inset-bottom));
      position: relative;
    }
    #msg { flex: 1; margin: 0; }
    #send { width: auto; min-width: 72px; margin: 0; }
    #send-status { font-size: 0.8rem; min-height: 1.2em; padding: 0 10px 4px; }
    #send-status.err { color: #f87171; }
    #send-status.ok { color: #6ee7a0; }
    .hint { font-size: 0.8rem; color: #888; margin-top: 8px; line-height: 1.4; }
    .error { color: #f87171; font-size: 0.85rem; min-height: 1.2em; }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div id="pair-screen">
    <div class="card">
      <h1>cursor_mobile 연결</h1>
      <p class="hint" id="pair-hint">PC <strong>/setup</strong>에서 QR을 스캔하거나 6자리 코드를 입력하세요.<br>Bridge 재시작 직후에도 코드·QR만 있으면 다시 연결할 수 있습니다.</p>
      <input id="pair-code" type="tel" inputmode="numeric" maxlength="6" placeholder="123456" autocomplete="one-time-code" />
      <div id="pair-error" class="error"></div>
      <button id="pair-btn" type="button" class="primary">연결</button>
    </div>
  </div>

  <div id="app" class="hidden">
    <div id="toolbar">
      <div id="status-dot"></div>
      <span id="toolbar-label">모니터</span>
      <select id="display-select" aria-label="캡처할 모니터 선택"></select>
      <label id="focus-toggle-wrap" for="focus-toggle" title="ON: 전송 전 Cursor 포커스 (다른 창은 유지)">
        <input type="checkbox" id="focus-toggle" aria-label="집중 모드" />
        집중
      </label>
    </div>
    <div id="stream-wrap">
      <img id="stream" alt="Cursor Agent">
      <div id="stream-overlay" class="hidden">
        <p id="stream-overlay-msg">영상 연결이 끊겼습니다.</p>
        <div class="btn-row">
          <button type="button" id="retry-stream-btn" class="primary">재연결</button>
          <button type="button" id="force-repair-btn" class="secondary">새 코드로 연결</button>
        </div>
      </div>
    </div>
    <div id="input-area">
      <input id="msg" type="text" placeholder="메시지 입력..." enterkeyhint="send" />
      <button id="send" type="button" class="primary">전송</button>
    </div>
    <div id="send-status"></div>
    <p class="hint" style="padding:0 10px 8px;margin:0;">전송 시 PC 클립보드가 덮어씌워집니다. 선택한 <strong>모니터</strong>에 있는 Cursor 창으로 입력됩니다.</p>
  </div>

  <script>
    const getToken = () => localStorage.getItem('cm_token') || ''
    const headers = (json) => {
      const h = { Authorization: 'Bearer ' + getToken() }
      if (json) h['Content-Type'] = 'application/json'
      return h
    }

    const FOCUS_KEY = 'cm_focus_mode'
    let streamAutoRetries = 0
    const MAX_STREAM_AUTO_RETRIES = 2
    let sessionPollTimer = null

    function setStatusDot(color) {
      document.getElementById('status-dot').style.background = color
    }

    function showPairScreen(msg) {
      document.getElementById('app').classList.add('hidden')
      document.getElementById('pair-screen').classList.remove('hidden')
      document.getElementById('stream').removeAttribute('src')
      document.getElementById('pair-code').value = ''
      if (msg) document.getElementById('pair-error').textContent = msg
      stopSessionPoll()
    }

    function showStreamOverlay(msg) {
      document.getElementById('stream-overlay-msg').textContent = msg
      document.getElementById('stream-overlay').classList.remove('hidden')
      setStatusDot('#f87171')
    }

    function hideStreamOverlay() {
      document.getElementById('stream-overlay').classList.add('hidden')
      setStatusDot('#6ee7a0')
    }

    function showApp() {
      document.getElementById('pair-screen').classList.add('hidden')
      document.getElementById('app').classList.remove('hidden')
      hideStreamOverlay()
      streamAutoRetries = 0
      loadFocusMode()
      refreshStream()
      loadDisplays()
      startSessionPoll()
    }

    function refreshStream() {
      setStatusDot('#fbbf24')
      document.getElementById('stream').src =
        '/stream?token=' + encodeURIComponent(getToken()) + '&t=' + Date.now()
    }

    function handleUnauthorized(msg) {
      localStorage.removeItem('cm_token')
      showPairScreen(msg || '인증이 만료되었습니다. PC /setup에서 새 코드 또는 QR로 연결하세요.')
    }

    function forceRePair() {
      localStorage.removeItem('cm_token')
      showPairScreen('PC /setup에서 QR을 스캔하거나 새 코드를 입력하세요.')
    }

    /** @returns {Promise<true|false|null>} ok / unauthorized / network */
    async function checkSession() {
      if (!getToken()) return false
      try {
        const res = await fetch('/auth/session', { headers: headers() })
        if (res.ok) return true
        if (res.status === 401) {
          localStorage.removeItem('cm_token')
          return false
        }
        return null
      } catch (_) {
        return null
      }
    }

    async function retryStream() {
      if (!getToken()) {
        showPairScreen('PC /setup에서 QR 또는 코드로 연결하세요.')
        return
      }
      showStreamOverlay('재연결 중…')
      const session = await checkSession()
      if (session === false) {
        handleUnauthorized('연결이 만료되었습니다. PC /setup에서 새 코드 또는 QR로 연결하세요.')
        return
      }
      if (session === null) {
        showStreamOverlay('Bridge에 연결할 수 없습니다. PC에서 Bridge가 실행 중인지 확인한 뒤 「재연결」을 누르세요.')
        return
      }
      streamAutoRetries = 0
      refreshStream()
      hideStreamOverlay()
    }

    async function onStreamLost() {
      if (!getToken()) {
        showPairScreen('연결이 끊겼습니다. PC /setup에서 다시 연결하세요.')
        return
      }
      const session = await checkSession()
      if (session === false) {
        handleUnauthorized('연결이 만료되었습니다. PC /setup에서 새 코드 또는 QR로 연결하세요.')
        return
      }
      if (session === true && streamAutoRetries < MAX_STREAM_AUTO_RETRIES) {
        streamAutoRetries++
        setStatusDot('#fbbf24')
        setTimeout(refreshStream, 800 * streamAutoRetries)
        return
      }
      showStreamOverlay(
        '영상 연결이 끊겼습니다. Bridge 재시작 직후면 「재연결」을 눌러 보세요. 안 되면 PC /setup에서 새 QR을 스캔하세요.',
      )
    }

    document.getElementById('stream').addEventListener('error', onStreamLost)

    async function doPair() {
      const code = document.getElementById('pair-code').value.trim()
      const errEl = document.getElementById('pair-error')
      errEl.textContent = ''
      if (!code) { errEl.textContent = '코드를 입력하세요.'; return }
      const btn = document.getElementById('pair-btn')
      btn.disabled = true
      errEl.textContent = '연결 중…'
      try {
        const res = await fetch('/auth/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          errEl.textContent =
            res.status === 401
              ? '코드가 만료되었거나 잘못되었습니다. PC /setup에서 「새 코드 생성」 후 다시 시도하세요.'
              : (data.error || '연결 실패 (' + res.status + ')')
          return
        }
        localStorage.setItem('cm_token', data.token)
        errEl.textContent = ''
        showApp()
      } catch (_) {
        errEl.textContent = 'Bridge에 연결할 수 없습니다. PC·Tailscale·Bridge 실행을 확인하세요.'
      } finally {
        btn.disabled = false
        if (errEl.textContent === '연결 중…') errEl.textContent = ''
      }
    }

    async function loadDisplays() {
      try {
        const res = await fetch('/displays', { headers: headers() })
        if (res.status === 401) { handleUnauthorized(); return }
        if (!res.ok) return
        const { displays, selectedDisplay } = await res.json()
        const sel = document.getElementById('display-select')
        if (!displays || !displays.length) {
          sel.innerHTML = '<option value="">(모니터 없음)</option>'
          return
        }
        sel.innerHTML = displays.map(function (d) {
          const label = d.name || ('모니터 ' + (d.id + 1))
          return '<option value="' + String(d.id).replace(/"/g, '&quot;') + '">' + label + '</option>'
        }).join('')
        const current = selectedDisplay
        const match = displays.find(function (d, i) {
          return d.id === current || String(d.id) === String(current) || i === current
        })
        if (match) sel.value = match.id
        else if (typeof current === 'number' && displays[current]) sel.value = displays[current].id
      } catch (_) {}
    }

    async function switchDisplay(displayId) {
      try {
        const res = await fetch('/config/display', {
          method: 'POST',
          headers: headers(true),
          body: JSON.stringify({ displayId }),
        })
        if (res.status === 401) { handleUnauthorized(); return }
        refreshStream()
      } catch (_) {}
    }

    function isFocusModeOn() {
      return document.getElementById('focus-toggle').checked
    }

    function loadFocusMode() {
      const el = document.getElementById('focus-toggle')
      el.checked = localStorage.getItem(FOCUS_KEY) === '1'
    }

    function saveFocusMode() {
      localStorage.setItem(FOCUS_KEY, isFocusModeOn() ? '1' : '0')
    }

    async function sendMsg() {
      const text = document.getElementById('msg').value.trim()
      if (!text) return
      const btn = document.getElementById('send')
      const status = document.getElementById('send-status')
      status.className = ''
      status.textContent = '전송 중…'
      btn.disabled = true
      try {
        if (isFocusModeOn()) {
          const prep = await fetch('/focus/prepare', {
            method: 'POST',
            headers: headers(true),
            body: JSON.stringify({ minimizeOthers: false }),
          })
          if (prep.status === 401) {
            handleUnauthorized('인증이 만료되었습니다. PC /setup에서 다시 연결하세요.')
            return
          }
          if (!prep.ok) {
            const prepData = await prep.json().catch(() => ({}))
            status.className = 'err'
            status.textContent = prepData.error || ('집중 준비 실패 (' + prep.status + ')')
            return
          }
        }
        const res = await fetch('/message', {
          method: 'POST',
          headers: headers(true),
          body: JSON.stringify({ text }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          document.getElementById('msg').value = ''
          status.className = 'ok'
          status.textContent = '전송됨'
          setTimeout(() => { if (status.textContent === '전송됨') status.textContent = '' }, 2000)
        } else if (res.status === 401) {
          handleUnauthorized('인증이 만료되었습니다. PC /setup에서 다시 연결하세요.')
        } else {
          status.className = 'err'
          status.textContent = data.error || ('전송 실패 (' + res.status + ')')
        }
      } catch (_) {
        status.className = 'err'
        status.textContent = '네트워크 오류 — Bridge 실행·Tailscale을 확인하세요.'
      } finally {
        btn.disabled = false
      }
    }

    document.getElementById('msg').addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMsg()
    })

    document.getElementById('pair-code').addEventListener('keydown', e => {
      if (e.key === 'Enter') doPair()
    })

    async function tryResume() {
      if (!getToken()) return
      const session = await checkSession()
      if (session === true) {
        showApp()
        return
      }
      if (session === false) {
        showPairScreen('연결이 만료되었습니다. PC /setup에서 코드 또는 QR로 다시 연결하세요.')
        return
      }
      showPairScreen('Bridge에 연결할 수 없습니다. PC에서 Bridge가 실행 중인지 확인하세요.')
    }

    function startSessionPoll() {
      stopSessionPoll()
      sessionPollTimer = setInterval(async () => {
        if (document.getElementById('app').classList.contains('hidden')) return
        const session = await checkSession()
        if (session === false) {
          handleUnauthorized('연결이 만료되었습니다. PC /setup에서 다시 연결하세요.')
        }
      }, 30000)
    }

    function stopSessionPoll() {
      if (sessionPollTimer) {
        clearInterval(sessionPollTimer)
        sessionPollTimer = null
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return
      if (!getToken() || document.getElementById('app').classList.contains('hidden')) return
      checkSession().then(session => {
        if (session === false) {
          handleUnauthorized()
          return
        }
        if (session === true && !document.getElementById('stream-overlay').classList.contains('hidden')) {
          retryStream()
        }
      })
    })

    function absorbPairToken() {
      const params = new URLSearchParams(location.search)
      let t = params.get('cm_token')
      if (!t && location.hash.startsWith('#cm=')) {
        t = decodeURIComponent(location.hash.slice(4))
      }
      if (!t) return false
      try { localStorage.setItem('cm_token', t) } catch (_) {}
      history.replaceState({}, '', '/')
      return true
    }

    function wireUi() {
      document.getElementById('pair-btn').addEventListener('click', doPair)
      document.getElementById('display-select').addEventListener('change', function () {
        switchDisplay(this.value)
      })
      document.getElementById('retry-stream-btn').addEventListener('click', retryStream)
      document.getElementById('force-repair-btn').addEventListener('click', forceRePair)
      document.getElementById('send').addEventListener('click', sendMsg)
      document.getElementById('focus-toggle').addEventListener('change', saveFocusMode)
    }

    async function boot() {
      absorbPairToken()
      const params = new URLSearchParams(location.search)
      const pairErr = params.get('pair_error')
      if (pairErr) {
        const msg = pairErr === 'invalid'
          ? '코드가 만료되었거나 잘못되었습니다. PC /setup에서 「새 코드 생성」 후 QR 또는 코드로 연결하세요.'
          : '연결에 실패했습니다.'
        showPairScreen(msg)
        history.replaceState({}, '', '/')
        return
      }
      if (getToken()) {
        await tryResume()
      }
    }

    wireUi()
    boot()
  </script>
</body>
</html>`
}

module.exports = { renderMobileHtml }
