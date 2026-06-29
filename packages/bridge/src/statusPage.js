const {
  getStreamStats,
  getLastInjectError,
} = require('./bridgeState')

const STREAM_TARGET_FPS = Math.round(1000 / Number(process.env.STREAM_SEND_MS || 120))

function getHealthPayload(deps) {
  const { port, isCursorRunning, getTailscaleIp, getBridgeUrls } = deps
  const urls = getBridgeUrls(port)
  const tailscaleIp = getTailscaleIp()
  const cursorRunning = isCursorRunning()
  const uptimeSec = Math.floor(process.uptime())
  const stream = getStreamStats(STREAM_TARGET_FPS)
  const lastInjectError = getLastInjectError()

  const bridgeOk = true
  const cursorOk = cursorRunning
  const tailscaleOk = Boolean(tailscaleIp)

  return {
    ok: bridgeOk && cursorOk,
    status: 'ok',
    mode: 'b',
    cursorRunning,
    uptimeSec,
    tailscaleIp: tailscaleIp || null,
    urls,
    bridge: {
      ok: bridgeOk,
      uptimeSec,
      port,
    },
    cursor: {
      ok: cursorOk,
      running: cursorRunning,
    },
    tailscale: {
      ok: tailscaleOk,
      configured: tailscaleOk,
      ip: tailscaleIp || null,
    },
    stream,
    streamFps: stream.streamFps,
    lastInjectError,
  }
}

function renderStatusHtml(payload) {
  const cursorOk = payload.cursor?.running ?? payload.cursorRunning
  const uptimeMin = Math.floor(payload.uptimeSec / 60)
  const tsIp = payload.tailscale?.ip ?? payload.tailscaleIp

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>cursor_mobile</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0; padding: 24px 16px;
      background: #0f0f0f; color: #f0f0f0;
      min-height: 100vh;
    }
    .card {
      max-width: 420px; margin: 0 auto;
      background: #1a1a1a; border-radius: 16px;
      padding: 24px; border: 1px solid #333;
    }
    h1 { font-size: 1.25rem; margin: 0 0 8px; }
    .badge {
      display: inline-block; padding: 6px 12px; border-radius: 999px;
      font-size: 0.875rem; font-weight: 600; margin-bottom: 20px;
    }
    .ok { background: #0d3d1f; color: #6ee7a0; }
    .warn { background: #3d2a0d; color: #fbbf24; }
    dl { margin: 0; }
    dt { color: #888; font-size: 0.75rem; margin-top: 12px; }
    dd { margin: 4px 0 0; font-size: 0.95rem; }
    .hint { margin-top: 20px; font-size: 0.8rem; color: #888; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>cursor_mobile Bridge</h1>
    <span class="badge ${payload.ok ? 'ok' : 'warn'}">${payload.ok ? '정상' : '확인 필요'}</span>
    <dl>
      <dt>상태</dt><dd>${payload.status} (B모드)</dd>
      <dt>Cursor 실행</dt><dd>${cursorOk ? '✅ 실행 중' : '⚠️ 꺼짐 — PC에서 Cursor를 켜 주세요'}</dd>
      <dt>Bridge 가동</dt><dd>${uptimeMin}분 (${payload.uptimeSec}초)</dd>
      <dt>Tailscale IP</dt><dd>${tsIp || '(미설정 — .env TAILSCALE_IP)'}</dd>
      <dt>스트림 FPS</dt><dd>${payload.streamFps ?? payload.stream?.streamFps ?? '—'}</dd>
    </dl>
    <p class="hint">JSON API: <code>/health</code> · 모바일 앱에서 상태 점(●) 탭</p>
  </div>
</body>
</html>`
}

module.exports = { getHealthPayload, renderStatusHtml, STREAM_TARGET_FPS }
