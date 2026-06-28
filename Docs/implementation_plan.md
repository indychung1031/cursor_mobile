# cursor_mobile — 구현 계획서

| 항목 | 내용 |
|------|------|
| 문서 버전 | v0.5.0 |
| 작성일 | 2026-06-27 |
| 기반 문서 | [기획서.md](기획서.md) v0.4.0 |
| 상태 | **착수 가능** |

---

## 변경 이력

| 버전 | 날짜 | 주요 변경 |
|------|------|-----------|
| v0.1.1 | 2026-06-26 | 초안 — Extension + Bridge + PWA |
| v0.3.0 | 2026-06-27 | ttyd + tmux 방식 |
| v0.4.0 | 2026-06-27 | **B모드(스트리밍) 우선, A모드(Extension) 향후** |
| v0.5.0 | 2026-06-27 | 다중 모니터 지원, 대기모드 대응, Phase 0 조기 검증 추가 |

---

## 저장소 구조

```
cursor_mobile/
├── Docs/
│   ├── README.md
│   ├── 기획서.md
│   ├── implementation_plan.md
│   └── spike_phaseA_report.md       # A모드 스파이크 완료 후
├── packages/
│   ├── bridge/                      # Node.js Bridge Server (B·A모드 공용)
│   │   ├── src/
│   │   │   ├── capture/             # 화면 캡처 (B모드)
│   │   │   ├── clipboard/           # 클립보드 주입 (B모드)
│   │   │   ├── stream/              # MJPEG 스트리밍 (B모드)
│   │   │   ├── extension/           # Extension 통신 (A모드)
│   │   │   └── auth/                # pairing + JWT
│   └── mobile-web/                  # 모바일 UI
│       ├── b-mode/                  # 영상 뷰 + 입력창
│       └── a-mode/                  # 말풍선 채팅 UI (A모드)
└── scripts/
    ├── start-bridge.bat             # Bridge 실행
    └── install-service.ps1          # Windows 서비스 등록
```

---

## Phase 0 — 인프라 구성

### 0-1. Tailscale 설치

1. [tailscale.com](https://tailscale.com) 에서 Windows용 설치
2. Google/GitHub 계정으로 로그인
3. 모바일에도 Tailscale 앱 설치 후 같은 계정 로그인
4. 관리 콘솔에서 PC의 Tailscale IP 확인 (`100.x.x.x`)
5. **Tailscale 연동 계정에 2단계 인증 설정 필수**

### 0-2. Bridge 서버 뼈대

```bash
cd packages/bridge
npm init -y
npm install fastify @fastify/cors @fastify/websocket jsonwebtoken screenshot-desktop jimp
```

최소 구현 (모니터 목록 API 포함):

```js
// src/index.js
const fastify = require('fastify')()
const screenshot = require('screenshot-desktop')

fastify.get('/health', async () => ({
  status: 'ok',
  mode: 'b',
  cursorRunning: true   // 추후 실제 감지로 교체
}))

// 연결된 모니터 목록 반환
fastify.get('/displays', async () => {
  const displays = await screenshot.listDisplays()
  return { displays }
  // 예: [{ id: 1, name: "Display 1" }, { id: 2, name: "Display 2" }]
})

// Windows 디스플레이 sleep 방지 (Bridge 실행 내내 유지)
function preventDisplaySleep() {
  const { execSync } = require('child_process')
  // ES_DISPLAY_REQUIRED | ES_CONTINUOUS = 0x80000003
  execSync(`powershell -Command "[Windows.Forms.Application] | Out-Null; Add-Type -A System.Windows.Forms; [Console]::TreatControlCAsInput = $true"`, { stdio: 'ignore' })
  // 더 단순한 방법: powercfg로 현재 설정 저장 후 디스플레이 꺼짐 비활성
  try {
    execSync('powercfg /change monitor-timeout-ac 0', { stdio: 'ignore' })
    execSync('powercfg /change monitor-timeout-dc 0', { stdio: 'ignore' })
    console.log('[Bridge] 디스플레이 sleep 방지 설정 완료')
  } catch (e) {
    console.warn('[Bridge] 디스플레이 sleep 방지 설정 실패 — 수동으로 전원 설정을 확인하세요')
  }
}

preventDisplaySleep()
fastify.listen({ port: 3921, host: '0.0.0.0' })  // Tailscale 인터페이스에서도 수신
```

> **`host: '0.0.0.0'`**: Tailscale IP에서 오는 요청을 받으려면 `127.0.0.1`이 아닌 `0.0.0.0`으로 바인딩해야 한다.

### 0-3. Phase 0 조기 검증 (착수 게이트)

**[검증 1] MJPEG 텍스트 가독성 — 첫 1시간 안에 확인**

```js
// 임시 스크립트: 채팅 패널 영역 캡처 후 JPEG 저장
const screenshot = require('screenshot-desktop')
const Jimp = require('jimp')

;(async () => {
  const img = await screenshot({ format: 'png' })
  const jimpImg = await Jimp.read(img)
  await jimpImg
    .crop(1200, 100, 600, 900)  // 실제 Cursor 채팅 패널 좌표로 수정
    .quality(70)
    .writeAsync('test_capture.jpg')
  console.log('test_capture.jpg 저장 완료 — 폰으로 열어서 텍스트 가독성 확인')
})()
```

폰에서 열어서 코드/텍스트가 읽히면 Phase 1 진행. 흐리면 품질(quality 값) 조정 또는 캡처 해상도 재검토.

**[검증 2] 대기모드(디스플레이 off) 캡처 동작 확인**

- PC 디스플레이를 수동으로 끄거나 대기 상태로 두고 위 캡처 스크립트 재실행
- 정상 이미지가 나오면 → 대기모드 지원 가능
- 검은 화면이 나오면 → `powercfg /change monitor-timeout-ac 0` 설정으로 디스플레이를 항상 켜두는 방향으로 운영

### 0-4. 접속 테스트 체크리스트

- [ ] `http://localhost:3921/health` 응답 확인
- [ ] `http://localhost:3921/displays` 모니터 목록 응답 확인
- [ ] `http://tailscale-ip:3921/health` 모바일에서 응답 확인
- [ ] LTE 환경(Wi-Fi 끄고)에서도 동일 확인
- [ ] **[게이트]** 캡처 JPEG 폰에서 텍스트 가독성 OK
- [ ] **[게이트]** 디스플레이 off 상태에서 캡처 정상 동작

---

## Phase 1 — B모드 구현

### B-1. 화면 캡처 + 다중 모니터 지원

Cursor 채팅 패널의 화면 좌표와 모니터 ID를 config에 저장하고, 지정 모니터의 해당 영역만 캡처한다.

```js
// src/capture/screenCapture.js
const screenshot = require('screenshot-desktop')
const Jimp = require('jimp')

// config.json 구조
// {
//   selectedDisplay: 1,          ← 캡처할 모니터 ID (listDisplays() 결과의 id 값)
//   region: { x: 1200, y: 100, width: 600, height: 900 },
//   inputCoord: { x: 1500, y: 950 }
// }

async function listDisplays() {
  return await screenshot.listDisplays()
  // 반환 예: [{ id: 1, name: "\\.\DISPLAY1" }, { id: 2, name: "\\.\DISPLAY2" }]
}

async function captureChatPanel(config) {
  const { selectedDisplay, region } = config
  const img = await screenshot({ screen: selectedDisplay, format: 'png' })
  const jimpImg = await Jimp.read(img)
  return jimpImg
    .crop(region.x, region.y, region.width, region.height)
    .quality(80)
    .getBufferAsync(Jimp.MIME_JPEG)
}

module.exports = { listDisplays, captureChatPanel }
```

**모니터 전환 API**

```js
// Bridge API — 모니터 선택 변경
fastify.post('/config/display', { preHandler: verifyJWT }, async (req) => {
  config.selectedDisplay = req.body.displayId
  saveConfig(config)
  return { ok: true, selectedDisplay: config.selectedDisplay }
})
```

**패널 좌표 설정 방법 (최초 1회, 모니터 변경 시마다)**

Bridge UI에서 "좌표 설정" 버튼 클릭 → 마우스로 채팅 패널 드래그 → config 저장

### B-2. MJPEG 스트리밍

```js
// src/stream/mjpegStream.js
// GET /stream 요청 시 MJPEG 형식으로 지속 전송
fastify.get('/stream', async (req, reply) => {
  reply.raw.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
    'Cache-Control': 'no-cache',
  })

  const interval = setInterval(async () => {
    const frame = await captureChatPanel(config.region)
    reply.raw.write(
      `--frame\r\nContent-Type: image/jpeg\r\n\r\n`
    )
    reply.raw.write(frame)
    reply.raw.write('\r\n')
  }, 200)  // 5fps (모바일 환경 기준)

  req.raw.on('close', () => clearInterval(interval))
})
```

### B-3. 클립보드 입력 주입

모바일에서 보낸 텍스트를 PC 클립보드에 넣고, Cursor 입력창에 붙여넣는다.

```bash
npm install @nut-tree/nut-js clipboardy
```

```js
// src/clipboard/inject.js
const { keyboard, Key, mouse, Button } = require('@nut-tree/nut-js')
const clipboardy = require('clipboardy')

// config에 입력창 클릭 좌표 저장
async function injectMessage(text, inputCoord) {
  await clipboardy.write(text)
  await mouse.setPosition(inputCoord)
  await mouse.click(Button.LEFT)        // 입력창 포커스
  await keyboard.pressKey(Key.LeftControl, Key.V)  // Ctrl+V
  await keyboard.releaseKey(Key.LeftControl, Key.V)
  await keyboard.pressKey(Key.Enter)    // 전송
  await keyboard.releaseKey(Key.Enter)
}
```

```js
// Bridge API
fastify.post('/message', { preHandler: verifyJWT }, async (req) => {
  await injectMessage(req.body.text, config.inputCoord)
  return { ok: true }
})
```

### B-4. 모바일 UI (모니터 전환 포함)

```html
<!-- packages/mobile-web/b-mode/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; display: flex; flex-direction: column; height: 100vh; background: #000; }
    #toolbar { display: flex; padding: 6px 8px; background: #111; gap: 8px; align-items: center; }
    #display-select { flex: 1; padding: 8px; font-size: 14px; border-radius: 6px; border: none; background: #333; color: #fff; }
    #stream { flex: 1; width: 100%; object-fit: contain; }
    #input-area { display: flex; padding: 8px; background: #1a1a1a; gap: 8px; }
    #msg { flex: 1; padding: 12px; font-size: 16px; border-radius: 8px; border: none; }
    #send { padding: 12px 20px; font-size: 16px; background: #0066ff; color: white; border: none; border-radius: 8px; }
  </style>
</head>
<body>
  <div id="toolbar">
    <select id="display-select" onchange="switchDisplay(this.value)">
      <option>모니터 로딩 중...</option>
    </select>
  </div>
  <img id="stream" src="/stream">
  <div id="input-area">
    <input id="msg" type="text" placeholder="메시지 입력..." />
    <button id="send" onclick="send()">전송</button>
  </div>
  <script>
    const token = () => localStorage.token || ''
    const authHeader = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() })

    // 모니터 목록 로드
    async function loadDisplays() {
      const res = await fetch('/displays', { headers: authHeader() })
      const { displays } = await res.json()
      const sel = document.getElementById('display-select')
      sel.innerHTML = displays.map(d =>
        `<option value="${d.id}">${d.name || 'Display ' + d.id}</option>`
      ).join('')
    }

    // 모니터 전환
    async function switchDisplay(displayId) {
      await fetch('/config/display', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ displayId: Number(displayId) })
      })
    }

    async function send() {
      const text = document.getElementById('msg').value.trim()
      if (!text) return
      await fetch('/message', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ text })
      })
      document.getElementById('msg').value = ''
    }

    document.getElementById('msg').addEventListener('keydown', e => {
      if (e.key === 'Enter') send()
    })

    loadDisplays()
  </script>
</body>
</html>
```

### B-5. 인증 (pairing code → JWT)

```js
// src/auth/pairing.js
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

let pairingCode = null
const SECRET = crypto.randomBytes(32).toString('hex')  // Bridge 기동 시 생성

// Bridge 시작 시 콘솔에 표시
function generatePairingCode() {
  pairingCode = Math.floor(100000 + Math.random() * 900000).toString()
  console.log(`\n=== Pairing Code: ${pairingCode} ===\n`)
}

fastify.post('/auth/pair', async (req) => {
  if (req.body.code !== pairingCode) return { error: 'invalid code' }
  pairingCode = null  // 1회용
  const token = jwt.sign({ paired: true }, SECRET, { expiresIn: '30d' })
  return { token }
})
```

### B-6. Windows 자동 시작

`scripts/install-service.ps1`:

```powershell
# NSSM으로 Windows 서비스 등록
$nssm = ".\nssm.exe"
& $nssm install CursorMobileBridge "node" "C:\path\to\cursor_mobile\packages\bridge\src\index.js"
& $nssm set CursorMobileBridge AppDirectory "C:\path\to\cursor_mobile\packages\bridge"
& $nssm set CursorMobileBridge Start SERVICE_AUTO_START
& $nssm start CursorMobileBridge
Write-Host "Bridge 서비스 등록 완료"
```

### B-7. E2E 테스트 체크리스트

- [ ] 모바일 브라우저에서 Cursor 채팅 패널 영상 표시
- [ ] 영상 내 텍스트 가독성 (실제 사용 가능한 수준인지)
- [ ] 모바일 입력 → Cursor Agent에 전달 (10초 이내)
- [ ] Agent 응답이 영상으로 실시간 반영
- [ ] **모니터 전환 드롭다운 → 다른 화면으로 스트리밍 전환**
- [ ] **디스플레이 off 상태에서 스트리밍 정상 동작**
- [ ] pairing code 인증 후 30일 유지
- [ ] LTE 환경 접속 성공
- [ ] PC 재부팅 후 Bridge 자동 복구

---

## Phase 2 — A모드 구현 (B모드 완료 후)

### A-0. 스파이크 (Go/No-Go 검증, 4~8시간)

A모드 착수 전, Cursor Extension API로 Agent 채팅 접근이 가능한지 먼저 확인한다.

| 질문 | 검증 방법 |
|------|-----------|
| Cursor가 VS Code Extension을 로드하는가? | `yo code`로 빈 Extension 생성 후 F5 |
| Agent 관련 Command가 있는가? | Command Palette에서 `cursor.` 접두사 명령 목록 확인 |
| 채팅 내용을 텍스트로 읽을 수 있는가? | Extension API 범위 내에서 시도 |

결과 → [spike_phaseA_report.md](spike_phaseA_report.md) 작성

**Go/No-Go 기준:**
- 채팅 텍스트 읽기 성공 → A모드 전체 구현 진행
- 실패 → B모드를 계속 사용하며 Cursor 공식 API 지원 대기

### A-1 ~ A-6. 상세 설계

스파이크 성공 후 별도 문서(`a_mode_plan.md`)로 작성한다.  
주요 구성: Cursor Extension + Bridge API 확장 + 모바일 PWA 채팅 UI

---

## 포트 정리

| 포트 | 용도 |
|------|------|
| 3921 | Bridge Server (인증, 메시지, 스트리밍 — B·A모드 공용) |

---

## 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 화면 좌표가 Cursor 창 크기 변경 시 어긋남 | B모드 입력 실패 | 좌표 재설정 UI 제공 |
| diff/승인 다이얼로그로 입력창 위치 이동 | Ctrl+V가 엉뚱한 곳에 입력 | 입력 전 입력창 영역 재확인 로직 or 안내 메시지 |
| 대기모드에서 캡처 화면 검은 화면 | 스트리밍 불능 | Phase 0 검증 → 실패 시 `powercfg`로 디스플레이 항상 켜두기 |
| `@nut-tree/nut-js` Windows 호환 문제 | 클립보드 주입 실패 | PowerShell SendKeys로 대체 |
| MJPEG 텍스트 가독성 불충분 | B모드 실사용 불가 | Phase 0에서 검증 → 실패 시 품질/해상도 조정 |
| MJPEG 스트리밍 지연이 너무 큰 경우 | UX 저하 | WebRTC로 교체 검토 |
| A모드 스파이크 실패 | A모드 구현 불가 | B모드 장기 유지 |
