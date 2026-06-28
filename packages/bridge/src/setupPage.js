const os = require('os')
const { buildConnectUrl } = require('./qr')

function getLanIp() {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('100.')) {
        return net.address
      }
    }
  }
  return null
}

function qrSrc(connectUrl) {
  if (!connectUrl) return null
  return `/setup/qr?url=${encodeURIComponent(connectUrl)}`
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/'/g, '&#39;')
}

function isWindowSelected(title, targetWindowTitle) {
  if (!targetWindowTitle) return false
  if (title === targetWindowTitle) return true
  return title.includes(targetWindowTitle) || targetWindowTitle.includes(title)
}

function renderWindowPicker(cursorWindows, targetWindowTitle) {
  const refreshBtn =
    '<button type="button" class="window-refresh secondary" id="window-refresh">창 목록 새로고침</button>'

  const monitorHint =
    '<p class="window-hint">※ <strong>모니터(1·2·3번)</strong> 선택이 아닙니다. 열려 있는 <strong>Cursor IDE 창</strong> 중 메시지를 받을 창입니다.<br>화면(모니터·잘린 영역)은 iPhone 상단 <strong>Display</strong> 드롭다운 + calibrate(<code>region</code>)로 조정합니다.</p>'

  if (!cursorWindows.length) {
    return `${monitorHint}<p class="window-empty">(열린 Cursor 창 없음 — Cursor를 연 뒤 새로고침)</p>${refreshBtn}`
  }

  const singleHint =
    cursorWindows.length === 1
      ? '<p class="window-hint">Cursor 창이 <strong>1개</strong>만 감지됐습니다. 다른 Cursor 창이 보이면 전면에 두고 「창 목록 새로고침」.</p>'
      : `<p class="window-hint">Cursor 창 <strong>${cursorWindows.length}개</strong> — 메시지를 받을 창을 선택하세요.</p>`

  const items = cursorWindows
    .map((title) => {
      const selected = isWindowSelected(title, targetWindowTitle)
      return `<button type="button" class="window-pick${selected ? ' selected' : ''}" data-title="${escapeAttr(title)}">${escapeHtml(title)}</button>`
    })
    .join('')

  return `${monitorHint}${singleHint}<div class="window-list" id="window-list">${items}</div>${refreshBtn}`
}

function renderSetupHtml({
  port,
  tailscaleIp,
  pairingCode,
  cursorWindows = [],
  targetWindowTitle = '',
}) {
  const lanIp = getLanIp()
  const mobileUrl = buildConnectUrl(tailscaleIp, port, pairingCode)
  const lanUrl = buildConnectUrl(lanIp, port, pairingCode)
  const codeDisplay = pairingCode
    ? `<div class="code">${pairingCode}</div>`
    : `<div class="code used">(사용됨 — 아래 버튼으로 새 코드 생성)</div>`

  const urls = [
    mobileUrl && { label: 'iPhone (Tailscale · 밖에서)', url: mobileUrl },
    lanUrl && { label: 'iPhone (같은 Wi‑Fi)', url: lanUrl },
    { label: 'PC (이 페이지)', url: `http://localhost:${port}/setup` },
  ].filter(Boolean)

  const windowPicker = renderWindowPicker(cursorWindows, targetWindowTitle)

  const targetHint = targetWindowTitle
    ? `<code id="target-window-display" style="color:#6eb6ff">${escapeHtml(targetWindowTitle)}</code>`
    : '<span id="target-window-display" style="color:#f87171">미설정 — 아래에서 Cursor 창을 선택하세요</span>'

  const urlRows = urls
    .map(
      (u) =>
        `<tr><td>${u.label}</td><td><a href="${u.url}">${u.url}</a></td></tr>`,
    )
    .join('')

  const qrBlocks = [
    mobileUrl && {
      id: 'qr-ts',
      label: 'Tailscale · LTE/5G',
      url: mobileUrl,
      host: tailscaleIp,
    },
    lanUrl && {
      id: 'qr-lan',
      label: '같은 Wi‑Fi (LAN)',
      url: lanUrl,
      host: lanIp,
    },
  ].filter(Boolean)

  const qrHtml = qrBlocks.length
    ? `<div class="label">iPhone 카메라로 QR 스캔 → 자동 연결</div>
    <p class="hint-block" id="qr-hint">${pairingCode ? 'QR에 페어링 코드가 포함됩니다.' : '코드 사용됨 — 새 코드 생성 후 QR 갱신'}</p>
    <div class="qr-grid">${qrBlocks
      .map(
        (q) => `<div class="qr-item">
      <img id="${q.id}" data-qr-host="${q.host}" data-qr-port="${port}" src="${qrSrc(q.url)}" width="160" height="160" alt="QR ${q.label.replace(/"/g, '')}">
      <div class="qr-caption">${q.label}</div>
      <a class="qr-link" href="${q.url}">${q.url}</a>
    </div>`,
      )
      .join('')}</div>`
    : '<p class="hint-block">QR 표시 불가 — Tailscale IP(.env) 또는 LAN IP를 확인하세요.</p>'

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>cursor_mobile — PC 설정</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; background: #0f0f0f; color: #eee;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .card {
      background: #1a1a1a; border: 1px solid #333; border-radius: 16px;
      padding: 32px; max-width: 560px; width: 100%;
    }
    h1 { margin: 0 0 8px; font-size: 1.25rem; }
    .sub { color: #888; font-size: 0.9rem; margin-bottom: 24px; line-height: 1.5; }
    .label { font-size: 0.85rem; color: #aaa; margin-bottom: 8px; }
    .code {
      font-size: 3rem; font-weight: 700; letter-spacing: 0.35em;
      text-align: center; padding: 20px; background: #111; border-radius: 12px;
      border: 2px solid #0066ff; margin-bottom: 20px;
    }
    .code.used { font-size: 1rem; letter-spacing: 0; color: #888; border-color: #444; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin: 16px 0; }
    td { padding: 8px 4px; vertical-align: top; border-bottom: 1px solid #2a2a2a; }
    td:first-child { color: #aaa; white-space: nowrap; width: 38%; }
    a { color: #6eb6ff; word-break: break-all; }
    button {
      width: 100%; padding: 12px; font-size: 1rem; border: none; border-radius: 8px;
      background: #0066ff; color: #fff; font-weight: 600; cursor: pointer; margin-top: 8px;
    }
    button.secondary { background: #333; margin-top: 8px; }
    .note {
      margin-top: 20px; padding: 12px; background: #111; border-radius: 8px;
      font-size: 0.82rem; color: #aaa; line-height: 1.5;
    }
    .note strong { color: #6ee7a0; }
    .qr-grid {
      display: flex; flex-wrap: wrap; gap: 16px; justify-content: center;
      margin-bottom: 20px;
    }
    .qr-item {
      text-align: center; background: #111; border-radius: 12px;
      padding: 12px; border: 1px solid #333; flex: 1; min-width: 180px; max-width: 220px;
    }
    .qr-item img {
      display: block; margin: 0 auto 8px; border-radius: 8px; background: #fff;
    }
    .qr-caption { font-size: 0.85rem; color: #ccc; margin-bottom: 6px; font-weight: 600; }
    .qr-link { font-size: 0.72rem; color: #6eb6ff; word-break: break-all; }
    .hint-block { font-size: 0.82rem; color: #888; margin-bottom: 16px; }
    .window-list { display: flex; flex-direction: column; gap: 8px; margin: 10px 0; }
    .window-pick {
      width: 100%; text-align: left; padding: 10px 12px; font-size: 0.82rem;
      background: #222; color: #ddd; border: 1px solid #444; border-radius: 8px;
      cursor: pointer; margin: 0; line-height: 1.35; word-break: break-word;
    }
    .window-pick:hover { border-color: #0066ff; color: #fff; }
    .window-pick.selected {
      border-color: #0066ff; background: #0a1a33; color: #6eb6ff; font-weight: 600;
    }
    .window-pick:disabled { opacity: 0.6; cursor: wait; }
    .window-refresh { margin-top: 4px; }
    .window-empty { font-size: 0.82rem; color: #888; margin: 8px 0; }
    .window-hint {
      font-size: 0.78rem; color: #888; margin: 0 0 10px; line-height: 1.45;
      padding: 8px 10px; background: #111; border-radius: 8px; border: 1px solid #2a2a2a;
    }
    .window-hint strong { color: #ccc; }
    #window-status { font-size: 0.82rem; min-height: 1.2em; margin-top: 6px; }
    #window-status.ok { color: #6ee7a0; }
    #window-status.err { color: #f87171; }
  </style>
</head>
<body>
  <div class="card">
    <h1>cursor_mobile PC 설정</h1>
    <p class="sub">Tailscale 창은 필요 없습니다.<br>Bridge만 실행 중이면 QR 스캔 한 번으로 iPhone이 연결됩니다.</p>

    <div class="label">iPhone에 입력할 6자리 코드 (QR 실패 시)</div>
    <div id="code-box">${codeDisplay}</div>

    ${qrHtml}

    <table>${urlRows}</table>

    <button type="button" onclick="regenCode()">새 코드 생성</button>
    <button type="button" class="secondary" onclick="location.href='/'">모바일 화면 미리보기</button>

    <div class="note">
      <strong>메시지 입력 대상 Cursor 창</strong><br>
      선택됨: <span id="target-window-wrap">${targetHint}</span><br>
      <span style="color:#888;">모바일에서 보낸 메시지는 이 창의 Agent 입력창으로 갑니다.</span>
      <div id="window-picker">${windowPicker}</div>
      <div id="window-status"></div>
    </div>

    <div class="note">
      <strong>사용 방법</strong><br>
      1. iPhone 카메라로 QR 스캔 → 자동 연결<br>
      2. (수동) 위 6자리 코드 입력<br>
      3. Claude 터미널 등 다른 창은 최소화해 두기
    </div>
  </div>
  <script>
    let lastCode = ${pairingCode ? JSON.stringify(pairingCode) : 'null'}

    function connectUrl(host, port, code) {
      const base = 'http://' + host + ':' + port
      if (code) return base + '/pair?code=' + encodeURIComponent(code)
      return base + '/'
    }

    function updateQrCodes(code) {
      document.querySelectorAll('[data-qr-host]').forEach(function (img) {
        const url = connectUrl(img.dataset.qrHost, img.dataset.qrPort, code)
        img.src = '/setup/qr?url=' + encodeURIComponent(url) + '&t=' + Date.now()
        const link = img.closest('.qr-item') && img.closest('.qr-item').querySelector('.qr-link')
        if (link) { link.href = url; link.textContent = url }
      })
      const hint = document.getElementById('qr-hint')
      if (hint) {
        hint.textContent = code
          ? 'QR에 페어링 코드가 포함됩니다.'
          : '코드 사용됨 — 새 코드 생성 버튼을 누르세요'
      }
    }

    async function refreshCode() {
      const res = await fetch('/auth/pairing-code')
      const data = await res.json()
      const box = document.getElementById('code-box')
      if (data.code) {
        box.innerHTML = '<div class="code">' + data.code + '</div>'
      } else {
        box.innerHTML = '<div class="code used">(사용됨 — 새 코드 생성 버튼을 누르세요)</div>'
      }
      if (data.code !== lastCode) {
        lastCode = data.code
        updateQrCodes(data.code)
      }
    }

    async function regenCode() {
      const res = await fetch('/auth/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      if (!res.ok) {
        const box = document.getElementById('code-box')
        box.innerHTML = '<div class="code used">코드 생성 실패 (' + res.status + ')</div>'
        return
      }
      const data = await res.json()
      lastCode = data.code
      await refreshCode()
    }

    setInterval(refreshCode, 5000)

    function setWindowStatus(msg, ok) {
      const el = document.getElementById('window-status')
      el.textContent = msg || ''
      el.className = ok === true ? 'ok' : ok === false ? 'err' : ''
    }

    function renderTargetDisplay(title) {
      const wrap = document.getElementById('target-window-wrap')
      if (!wrap) return
      if (title) {
        wrap.innerHTML = '<code id="target-window-display" style="color:#6eb6ff"></code>'
        document.getElementById('target-window-display').textContent = title
      } else {
        wrap.innerHTML = '<span id="target-window-display" style="color:#f87171">미설정 — 아래에서 Cursor 창을 선택하세요</span>'
      }
    }

    function renderWindowList(windows, selected) {
      const picker = document.getElementById('window-picker')
      if (!picker) return
      const monitorHint = '<p class="window-hint">※ <strong>모니터 선택 아님</strong> — Cursor IDE 창 목록입니다. 화면 영역은 iPhone Display + calibrate.</p>'
      const refreshHtml = '<button type="button" class="window-refresh secondary" id="window-refresh">창 목록 새로고침</button>'
      if (!windows.length) {
        picker.innerHTML = monitorHint + '<p class="window-empty">(열린 Cursor 창 없음 — Cursor를 연 뒤 새로고침)</p>' + refreshHtml
        return
      }
      const singleHint = windows.length === 1
        ? '<p class="window-hint">Cursor 창 1개만 감지 — 다른 창을 전면에 두고 새로고침.</p>'
        : '<p class="window-hint">Cursor 창 ' + windows.length + '개 — 선택하세요.</p>'
      const items = windows.map(function (title) {
        const sel = selected && (title === selected || title.indexOf(selected) >= 0 || selected.indexOf(title) >= 0)
        return '<button type="button" class="window-pick' + (sel ? ' selected' : '') + '" data-title="' + title.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '">' + title.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</button>'
      }).join('')
      picker.innerHTML = monitorHint + singleHint + '<div class="window-list" id="window-list">' + items + '</div>' + refreshHtml
    }

    async function selectWindow(title, btn) {
      if (!title) return
      if (btn) btn.disabled = true
      setWindowStatus('저장 중…')
      try {
        const res = await fetch('/config/window', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetWindowTitle: title }),
        })
        const data = await res.json().catch(function () { return {} })
        if (!res.ok) {
          setWindowStatus(data.error || '저장 실패 (' + res.status + ')', false)
          return
        }
        renderTargetDisplay(data.targetWindowTitle)
        document.querySelectorAll('.window-pick').forEach(function (b) {
          b.classList.toggle('selected', b.dataset.title === data.targetWindowTitle)
        })
        setWindowStatus('저장됨 — 이 창으로 메시지가 전송됩니다.', true)
      } catch (_) {
        setWindowStatus('Bridge에 연결할 수 없습니다.', false)
      } finally {
        if (btn) btn.disabled = false
      }
    }

    async function refreshWindows() {
      setWindowStatus('창 목록 불러오는 중…')
      try {
        const res = await fetch('/setup/windows')
        const data = await res.json()
        renderWindowList(data.windows || [], data.targetWindowTitle || '')
        renderTargetDisplay(data.targetWindowTitle || '')
        setWindowStatus('', null)
      } catch (_) {
        setWindowStatus('창 목록을 불러오지 못했습니다.', false)
      }
    }

    document.addEventListener('click', function (e) {
      const pick = e.target.closest('.window-pick')
      if (pick) {
        selectWindow(pick.dataset.title, pick)
        return
      }
      if (e.target.id === 'window-refresh' || e.target.closest('#window-refresh')) {
        refreshWindows()
      }
    })
  </script>
</body>
</html>`
}

module.exports = { renderSetupHtml, getLanIp }
