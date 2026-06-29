# 알려진 한계 · 문제 가능성 (Living Doc)

| 항목 | 내용 |
|------|------|
| 목적 | **언제든 재발할 수 있는** 리스크·증상·대응을 한곳에 모아 둔다 |
| 갱신 | 실사용·버그 수정·Cursor 업데이트 후 **항목 추가·수정** |
| 관련 | [기획서 §2.2 B모드](기획서.md), [ux_expansion_plan §1](ux_expansion_plan.md), [c_mode_development.md](c_mode_development.md) |

> **전제:** Phase 1.5 MVP는 Tailscale + PC Bridge + Safari 조합을 전제로 한다.  
> “완전히 막았다”기보다 **인지하고 완화**하는 문서다.

---

## 1. PC inject · 포커스 (B/C 공통)

입력은 **클립보드 + Cursor 창 포커스 + Ctrl+V + Enter** (PowerShell SendKeys).  
C모드(`/chat`)도 **전송 시 동일 inject**를 쓴다.

| # | 문제 | 언제 | 증상 | 대응 (사용자) | 완화 (코드·설정) |
|---|------|------|------|---------------|------------------|
| R1 | **다른 앱이 포커스 가로챔** | 카카오톡·Slack·Teams 알림, Windows 토스트, UAC | 전송 실패, 카톡에 글 들어감, 「전송 중…」 지연 | **알림 사라질 때까지 1~2초 대기** 후 전송 | inject 4회 포커스 재시도, 붙여넣기 전·후 Cursor 포커스 검사 (`583365f`) |
| R2 | **전송 무한 대기** | inject/PowerShell 지연 + iPhone fetch 무타임아웃 | 「전송 중…」만 보임 | Safari 새로고침, 25초 후 재시도 | 클라이언트 **25초 타임아웃** (`bb0a0fe`) |
| R3 | **클립보드 덮어쓰기** | `/message` 호출 시마다 | PC에서 복사해 둔 내용 사라짐 | 원격 작업 중 PC 클립보드 사용 자제 | UI 안내 문구 (B모드 하단) |
| R4 | **잘못된 Cursor 창** | Cursor 창 여러 개, `/setup` 창 미선택 | 다른 프로젝트 Agent로 입력 | PC `/setup`에서 **대상 창** 확인 | `targetWindowTitle` + 모니터별 자동 선택 |
| R5 | **inputOffset 오차** | 해상도·창 크기·UI 변경 | 클릭이 입력창 밖 | `calibrate` / `config.json` 재조정 | `POST /focus/dry-run` |
| R6 | **집중 모드 한계** | 「집중」ON이어도 알림은 막지 못함 | R1과 동일 | 알림 끄기·방해 금지 | `minimizeOthers`는 선택 (기본 OFF) |

**실증 (2026-06-29):** 카카오톡 알림 직후 전송 → 실패·지연. **알림이 닫힌 뒤** 전송 → 정상.

---

## 2. B모드 — MJPEG 영상 (`/`)

| # | 문제 | 언제 | 증상 | 대응 | 완화 |
|---|------|------|------|------|------|
| R10 | **LTE에서 끊김·저 FPS** | 이동 중, 약한 신호 | 화면 멈춤·2fps 수준 | 「재연결」, Freeze 후 라이브 | 캡처/전송 분리, scale 0.85 (`103008b`) |
| R11 | **Safari 백그라운드** | 앱 전환·잠금 | 스트림만 끊김 (토큰은 유지) | Safari 다시 열기 | `visibilitychange` 재연결 |
| R12 | **Freeze 후 라이브** | iOS Safari | 라이브 버튼 무반응 | Safari 새로고침 | `replaceStreamImg()` (`72afdfc`) |
| R13 | **실시간 채팅 UX 부적합** | Agent 답변 따라가기 | 글자 막 나옴·답답함 | **C모드 `/chat` 사용** | 구조적 한계 (MJPEG) |

---

## 3. C모드 — DB 텍스트 채팅 (`/chat`)

| # | 문제 | 언제 | 증상 | 대응 | 완화 |
|---|------|------|------|------|------|
| R20 | **QR이 B모드로 연결** | `/setup` QR 기본 | 영상만 보임, 말풍선 없음 | 주소에 **`/chat`** 또는 B모드 「채팅」 링크 | setup·툴바 링크 (`4988a61`) |
| R21 | **세션 ≠ inject 대상** | 모바일에서 세션 A 선택, PC는 세션 B 활성 | 채팅은 A, 입력은 B | PC Cursor에서 **같은 세션** 선택 | `/chat/inject-status` 배너 |
| R22 | **WAL·폴링 지연** | Cursor DB 커밋 지연 | 새 답변 1~5초 늦게 | 잠시 대기 | WAL watch + SSE + `since` 증분 |
| R23 | **Cursor DB 스키마 변경** | Cursor 업데이트 | 세션/말풍선 0건 | 기획서 §2.3 재확인 | `node:sqlite` read-only |
| R24 | **빈 tool/thinking bubble** | Agent 내부 메시지 | (과거) 빈 말풍선 | — | `text.trim()` 필터 |

---

## 4. 연결 · 인증 · 운영

| # | 문제 | 언제 | 증상 | 대응 | 완화 |
|---|------|------|------|------|------|
| R30 | **페어링 코드 1회용** | QR 스캔 후 | `/setup` 코드 「사용됨」 | 새 코드 생성 | 정상 동작 |
| R31 | **Bridge 재시작** | PC 재부팅·터미널 종료 | iPhone 전체 끊김 | PC Bridge 실행, QR 재연결 | `start-bridge.bat`, `.bridge-secret` 유지 |
| R32 | **Tailscale 미연결** | PC/iPhone TS 꺼짐 | 연결 불가 | Tailscale ON, `.env` `TAILSCALE_IP` | Health 패널 |
| R33 | **PC 절전·잠금** | Win+L, 절전 | inject·캡처 불가 | PC 깨우기 | Bridge는 **모니터 꺼짐만** 방지 (시스템 절전 X) |
| R34 | **JWT 30일** | 장기 미사용 | 401 → 페어링 화면 | `/setup` 재연결 | `localStorage` + httpOnly cookie |
| R35 | **Bridge exit `4294967295`** | Windows에서 프로세스 종료 | 터미널 빨간 코드 | **오류 아님**, Bridge 재실행 | — |
| R36 | **스모크 test:pair** | 개발 중 테스트 실행 | 페어링 코드 소모 | `/setup` 새 QR | localhost 전용 regenerate |

---

## 5. 보안 · 환경 (MVP 수준)

| # | 문제 | 비고 |
|---|------|------|
| R40 | Tailscale 외 LAN 노출 | pairing/regenerate/window는 localhost·setup token 가드 |
| R41 | `config.json`·`.env` | git 제외, 로컬만 |
| R42 | Windows 전용 inject | macOS/Linux Bridge는 캡처·C모드 read만 가능, inject 불가 |
| R43 | Node 22+ | C모드 `node:sqlite` (Experimental API) |

---

## 6. 미구현 (문제가 아니라 범위 밖)

- iPhone **푸시 알림** (새 Agent 답변)
- B/C **한 화면 탭 통합**
- Cursor **자동 기동**
- **G6** Windows installer / 트레이
- PC **화면 잠금** 중 원격 제어

---

## 7. 문제 발생 시 빠른 체크

```
1. PC: Bridge 3921 실행 중?  Cursor 실행 중?
2. iPhone: Tailscale ON?  /health 또는 상태 점(●) 확인
3. 전송 실패: PC 알림·팝업 닫았는지?  /setup 창 선택 맞는지?
4. 영상만 보임: /chat 인지?  QR은 B모드(/)로 연결됨
5. 무한 「전송 중…」: 25초 대기 → 오류 확인 → Safari 새로고침
```

상세 WP 검증: [wp_verify_runbook.md](wp_verify_runbook.md)

---

## 8. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-29 | 초안 — 카카오톡 포커스·inject 타임아웃·B/C 분리·MJPEG 한계 반영 |
