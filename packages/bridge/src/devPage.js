function renderDevHtml({ port }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>cursor_mobile — Dev 검증</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 16px; background: #111; color: #eee;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px;
      max-width: 720px; margin-inline: auto;
    }
    h1 { font-size: 1.1rem; font-family: -apple-system, sans-serif; }
    h2 { font-size: 0.95rem; margin: 24px 0 8px; color: #6eb6ff; font-family: -apple-system, sans-serif; }
    .row { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; }
    button, input, textarea {
      font: inherit; padding: 8px 12px; border-radius: 6px; border: 1px solid #444;
      background: #222; color: #eee;
    }
    button { cursor: pointer; background: #0066ff; border-color: #0066ff; color: #fff; }
    button.secondary { background: #333; border-color: #555; }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    textarea { width: 100%; min-height: 56px; }
    pre {
      background: #0a0a0a; padding: 12px; border-radius: 8px; overflow: auto;
      font-size: 11px; max-height: 200px; border: 1px solid #333;
    }
    .ok { color: #6ee7a0; }
    .fail { color: #f87171; }
    .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #333; color: #aaa; }
    .tag.live { background: #064e3b; color: #6ee7a0; }
    .tag.planned { background: #422006; color: #fbbf24; }
    img.stream { max-width: 100%; border: 1px solid #333; border-radius: 8px; margin-top: 8px; }
    a { color: #6eb6ff; }
    .note { color: #888; font-size: 12px; line-height: 1.5; font-family: -apple-system, sans-serif; }
  </style>
</head>
<body>
  <h1>Dev 검증 — WP별 스모크</h1>
  <p class="note">BRIDGE_DEV=1 일 때만 노출. <a href="/setup">/setup</a> · <a href="/">모바일 UI</a> · <a href="/health">/health</a></p>

  <h2>Phase 1 회귀 <span class="tag live">지금</span></h2>
  <div class="row">
    <button type="button" onclick="runRegression()">1~3 자동 실행</button>
  </div>
  <pre id="regression-log">(대기)</pre>

  <h2>인증 <span class="tag live">A2/A3</span></h2>
  <div class="row">
    <button type="button" onclick="fetchPairingCode()">pairing-code</button>
    <button type="button" onclick="pairAndStore()">pair → token 저장</button>
    <button type="button" onclick="checkSession()">session</button>
  </div>
  <pre id="auth-log">token: (없음)</pre>

  <h2>메시지 <span class="tag live">Phase 1</span></h2>
  <textarea id="msg-text" placeholder="테스트 메시지">dev smoke test</textarea>
  <div class="row">
    <button type="button" onclick="sendMessage()">POST /message</button>
  </div>
  <pre id="msg-log">(대기)</pre>

  <h2>스트림 <span class="tag live">Phase 1</span></h2>
  <div class="row">
    <button type="button" onclick="toggleStream()">스트림 ON/OFF</button>
  </div>
  <div id="stream-wrap"></div>

  <h2>Slice B — 집중 <span class="tag live">B1</span></h2>
  <div class="row">
    <button type="button" class="secondary" onclick="injectDryRun()">inject dry-run</button>
  </div>
  <pre id="focus-log">(대기 — 클릭·붙여넣기 없이 대상 창·좌표만 확인)</pre>

  <h2>Slice B — 집중 준비 <span class="tag planned">B2</span></h2>
  <div class="row">
    <button type="button" disabled title="WP-B2 구현 후 활성화">POST /focus/prepare</button>
  </div>

  <h2>Slice C — 스크롤 <span class="tag planned">C1</span></h2>
  <div class="row">
    <button type="button" disabled title="WP-C1 구현 후 활성화">scroll ↑</button>
    <button type="button" disabled title="WP-C1 구현 후 활성화">scroll ↓</button>
  </div>

  <h2>Slice D — 세션 <span class="tag planned">D1</span></h2>
  <div class="row">
    <button type="button" disabled title="WP-D1 구현 후 활성화">GET /sessions</button>
  </div>

  <h2>Slice E — 액션 <span class="tag planned">E1</span></h2>
  <div class="row">
    <button type="button" disabled title="WP-E1 구현 후 활성화">action: run</button>
    <button type="button" disabled title="WP-E1 구현 후 활성화">action: accept</button>
  </div>

  <script>
    const TOKEN_KEY = 'cursor_mobile_dev_token'
    let streamOn = false

    function token() { return localStorage.getItem(TOKEN_KEY) || '' }
    function authHeaders() {
      const t = token()
      return t ? { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
    }
    function log(id, text, ok) {
      const el = document.getElementById(id)
      const prefix = ok === true ? '[OK] ' : ok === false ? '[FAIL] ' : ''
      el.textContent = prefix + (typeof text === 'string' ? text : JSON.stringify(text, null, 2))
      el.className = ok === true ? 'ok' : ok === false ? 'fail' : ''
    }

    async function fetchPairingCode() {
      try {
        const res = await fetch('/auth/pairing-code')
        const data = await res.json()
        log('auth-log', data, res.ok)
      } catch (e) { log('auth-log', e.message, false) }
    }

    async function pairAndStore() {
      try {
        const codeRes = await fetch('/auth/pairing-code')
        const { code } = await codeRes.json()
        if (!code) { log('auth-log', '코드 없음 — /setup에서 새 코드 생성', false); return }
        const res = await fetch('/auth/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = await res.json()
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token)
          log('auth-log', 'token 저장됨 (' + data.token.slice(0, 12) + '…)', true)
        } else {
          log('auth-log', data, false)
        }
      } catch (e) { log('auth-log', e.message, false) }
    }

    async function checkSession() {
      try {
        const res = await fetch('/auth/session', { headers: authHeaders() })
        const data = await res.json()
        log('auth-log', { status: res.status, ...data }, res.ok)
      } catch (e) { log('auth-log', e.message, false) }
    }

    async function sendMessage() {
      const text = document.getElementById('msg-text').value
      try {
        const res = await fetch('/message', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ text }),
        })
        const data = await res.json()
        log('msg-log', { status: res.status, ...data }, res.ok)
      } catch (e) { log('msg-log', e.message, false) }
    }

    async function injectDryRun() {
      if (!token()) { log('focus-log', '먼저 pair → token 저장', false); return }
      try {
        const res = await fetch('/focus/dry-run', {
          method: 'POST',
          headers: authHeaders(),
          body: '{}',
        })
        const data = await res.json()
        log('focus-log', { status: res.status, ...data }, res.ok)
      } catch (e) { log('focus-log', e.message, false) }
    }

    function toggleStream() {
      streamOn = !streamOn
      const wrap = document.getElementById('stream-wrap')
      if (!streamOn) { wrap.innerHTML = ''; return }
      if (!token()) { log('msg-log', '먼저 pair → token 저장', false); streamOn = false; return }
      wrap.innerHTML = '<img class="stream" src="/stream?token=' + encodeURIComponent(token()) + '" alt="stream">'
    }

    async function runRegression() {
      const lines = []
      let ok = true
      try {
        const h = await fetch('/health')
        const hd = await h.json()
        lines.push('health: ' + h.status + ' ' + JSON.stringify(hd))
        if (!h.ok) ok = false

        const c = await fetch('/auth/pairing-code')
        const cd = await c.json()
        lines.push('pairing-code: ' + (cd.code || '(used)'))
        if (!cd.code) lines.push('  → pair 필요 — pair 버튼 사용')

        if (!token()) {
          lines.push('session: skip (no token)')
        } else {
          const s = await fetch('/auth/session', { headers: authHeaders() })
          lines.push('session: ' + s.status)
          if (!s.ok) ok = false
        }
      } catch (e) {
        lines.push('error: ' + e.message)
        ok = false
      }
      log('regression-log', lines.join('\\n'), ok)
    }

    if (token()) {
      log('auth-log', 'stored token: ' + token().slice(0, 16) + '…', true)
    }
  </script>
</body>
</html>`
}

module.exports = { renderDevHtml }
