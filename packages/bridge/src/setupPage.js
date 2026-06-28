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

  const windowList = cursorWindows.length
    ? `<ul style="margin:8px 0;padding-left:18px;font-size:0.82rem;color:#ccc;">${cursorWindows.map((t) => `<li>${t.replace(/</g, '&lt;')}</li>`).join('')}</ul>`
    : '<p style="font-size:0.82rem;color:#888;">(열린 Cursor 창 없음)</p>'

  const targetHint = targetWindowTitle
    ? `<code style="color:#6eb6ff">${targetWindowTitle.replace(/</g, '&lt;')}</code>`
    : '<span style="color:#f87171">미설정 — config.json에 targetWindowTitle 추가</span>'

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
      padding: 32px; max-width: 520px; width: 100%;
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
      config.json → <code>targetWindowTitle</code>: ${targetHint}<br>
      (창 제목에 이 문자열이 포함된 Cursor로 입력됩니다)
      ${windowList}
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
  </script>
</body>
</html>`
}

module.exports = { renderSetupHtml, getLanIp }
