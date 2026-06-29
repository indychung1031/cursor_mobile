function renderChatHtml() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <title>cursor_mobile · Chat</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; background: #0d0d0d; color: #f0f0f0;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex; flex-direction: column; height: 100dvh;
    }
    #pair-screen, #app { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    #pair-screen { justify-content: center; align-items: center; padding: 24px; }
    .card {
      background: #1a1a1a; border-radius: 16px; padding: 24px;
      border: 1px solid #333; max-width: 360px; width: 100%;
    }
    h1 { font-size: 1.05rem; margin: 0 0 8px; }
    .sub { font-size: 0.8rem; color: #888; margin: 0 0 16px; line-height: 1.4; }
    input, select, button, textarea {
      width: 100%; padding: 12px; font-size: 16px; border-radius: 8px;
      border: none; margin-bottom: 10px;
    }
    input, select, textarea { background: #2a2a2a; color: #fff; }
    textarea { resize: none; min-height: 44px; max-height: 120px; }
    button.primary { background: #0066ff; color: #fff; font-weight: 600; }
    button.secondary { background: #333; color: #eee; }
    button:disabled { opacity: 0.5; }
    #toolbar {
      display: flex; gap: 8px; padding: 8px 10px; background: #111;
      align-items: center; flex-shrink: 0; border-bottom: 1px solid #222;
    }
    #toolbar h1 { margin: 0; font-size: 0.9rem; flex: 1; }
    #session-select { flex: 1; margin: 0; min-width: 0; font-size: 15px; }
    #mode-badge {
      font-size: 0.65rem; padding: 2px 6px; border-radius: 4px;
      background: #1e3a5f; color: #93c5fd; flex-shrink: 0;
    }
    #messages {
      flex: 1; overflow-y: auto; padding: 12px; display: flex;
      flex-direction: column; gap: 10px; min-height: 0;
    }
    .bubble {
      max-width: 88%; padding: 10px 12px; border-radius: 14px;
      font-size: 0.92rem; line-height: 1.45; white-space: pre-wrap; word-break: break-word;
    }
    .bubble.user { align-self: flex-end; background: #0066ff; color: #fff; border-bottom-right-radius: 4px; }
    .bubble.assistant { align-self: flex-start; background: #222; color: #eee; border-bottom-left-radius: 4px; }
    .bubble.unknown { align-self: center; background: #2a2a2a; color: #aaa; font-size: 0.8rem; }
    #status-bar {
      padding: 4px 12px; font-size: 0.72rem; color: #666; text-align: center;
      flex-shrink: 0;
    }
    #input-row {
      display: flex; gap: 8px; padding: 8px 10px 12px; background: #111;
      border-top: 1px solid #222; flex-shrink: 0; align-items: flex-end;
    }
    #input-row textarea { flex: 1; margin: 0; }
    #input-row button { width: auto; min-width: 64px; margin: 0; }
    .err { color: #f87171; font-size: 0.85rem; min-height: 1.2em; }
    .ok { color: #6ee7a0; font-size: 0.85rem; }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div id="pair-screen">
    <div class="card">
      <h1>cursor_mobile · Chat (C모드)</h1>
      <p class="sub">PC /setup의 페어링 코드를 입력하세요. B모드(/)와 동일한 토큰을 사용합니다.</p>
      <input id="pair-code" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="6자리 코드" maxlength="6">
      <button type="button" class="primary" id="pair-btn">연결</button>
      <p id="pair-error" class="err"></p>
    </div>
  </div>
  <div id="app" class="hidden">
    <div id="toolbar">
      <span id="mode-badge">C</span>
      <select id="session-select"><option value="">세션 불러오는 중…</option></select>
    </div>
    <div id="messages"></div>
    <div id="status-bar">폴링 대기</div>
    <div id="input-row">
      <textarea id="msg" rows="1" placeholder="Cursor Agent에 보낼 메시지"></textarea>
      <button type="button" class="primary" id="send">전송</button>
    </div>
    <p id="send-status" style="margin:0;padding:0 12px 8px;font-size:0.8rem"></p>
  </div>
  <script>
    const SESSION_KEY = 'cm_chat_composerId'
    const POLL_MS = 2500
    let pollTimer = null

    const getToken = () => localStorage.getItem('cm_token') || ''
    const headers = (json) => {
      const h = { Authorization: 'Bearer ' + getToken() }
      if (json) h['Content-Type'] = 'application/json'
      return h
    }

    function showPair() {
      document.getElementById('pair-screen').classList.remove('hidden')
      document.getElementById('app').classList.add('hidden')
      stopPoll()
    }

    function showApp() {
      document.getElementById('pair-screen').classList.add('hidden')
      document.getElementById('app').classList.remove('hidden')
      loadSessions().then(startPoll)
    }

    function handleUnauthorized(msg) {
      localStorage.removeItem('cm_token')
      showPair()
      document.getElementById('pair-error').textContent = msg || '인증 만료 — 다시 연결하세요.'
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    }

    function renderMessages(list) {
      const el = document.getElementById('messages')
      if (!list || !list.length) {
        el.innerHTML = '<p style="color:#666;text-align:center;margin-top:24px">메시지 없음</p>'
        return
      }
      el.innerHTML = list.map(function (m) {
        const role = m.role === 'user' || m.role === 'assistant' ? m.role : 'unknown'
        return '<div class="bubble ' + role + '">' + escapeHtml(m.text) + '</div>'
      }).join('')
      el.scrollTop = el.scrollHeight
    }

    async function loadSessions() {
      const sel = document.getElementById('session-select')
      try {
        const res = await fetch('/chat/sessions', { headers: headers() })
        if (res.status === 401) { handleUnauthorized(); return }
        if (!res.ok) {
          sel.innerHTML = '<option value="">세션 로드 실패</option>'
          return
        }
        const data = await res.json()
        const sessions = data.sessions || []
        if (!sessions.length) {
          sel.innerHTML = '<option value="">(Cursor 세션 없음)</option>'
          return
        }
        sel.innerHTML = sessions.map(function (s) {
          const label = (s.name || s.composerId).slice(0, 48)
          return '<option value="' + escapeHtml(s.composerId) + '">' + escapeHtml(label) + '</option>'
        }).join('')
        const saved = localStorage.getItem(SESSION_KEY)
        if (saved && sessions.some(function (s) { return s.composerId === saved })) {
          sel.value = saved
        }
        sel.onchange = function () {
          localStorage.setItem(SESSION_KEY, sel.value)
          refreshMessages()
        }
      } catch (_) {
        sel.innerHTML = '<option value="">네트워크 오류</option>'
      }
    }

    async function refreshMessages() {
      const composerId = document.getElementById('session-select').value
      const bar = document.getElementById('status-bar')
      if (!composerId || !getToken()) return
      try {
        const res = await fetch('/chat/messages?composerId=' + encodeURIComponent(composerId), {
          headers: headers(),
        })
        if (res.status === 401) { handleUnauthorized(); return }
        if (!res.ok) {
          bar.textContent = '메시지 로드 실패'
          return
        }
        const data = await res.json()
        renderMessages(data.messages || [])
        bar.textContent = '갱신 ' + new Date().toLocaleTimeString()
      } catch (_) {
        bar.textContent = '폴링 오류'
      }
    }

    function startPoll() {
      stopPoll()
      refreshMessages()
      pollTimer = setInterval(refreshMessages, POLL_MS)
    }

    function stopPoll() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
    }

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
          errEl.textContent = data.error || '연결 실패'
          return
        }
        localStorage.setItem('cm_token', data.token)
        showApp()
      } catch (_) {
        errEl.textContent = 'Bridge 연결 실패'
      } finally {
        btn.disabled = false
        if (errEl.textContent === '연결 중…') errEl.textContent = ''
      }
    }

    async function sendMsg() {
      const text = document.getElementById('msg').value.trim()
      if (!text) return
      const status = document.getElementById('send-status')
      const btn = document.getElementById('send')
      status.className = ''
      status.textContent = '전송 중…'
      btn.disabled = true
      try {
        const res = await fetch('/message', {
          method: 'POST',
          headers: headers(true),
          body: JSON.stringify({ text }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          document.getElementById('msg').value = ''
          status.className = 'ok'
          status.textContent = '전송됨 (Cursor inject)'
          setTimeout(refreshMessages, 800)
        } else if (res.status === 401) {
          handleUnauthorized()
        } else {
          status.className = 'err'
          status.textContent = data.error || '전송 실패'
        }
      } catch (_) {
        status.className = 'err'
        status.textContent = '네트워크 오류'
      } finally {
        btn.disabled = false
      }
    }

    document.getElementById('pair-btn').addEventListener('click', doPair)
    document.getElementById('pair-code').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doPair()
    })
    document.getElementById('send').addEventListener('click', sendMsg)
    document.getElementById('msg').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }
    })

    ;(function init() {
      const params = new URLSearchParams(location.search)
      const t = params.get('cm_token')
      if (t) {
        try { localStorage.setItem('cm_token', t) } catch (_) {}
        history.replaceState({}, '', location.pathname)
      }
      if (getToken()) showApp()
    })()
  </script>
</body>
</html>`
}

module.exports = { renderChatHtml }
