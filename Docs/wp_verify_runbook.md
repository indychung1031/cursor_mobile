# Work Package 검증 Runbook

> WP 하나 구현 → **이 문서 해당 절** → `/dev` 또는 iPhone에서 확인 → [부록 G](ux_expansion_plan.md#부록-g--work-package-진행표-템플릿) ☑  
> **MVP 범위:** A1~A4, B1~B3, C1~C3, F1 — [§17.1](ux_expansion_plan.md#171-phase-15-mvp-공식-범위). D/E는 MVP Go 후.

## 공통 준비

```powershell
cd c:\Users\indyc\Desktop\antigravity\project\cursor_mobile\packages\bridge
npm start
# 개발·검증 UI (선택)
$env:BRIDGE_DEV="1"; npm start
```

| URL | 용도 |
|-----|------|
| http://localhost:3921/setup | 페어링 코드·URL |
| http://localhost:3921/dev | API 스모크 테스트 (BRIDGE_DEV=1) |
| http://localhost:3921/ | 모바일 UI 미리보기 |
| http://\<TAILSCALE_IP\>:3921/ | iPhone 실기 |

**JWT 받기 (curl):**

```powershell
$code = (Invoke-RestMethod http://localhost:3921/auth/pairing-code).code
$token = (Invoke-RestMethod -Method POST -ContentType "application/json" `
  -Body (@{code=$code} | ConvertTo-Json) http://localhost:3921/auth/pair).token
$headers = @{ Authorization = "Bearer $token" }
```

---

## WP 개발 루프

1. **WP 선택** — §17 표에서 선행 WP 완료 확인  
2. **구현** — 해당 API/UI만 (다른 WP 건드리지 않음)  
3. **PC 검증** — 아래 해당 절 「PC에서」  
4. **iPhone 검증** — 「iPhone에서」(해당 WP가 모바일 UX면)  
5. **☑ 완료** — 부록 G 진행표 갱신 → 다음 WP

---

## Slice A — 연결

### WP-A1 — `/setup` QR PNG

| | |
|---|---|
| **선행** | 없음 |
| **PC에서** | `/setup` → Tailscale·LAN URL 옆 **QR 이미지 2개** 표시 |
| **iPhone에서** | 카메라로 QR 스캔 → Safari에서 Bridge `/` 또는 `/pair` URL 열림 |
| **완료 ☑** | QR 스캔 후 주소창 URL이 `.env` Tailscale IP와 일치 |

### WP-A2 — `/pair` 자동 페어링

| | |
|---|---|
| **선행** | A1 |
| **PC에서** | `/setup`에서 pair URL 복사 (code 포함) |
| **iPhone에서** | 시크릿 탭에서 pair URL 접속 → **코드 입력 없이** 스트림 화면 |
| **curl** | `GET /pair?code=XXXXXX` → 302 `/` + Set-Cookie 또는 localStorage 토큰 |
| **완료 ☑** | pair URL 1회로 `/stream` 200 (깨진 이미지 아님) |

### WP-A3 — 페어링 UX

| | |
|---|---|
| **선행** | A2 |
| **PC에서** | `npm run test:mobile-a3` · Bridge 재시작 → 기존 JWT로 `/auth/session` |
| **iPhone에서** | Bridge **꺼진 채 15~30초** → **「재연결」** 오버레이 → Bridge 기동 후 「재연결」 탭 |
| **상태** | 🔶 **구현·PC 테스트 통과 — iPhone 실기 추후** ([기획서 §12.8](기획서.md#128-mvp-실기-검증-진행표-2026-06-28)) |
| **완료 ☑** | 만료·401 시 수동 새로고침 없이 재페어링 가능 · 끊김 「재연결」 실기 확인 |

### WP-A4 — 창 선택 UI

| | |
|---|---|
| **선행** | 없음 (A와 병렬 가능) |
| **PC에서** | `/setup` → Cursor 창 목록 → 클릭 → `config.json`의 `targetWindowTitle` 변경 |
| **확인** | `/dev` → 메시지 테스트 → **선택한 창** Agent 입력창에 텍스트 |
| **완료 ☑** | 창 2개 열린 상태에서 의도한 창만 입력됨 |

### WP-A5 — Bridge 트레이

| | |
|---|---|
| **선행** | A1 |
| **PC에서** | 트레이 아이콘 → 코드 표시 · `/setup` 열기 · Bridge 재시작 |
| **완료 ☑** | 터미널 없이 코드 확인·재시작 |

**Slice A Gate:** iPhone LTE → QR → 스트림 **30초 이내**.

---

## Slice B — 집중 모드

### WP-B1 — inject 공통 모듈

| | |
|---|---|
| **선행** | A4 |
| **PC에서** | `/dev` → 「inject dry-run」→ 대상 창 제목·좌표 로그 |
| **완료 ☑** | scroll/action 코드가 동일 `focusWindow()` 호출 |

### WP-B2 — `POST /focus/prepare`

| | |
|---|---|
| **선행** | B1 |
| **curl** | `POST /focus/prepare` body `{"minimizeOthers":false}` |
| **PC에서** | 요청 후 Cursor **전면**, 카카오톡 등 **그대로** |
| **완료 ☑** | `/dev` 「집중 준비」버튼 3회 → Cursor 포커스 유지 |

### WP-B3 — 모바일 집중 토글

| | |
|---|---|
| **선행** | B2 |
| **iPhone에서** | 「집중」ON → 메시지 3회 → **뒤 창 최소화 없이** Agent에 입력 |
| **완료 ☑** | OFF일 때는 기존 Phase 1 동작과 동일 |

**Slice B Gate:** 뒤 창 유지 + 전송 3회 성공.

---

## Slice C — 스크롤·Freeze

### WP-C1 — `POST /scroll`

| | |
|---|---|
| **선행** | B1 |
| **curl** | `POST /scroll` `{"deltaY":-240}` |
| **PC에서** | Agent 패널 **위로** 스크롤됨 (눈으로 확인) |
| **완료 ☑** | `/dev` ↑↓ 5회 → 다른 대화 블록 보임 |

### WP-C2 — 모바일 스크롤 UI

| | |
|---|---|
| **선행** | C1 |
| **iPhone에서** | ↑↓ 또는 스와이프 → 스트림에서 **위쪽 메시지** 읽기 가능 |
| **완료 ☑** | 10회 스크롤 후 Phase 1에서 못 보던 상단 텍스트 확인 |

### WP-C3 — Freeze

| | |
|---|---|
| **선행** | 없음 (B와 병렬 가능) |
| **iPhone에서** | 스트림 탭 → **멈춤** → Agent 계속 움직여도 화면 고정 |
| **완료 ☑** | 「라이브」→ MJPEG 재개 |

### WP-C4 — Pinch zoom

| | |
|---|---|
| **선행** | C3 |
| **iPhone에서** | Freeze 상태에서 핀치 → 확대·드래그 |
| **완료 ☑** | 작은 글씨 가독 |

---

## Slice D — 세션

### WP-D1 — `GET /sessions`

| | |
|---|---|
| **선행** | A4 |
| **PC에서** | `/setup`에서 슬롯 3개 이름 저장 |
| **curl** | `GET /sessions` → JSON 목록 |
| **완료 ☑** | config와 API 일치 |

### WP-D2 — `POST /session/select`

| | |
|---|---|
| **선행** | B1, D1 |
| **PC에서** | Cursor에 Agent 세션 2개 열어둠 → API 호출 → **PC에서 세션 전환** |
| **완료 ☑** | `/dev` 드롭다운 → 3초 내 다른 대화 표시 |

### WP-D3 — 모바일 세션 UI

| | |
|---|---|
| **선행** | D2 |
| **iPhone에서** | dropdown → 세션 B 선택 → 메시지 → **B 세션**에만 입력 |
| **완료 ☑** | 스트림 + 전송 모두 세션 일치 |

---

## Slice E — Agent 버튼

### WP-E1 — `POST /action/click`

| | |
|---|---|
| **선행** | B1 |
| **준비** | PC Agent에 **Run** 또는 **Accept** 버튼 보이는 상태 |
| **curl** | `POST /action/click` `{"action":"run"}` |
| **완료 ☑** | PC에서 버튼 1회 클릭됨 |

### WP-E2 — 모바일 액션 바

| | |
|---|---|
| **선행** | E1 |
| **iPhone에서** | [Run] 탭 → Agent가 다음 단계 진행 |
| **완료 ☑** | PC 손대지 않고 대화 1턴 진행 |

---

## Slice F — 마무리

### WP-F1 — Health 패널

| | |
|---|---|
| **curl** | `GET /health` → bridge, cursor, tailscale 필드 |
| **iPhone에서** | ⚙ 또는 상태 접기 → Bridge/Cursor/Tailscale 표시 |
| **완료 ☑** | Cursor 꺼면 `cursor: false` 반영 |

### WP-F2 — LAN fallback

| | |
|---|---|
| **iPhone에서** | 같은 Wi-Fi → **LAN IP** 우선 연결 (Tailscale OFF 가능) |
| **완료 ☑** | LAN 실패 시 Tailscale 자동 시도 |

### WP-F3 — PWA manifest

| | |
|---|---|
| **iPhone에서** | Safari 공유 → **홈 화면에 추가** → standalone (주소창 없음) |
| **완료 ☑** | 아이콘·이름 `cursor_mobile` |

### WP-F4 — CF Tunnel (선택)

| | |
|---|---|
| **PC에서** | `scripts/cf-tunnel.ps1` 실행 → HTTPS URL |
| **완료 ☑** | iPhone에서 HTTPS URL로 `/health` 200 |

---

## Phase 1 (현재) — 회귀 스모크

새 WP merge 전 **항상** 1분 회귀:

| # | 확인 | 기대 |
|---|------|------|
| 1 | `GET /health` | `ok: true` |
| 2 | `/setup` | 6자리 코드 |
| 3 | iPhone `/` 페어링 | 스트림 표시 |
| 4 | 메시지 1회 | Cursor Agent 입력창 |

`/dev` 페이지 **「Phase 1 회귀」** 버튼으로 1~3 자동 실행.

---

## 문제 발생 시

| 증상 | 확인 |
|------|------|
| stream 401 | Bridge 재시작 → 재페어링 (A3) |
| inject 다른 창 | `targetWindowTitle` (A4) |
| inputCoord error | `config.json` `inputOffset` |
| QR 안 열림 | Tailscale IP `.env` |

운영: [phase0_runbook.md](phase0_runbook.md)
