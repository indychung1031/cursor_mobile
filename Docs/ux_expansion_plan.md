# Cursor Mobile — 사용성 확장 기획서

| 항목 | 내용 |
|------|------|
| 문서 버전 | v1.4.0 |
| 작성일 | 2026-06-28 |
| 기반 문서 | [기획서.md](기획서.md) v0.7.4 |
| 프로젝트명 | **cursor_mobile** |
| 상태 | **Phase 1.5 MVP 확정 — Slice A·B·C·F1 착수** |

> **문서 규칙:** 모든 문서는 `Docs/` 폴더에만 저장한다. 인덱스는 [README.md](README.md).

---

## 변경 이력

| 버전 | 날짜 | 주요 변경 |
|------|------|-----------|
| v1.0.0 | 2026-06-28 | 초안 — 접속 UX, 4G/5G, 무료 배포, 광고, 채팅 스크롤/세션 검토 |
| v1.1.0 | 2026-06-28 | **§7 Agent 세션 선택** — 모바일 세션 목록·전환 UX, API·로드맵 추가 |
| v1.2.0 | 2026-06-28 | **§9~16 기능 고도화** — 집중 모드, Agent 승인, QR 자동 페어링, Health, Freeze, 푸시, 듀얼 탭, 수익·페르소나·테스트 |
| v1.3.0 | 2026-06-28 | **§17 Work Package** — 0.5~2일 단위 작업 쪼개기, Slice·선행·완료 기준 |
| v1.3.1 | 2026-06-28 | **[wp_verify_runbook.md](wp_verify_runbook.md)** + Bridge `/dev` — WP별 PC·iPhone 검증 절차 |
| v1.4.0 | 2026-06-28 | **§17.1 MVP 공식 범위** — D/E는 1.5+ · 집중 모드 기본값 · [spike_phaseA_checklist.md](spike_phaseA_checklist.md) |

---

## 1. 배경 — Phase 1에서 확인된 문제

Phase 1 B-mode(MJPEG + 클립보드 inject)는 **동작 검증 완료** 상태이나, 실사용에서 아래 UX 한계가 확인되었다.

| # | 문제 | 영향 |
|---|------|------|
| P1 | **접속·페어링이 어렵다** | Tailscale 창·터미널·IP 주소를 사용자가 직접 찾아야 함 |
| P2 | **Tailscale 인식 혼란** | 6자리 코드가 Tailscale 앱에 있다고 오해 |
| P3 | **Bridge 재시작 시 연결 끊김** | 토큰·페어링 코드 재입력 (일부 개선: `/setup`, JWT 파일 저장) |
| P4 | **다중 창·다중 모니터** | 입력이 Cursor가 아닌 다른 앱(카카오톡, 터미널)으로 감 → 뒤 창 최소화 필요 |
| P5 | **채팅 히스토리 검토 불가** | 고정 crop 영상만 표시 → **위로 스크롤 불가**, 긴 세션 내용 확인 어려움 |
| P6 | **4G/5G 필수** | 집 밖에서도 PC Cursor Agent에 접근해야 함 |
| P7 | **Agent 세션 전환 불가** | PC에서만 세션(대화 스레드) 선택 가능 — 모바일은 **현재 열린 세션 1개**만 봄 |
| P8 | **Agent 승인·Run 대화 상호작용** | diff Accept, Run command 등 **PC에서만** 클릭 가능 |
| P9 | **입력 시 다른 창 간섭** | 카카오톡·터미널 등 뒤 창 → **수동 최소화** 필요 (Phase 1 workaround) |
| P10 | **Agent 응답 대기 UX** | 모바일 백그라운드 시 스트림 끊김 → **응답 완료 알림** 없음 |

### 사용자 요구 (2026-06-28)

1. **PC ↔ iPhone 연결이 매우 쉬워야 한다**
2. **4G/5G(LTE)에서도 접속** 가능해야 한다 (Tailscale급)
3. **가능한 한 무료** 인프라·배포
4. **홈페이지 배포** + **상업용 광고** 수익 모델 검토
5. **세션 내용을 위아래로 검토**할 수 있어야 한다
6. **모바일에서 Agent 세션 선택·전환**이 가능해야 한다
7. **(v1.2)** 모바일만으로 Agent **승인·Run** 등 상호작용
8. **(v1.2)** 입력·접속·상태 확인을 **수동 workaround 없이** 사용

---

## 2. 목표 · 비목표

### 목표 (Phase 1.5 ~ 2)

| ID | 목표 | 성공 기준 |
|----|------|-----------|
| G1 | **3분 이내** 최초 연결 (PC Bridge 실행 → iPhone에서 채팅 보기) | 신규 사용자 테스트 n=3 통과 |
| G2 | **4G/5G 접속** | LTE에서 MJPEG + 메시지 전송 E2E 성공 |
| G3 | **재접속 30초 이내** | 홈 화면 PWA 탭 → 바로 스트림 (페어링 유지) |
| G4 | **채팅 히스토리 검토** | 모바일에서 이전 Agent 응답 **읽기 가능** (스크롤 또는 텍스트 UI) |
| G5 | **무료 운영** | 월 고정비 **$0** (개인 사용 규모) |
| G6 | **공개 랜딩** | Netlify 등 무료 호스팅 + 광고 슬롯 |
| G7 | **Agent 세션 선택** | 모바일에서 **2개 이상** 세션 목록 확인 → 탭 한 번으로 전환 |
| G8 | **Agent UI 상호작용** | Accept / Reject / Run 등 **핵심 버튼** 모바일에서 1탭 | 
| G9 | **무간섭 입력** | 뒤 창 수동 최소화 **없이** 메시지 전송 성공 |
| G10 | **응답 알림** | Agent 응답 완료 시 iPhone **푸시 또는 배너** |
| G11 | **최초 연결 30초** | QR 스캔 **원터치 페어링** (코드 입력 fallback) |

---

### 비목표 (본 문서 범위 밖)

- Win+L 잠금 화면 지원 (기존 Phase 3 백로그)
- iOS 네이티브 앱 스토어 배포 (PWA 우선 유지)
- 다중 사용자 SaaS·과금 구독 (1인·소규모 개인용)
- Cursor 공식 API 미공개 전 **완전 안정적** A-mode 보장

---

## 3. 제품 비전 (확장 후)

> **「QR 한 번, 어디서든 Cursor Agent — 읽고, 보내고, 검토한다」**

```
┌─────────────────────────────────────────────────────────────┐
│  [Netlify] cursor-mobile.app (랜딩 + PWA + 광고)              │
│    · 설치 가이드 · QR 온보딩 · 홈 화면 추가 안내              │
└──────────────────────────┬──────────────────────────────────┘
                           │ (최초) PC 주소/QR 등록
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  [PC] Bridge (상시 실행 · 트레이)                             │
│    · /setup · MJPEG · inject · scroll · **session** API    │
└──────────────────────────┬──────────────────────────────────┘
                           │ 4G/5G 터널
              ┌────────────┴────────────┐
              ▼                         ▼
     [Tailscale mesh]          [Cloudflare Tunnel]  ← 선택/병행
              │                         │
              └────────────┬────────────┘
                           ▼
                   [ iPhone Safari PWA ]
                     · 스트림 / 스크롤 / **세션 선택** / 입력
```

---

## 4. 접속 UX — 「연결이 편해야 한다」

### 4.1 이상적인 온보딩 플로우 (목표: 3분)

```
[PC] Bridge 설치/실행 (부팅 시 자동)
       ↓
[PC] 브라우저 자동 열림 → localhost:3921/setup
       · 6자리 코드 (대형)
       · QR: Tailscale URL
       · QR: 같은 Wi-Fi URL
       · 「연결 카드」PNG 저장
       ↓
[iPhone] QR 스캔 또는 PWA 실행
       ↓
[iPhone] 코드 6자리 입력 (또는 QR에 코드 embedded deep link)
       ↓
[iPhone] 홈 화면에 추가 안내 → 완료
```

### 4.2 Phase 1.5 기능 목록 (접속)

| 우선 | 기능 | 설명 | 예상 |
|------|------|------|------|
| P0 | **`/setup` v2** | QR 2종, 연결 카드 PNG, Cursor 창 목록에서 `targetWindowTitle` 선택 | 1일 |
| P0 | **Bridge 트레이 앱** | 코드 보기, 상태, 재시작 (터미널 불필요) | 1~2일 |
| P0 | **PWA manifest** | 홈 화면 아이콘, standalone 모드 | 0.5일 |
| P1 | **Deep link** | `cursor-mobile://pair?host=&code=` (iOS Shortcut 연동) | 1일 |
| P1 | **자동 URL 탐색** | LAN mDNS `desktop.local` + Tailscale IP `.env` 자동 | 1일 |
| P2 | **기기 등록 DB** | 재페어링 최소화 (로컬 JSON → 선택적 Supabase free) | 2일 |

### 4.3 4G/5G 원격 접속 — 터널 전략

Bridge는 **PC localhost:3921**에 상주하므로, 외부(4G/5G) 접속에는 **터널 또는 VPN**이 필수이다.

#### 옵션 비교

| 방식 | 4G/5G | iPhone 앱 | 월 비용 | 난이도 | 권장 |
|------|-------|-----------|---------|--------|------|
| **Tailscale** (현재) | ✅ | Tailscale 앱 필요 | **$0** (Personal, 100 device) | 낮음 | ✅ **1차 유지** |
| **Cloudflare Tunnel** | ✅ | **불필요** (HTTPS URL) | **$0** (free tier) | 중간 | ✅ **2차 병행** |
| **ngrok free** | ✅ | 불필요 | $0 (세션 URL 변경) | 낮음 | ❌ URL 자주 바뀜 |
| **공유기 포트포워딩** | ✅ | 불필요 | $0 | 중 | ❌ 보안·IP 변경 |

#### 권장: **하이브리드 터널**

| 환경 | 경로 |
|------|------|
| 집 Wi-Fi | `http://192.168.x.x:3921` (Tailscale 불필요, 지연 최소) |
| 4G/5G (앱 OK) | `http://100.x.x.x:3921` (Tailscale) |
| 4G/5G (앱 싫음) | `https://bridge.yourdomain.com` (Cloudflare Tunnel) |

**Cloudflare Tunnel 무료 조건:** Cloudflare 계정, 도메인(무료 DNS 가능), PC에 `cloudflared` 상시 실행.

### 4.4 Tailscale 「창이 안 열린다」 대응

Tailscale **서비스만 Running**이면 접속 가능 — GUI 불필요.

| 조치 | 내용 |
|------|------|
| 문서·UI | 「Tailscale 창 필요 없음」 명시 (`/setup`, 랜딩) |
| Bridge health | Tailscale IP·연결 상태 표시 |
| 대안 URL | CF Tunnel URL을 `/setup`에 병기 |

---

## 5. 무료 배포 · 홈페이지 · 광고

### 5.1 배포 가능한 것 vs 불가능한 것

| 구성 | 호스팅 | 비용 | 비고 |
|------|--------|------|------|
| **랜딩·가이드·PWA shell** | Netlify / Vercel / Cloudflare Pages | **$0** | 정적 사이트 |
| **Bridge (stream/inject)** | **사용자 PC** | $0 | 클라우드 이전 불가 |
| **Tailscale** | Tailscale | $0 | Personal plan |
| **CF Tunnel** | Cloudflare | $0 | free tier |
| **도메인** | Cloudflare Registrar 등 | ~$10/년 | **선택** (무료 subdomain 가능) |

> **중요:** MJPEG·화면 캡처는 **PC Bridge**에서만 가능. Netlify는 **클라이언트 UI·온보딩·광고**만 호스팅한다.

### 5.2 사이트 구조 (제안)

```
cursor-mobile.app/          ← Netlify (무료)
├── index.html              랜딩 + 광고
├── setup/                  PC Bridge 설치 가이드
├── connect/                iPhone 연결 가이드 (QR 설명)
├── app/                    PWA shell (Bridge URL 입력·저장)
├── privacy.html            개인정보 (광고·Analytics)
└── ads.txt                 AdSense용
```

**PWA shell 동작:** 사용자가 최초 1회 Bridge URL 저장 → 이후 `app/`에서 iframe 또는 redirect로 PC Bridge (`/`) 로드.

### 5.3 상업용 광고 (수익)

| 항목 | 내용 |
|------|------|
| **추천** | Google AdSense (가장 일반적) |
| **배치** | 랜딩 하단, 가이드 페이지 사이드, PWA **입력창 위** 비침범 배너 |
| **주의** | AdSense는 **콘텐츠·트래픽·정책** 심사 — 개인 도구만 있는 사이트는 승인 어려울 수 있음 |
| **대안** | Carbon Ads (dev), 직접 스폰서, Affiliate (Tailscale referral 등) |
| **법적** | 개인정보처리방침, 쿠키 동의 (EU/GDPR), 한국 개인정보보호법 고지 |

**현실적 기대:** 초기 트래픽 낮음 → **광고 수익은 부수적**, 주 목적은 **서비스형 UX·신뢰·가이드**.

### 5.4 무료 스택 요약 (월 $0 목표)

| 레이어 | 선택 |
|--------|------|
| PC Bridge | Node.js (로컬) |
| 원격 터널 | Tailscale + (선택) CF Tunnel |
| 웹 호스팅 | Netlify Free |
| DNS | Cloudflare Free |
| Analytics | Plausible self-host 또는 GA4 free |
| 광고 | AdSense (승인 후) |

---

## 6. 채팅 히스토리 · 스크롤 — 「세션 검토」

### 6.1 문제 정의

현재 B-mode는 **고정 `region` crop**의 MJPEG만 전송한다.

| 한계 | 원인 |
|------|------|
| 위쪽 대화 안 보임 | crop 영역 = 현재 뷰포트 일부, **스크롤 상태 고정** |
| 모바일에서 스크롤 불가 | 이미지 `<img>` — Agent 패널 스크롤과 **미연동** |
| pinch zoom만으로 부족 | 확대해도 **캡처 시점의 영역 밖** 내용은 없음 |

### 6.2 해결 방향 (3트랙)

#### 트랙 A — B-mode 확장: **원격 스크롤** (Phase 1.5~2, 단기)

모바일 제스처 → Bridge API → PC Cursor Agent 패널 스크롤.

```
[iPhone] 두 손가락 스와이프 / 스크롤 버튼
    ↓ POST /scroll { deltaY: -300 }
[Bridge] inject scroll at chat panel coords
    ↓ wheel event 또는 Page Up/Down / drag
[Cursor Agent 패널] 스크롤
    ↓ 다음 MJPEG 프레임
[iPhone] 갱신된 영역 표시
```

| API (안) | 설명 |
|----------|------|
| `POST /scroll` | `{ deltaY, mode: "wheel" \| "page" \| "home" \| "end" }` |
| `POST /scroll/to` | `{ ratio: 0.0~1.0 }` — 패널 내 상대 위치 |

**UI (모바일):**
- 스트림 영역 위 **반투명 스크롤 버튼** (↑ ↓)
- 스트림 **세로 스와이프** → `/scroll`
- **「맨 위」「맨 아래」** 빠른 이동

**장점:** A-mode 없이 구현 가능, Phase 1 자산 재사용  
**단점:** 여전히 이미지 기반, 스크롤+스트림 지연, inject 충돌 주의

**예상:** 2~3일

---

#### 트랙 B — **캡처 영역 확대 + 모바일 뷰포트** (Phase 1.5, 보조)

| 방식 | 설명 |
|------|------|
| **Tall crop** | `region.height` 늘려 Agent 패널 전체(스크롤 포함 가능 높이) 캡처 — **성능·대역폭↑** |
| **모바일 pan/zoom** | 큰 이미지를 CSS transform으로 이동 — **이미 캡처된 범위 내**만 |
| **적응형 region** | 스크롤 API와 연동해 crop `y` 오프셋 변경 |

단독으로는 **근본 해결 불가** — 트랙 A와 병행.

---

#### 트랙 C — A-mode: **텍스트 채팅 UI** (Phase 2, 중기 · 근본)

Extension이 Agent 대화 **텍스트**를 추출 → 모바일 **네이티브 스크롤 말풍선 UI**.

| 항목 | 내용 |
|------|------|
| UX | 카카오톡式 — 무한 스크롤, 텍스트 선택, 검색 가능 |
| 스트림 | **선택적** — diff 승인·이미지 확인 시에만 B-mode 탭 |
| 선행 | [spike_phaseA_report.md](spike_phaseA_report.md) (미작성) — DOM/API 스파이크 **필수** |

**장점:** 세션 검토·가독성 **최상**  
**단점:** Cursor 업데이트 리스크, 개발량 2~4주+

---

### 6.3 권장 로드맵 (채팅 검토)

```
Phase 1.5  트랙 A (원격 스크롤 API + 모바일 UI)     ← 즉시 체감 개선
     +
           트랙 B (region 튜닝, pinch pan)          ← 보조
Phase 2    트랙 C 스파이크 → A-mode 텍스트 UI       ← 근본 해결
```

---

## 7. Agent 세션 선택 — 「모바일에서 대화 스레드 전환」

### 7.1 문제 정의

Cursor Agent는 **여러 채팅 세션(스레드)** 을 유지한다. 각 세션은 프로젝트·주제별 Agent 대화에 해당한다.

| 현재 | 원하는 UX |
|------|-----------|
| PC에서 수동으로 세션 클릭 | iPhone에서 **세션 목록** → 탭 → 해당 세션 스트림 |
| 스트림 = PC에 **현재 열린** 세션만 | `cursor_mobile` / `pdf-toolbox` 등 **전환** |
| 세션 제목·개수 모름 | 목록에 **제목·(선택) 미리보기** |

> **용어:** 본 문서의 「세션」= Cursor Agent 패널의 **채팅 스레드**(History 항목). Browser 탭·Cursor **창**(`targetWindowTitle`)과는 다름.

### 7.2 Cursor UI 구조 (B-mode 가정)

```
┌─ Agent 패널 ─────────────────────────┐
│ [History ≡]  [New Agent]             │  ← 세션 목록 토글
├──────────────────────────────────────┤
│  (세션 목록 드로어 — 열리면 좌측/전체)   │
│  · cursor_mobile                     │
│  · pdf-toolbox                       │
│  · antigravity                       │
├──────────────────────────────────────┤
│  현재 세션 대화 내용                    │  ← MJPEG crop 대상
│  ...                                 │
│  [입력창]                             │
└──────────────────────────────────────┘
```

### 7.3 구현 트랙

#### 트랙 S1 — B-mode: **좌표 기반 세션 전환** (Phase 1.5, MVP)

Bridge가 PC Cursor UI를 **클릭·키 입력**으로 조작한다. (메시지 inject와 동일 계열)

```
[iPhone] 툴바 [세션 ▼] → 목록 표시
    ↓ GET /sessions  또는  사전 등록 슬롯
[iPhone] 「pdf-toolbox」 탭
    ↓ POST /session/select { id: "slot-2" }
[Bridge] 1) History 버튼 클릭  2) N번째 항목 클릭  3) 패널 닫기
    ↓ MJPEG
[iPhone] 선택한 세션 화면
```

| API (안) | 설명 |
|----------|------|
| `GET /sessions` | 세션 목록 반환 (Phase 1.5는 **등록 슬롯**, Phase 2는 Extension/OCR) |
| `POST /session/open-list` | History 드로어 열기 (inject) |
| `POST /session/select` | `{ slotIndex }` 또는 `{ titleContains }` |
| `GET /session/current` | 현재 세션 제목 (OCR 또는 Extension) |

**Phase 1.5 MVP — 「등록 슬롯」방식 (권장):**

`/setup`에서 사용자가 **자주 쓰는 세션 3~5개**를 등록한다.

```json
{
  "sessionSlots": [
    { "label": "cursor_mobile", "titleContains": "cursor_mobile", "listIndex": 0 },
    { "label": "pdf-toolbox", "titleContains": "pdf", "listIndex": 1 }
  ],
  "sessionUi": {
    "historyButton": { "xRatio": 0.05, "fromTop": 48 },
    "listItemHeight": 56,
    "listStart": { "xRatio": 0.15, "yRatio": 0.18 }
  }
}
```

| 장점 | 단점 |
|------|------|
| Extension 불필요 | Cursor UI 변경 시 좌표 재튜닝 |
| Phase 1 inject 재사용 | 목록 **자동 동기화** 어려움 |
| 빠른 구현 (2~3일) | 세션 많으면 슬롯 수동 관리 |

**모바일 UI (안):**

```
┌─────────────────────────────┐
│ ● [Display▼] [세션: cursor_mobile ▼] │
├─────────────────────────────┤
│      (MJPEG 스트림)          │
├─────────────────────────────┤
│  [↑][↓]  스크롤              │
│  [메시지 입력] [전송]         │
└─────────────────────────────┘

세션 ▼ 탭 시 bottom sheet:
  ● cursor_mobile      ← 현재
  ○ pdf-toolbox
  ○ antigravity
  ─────────────
  [목록 새로고침]  [PC에서 History 열기]
```

---

#### 트랙 S2 — B-mode+: **세션 목록 OCR** (Phase 1.5~2, 선택)

History 드로어를 연 채 **crop 캡처 → OCR** → 제목 텍스트 목록을 `/sessions`로 반환.

| 장점 | 단점 |
|------|------|
| 슬롯 수동 등록 불필요 | OCR 오인식·느림 (1~2초) |
| 실제 PC 목록과 동기화 | Cursor 다크테마·한글 제목 품질 |

**권장:** S1 MVP 후 **사용자 피드백** 보고 S2 검토.

---

#### 트랙 S3 — A-mode: **Extension 세션 API** (Phase 2, 근본)

```
[Extension] DOM에서 세션 목록·active id 읽기
     ↕
[Bridge] GET /sessions → JSON [{ id, title, updatedAt }]
         POST /session/select { id }
[iPhone] 네이티브 리스트 UI · 검색 · 최근 순
```

| 장점 | 단점 |
|------|------|
| 제목·개수 **정확** | 스파이크·유지보수 |
| 클릭 inject 불필요 | Cursor 업데이트 리스크 |
| 스크롤·세션·텍스트 UI **통합** | 개발 2~4주 |

### 7.4 `targetWindowTitle` vs `session` 관계

| 개념 | 설정 | 역할 |
|------|------|------|
| **Cursor 창** | `targetWindowTitle: "cursor_mobile"` | inject·캡처 대상 **윈도우** |
| **Agent 세션** | `sessionSlots[]` / Extension id | **같은 창 안** 채팅 스레드 전환 |

다중 Cursor **창**이 필요하면 Phase 2에서 `windowProfiles[]` (창 제목 + 세션 슬롯 묶음) 검토.

### 7.5 권장 로드맵 (세션 선택)

```
Phase 1.5  S1 등록 슬롯 + POST /session/select + 모바일 dropdown   ← MVP
     +
           S1 sessionUi 좌표 calibrate (/setup 위저드)
Phase 1.5+ S2 OCR 목록 (선택)
Phase 2    S3 Extension — 동적 목록 · 검색 · A-mode 통합
```

**예상 (S1 MVP):** 2~3일 (scroll API·inject 공유)

### 7.6 완료 기준 (세션)

- [ ] 모바일에서 **등록된 2개 이상** 세션 이름 표시
- [ ] 탭 1회 → **3초 이내** 스트림이 해당 세션으로 전환
- [ ] 전환 후 **메시지 전송**이 올바른 세션 입력창으로 감
- [ ] 잘못된 세션/포커스 시 모바일에 **명확한 에러**

---

## 8. 입력 안정성 · 집중 모드

Phase 1에서 **뒤 창 최소화** 시 정상 동작 확인 — v1.2에서 **자동화**한다.

| 개선 | 설명 | Phase |
|------|------|-------|
| `targetWindowTitle` + `inputOffset` | ✅ 적용됨 | 1 |
| **집중 모드 (Focus Mode)** | `POST /focus/prepare` — **Cursor 전면 포커스** (기본: 다른 창 최소화 **안 함**) | **1.5 MVP** |
| **전송 preflight** | 포커스·좌표 검증 실패 → 모바일 에러 | 1.5 |
| `/setup` 창·세션 UI | config 수동 편집 제거 | 1.5 |
| A-mode inject 제거 | 클립보드·클릭 불필요 | 2 |

### 8.1 집중 모드 — P0

실사용: Phase 1에서 **뒤 창 수동 최소화** workaround → **Cursor 전면 포커스 자동화** (G9: 뒤 창은 **그대로** 두는 것이 기본).

| API | 설명 |
|-----|------|
| `POST /focus/prepare` | `{ "minimizeOthers": false }` **(기본)** — Cursor만 전면. `true`는 **선택** (다른 창 일괄 최소화, aggressive) |
| `GET /focus/status` | `{ cursorFocused, interferingWindows }` |

모바일: 입력창 **「집중」** 토글 — ON이면 매 전송 전 `focus/prepare` (기본 `minimizeOthers: false`).

---

## 9. Agent UI 상호작용 (Accept · Run · Reject)

| API | 설명 |
|-----|------|
| `POST /action/click` | `{ "action": "accept" \| "reject" \| "run" }` |

모바일: 스트림 하단 **[Accept] [Reject] [Run]** — `config.actionButtons` 좌표 calibrate.

Phase 2: A-mode Extension이 버튼 상태 JSON 제공.

---

## 10. 연결 · 상태 UX

### 10.1 QR 원터치 페어링 (P0)

QR에 `host + port + code` 포함 → iPhone 스캔 **자동 페어링** (6자리 입력은 fallback). 목표 **G11: ≤ 30초**.

### 10.2 Health 패널

`GET /health` 확장 — Bridge / Cursor / Tailscale / streamFps / lastInjectError. 모바일 상태 dot 탭 → 상세 + 조치 안내.

### 10.3 iOS Shortcuts (Phase 2)

「Cursor Mobile 열기」「메시지 보내기」「집중 후 전송」

---

## 11. 모바일 뷰어 고도화

| 기능 | Phase | 설명 |
|------|-------|------|
| **Freeze & Pinch** | 1.5 | 탭=일시정지, 핀치=확대 읽기 |
| **적응형 스트림** | 2 | Wi-Fi 고화질 / LTE 저FPS·저화질 |
| **WebRTC H.264** | 3 | 대역폭 50~70%↓ |

---

## 12. 알림 · 보안 · 설치

| 기능 | Phase | 설명 |
|------|-------|------|
| **Web Push / ntfy** | 2 | Agent 응답 완료 알림 |
| **오프라인 메시지 큐** | 2 | 재연결 시 순차 전송 |
| **`/devices` revoke** | 2 | 기기 토큰 폐기 |
| **CF Access** | 2 | Tunnel URL 2차 인증 |
| **Windows installer** | 2 | exe / winget |

---

## 13. 듀얼 탭 · 메시지 편의

### 13.1 듀얼 탭 (Phase 2)

| 탭 | 모드 | 용도 |
|----|------|------|
| **채팅** | A-mode | 말풍선·스크롤·검색 |
| **화면** | B-mode | diff·Run·Accept |

### 13.2 세션 · 메시지

- `POST /session/new`, 세션 검색·고정·최근 5개
- **메시지 템플릿** — 「계속해」「lint 수정」원탭
- `windowProfiles[]` — 창+세션 묶음

---

## 14. 수익 · Analytics · 메타

### 14.1 수익 (§5.3 확장)

AdSense + **Carbon Ads** + Affiliate + SEO **튜토리얼 10편+** (AdSense 승인용).

### 14.2 Analytics

GA4 (랜딩) + Bridge 주간 요약 (`/setup`).

---

## 15. 페르소나 · 경쟁 · 폴백

| 페르소나 | 니즈 |
|----------|------|
| **P-A** 출퇴근 5G | 빠른 연결, 푸시, 세션 전환 |
| **P-B** 집 Wi-Fi | 고화질, Freeze |
| **P-C** 다중 모니터 | 집중 모드, windowProfiles |

**폴백:** inject 반복 실패 → RustDesk 링크 (`/setup`); A-mode No-Go → B-mode 유지.

---

## 16. 접근성 · i18n · 업데이트

큰 글씨·고대비 (Phase 2), UI ko/en, Bridge **auto-update** (GitHub Releases), E2E — [부록 D](#부록-d--e2e-테스트-체크리스트).

---

## 17. 개발 작업 단위 (Work Packages)

> **원칙:** 한 WP = **0.5~2일**, **단독 테스트 가능**, **PR 1개** 권장.  
> Phase 1.5는 **Slice A→F** 순서. Slice 내부 WP는 표 순서 또는 병렬(선행 없음).  
> **검증:** [wp_verify_runbook.md](wp_verify_runbook.md) + `npm run dev:verify` → http://localhost:3921/dev

### 17.0 WP 하나씩 확인하는 방법

```
구현 → /dev 또는 runbook 「PC에서」 → iPhone 「iPhone에서」 → 부록 G ☑ → 다음 WP
```

| 도구 | 용도 |
|------|------|
| [wp_verify_runbook.md](wp_verify_runbook.md) | WP별 curl·URL·완료 ☑ |
| `/dev` (`BRIDGE_DEV=1`) | health·pair·message·stream 스모크 |
| `/setup` | QR·코드·창 선택 |
| iPhone Safari | 모바일 UX WP |

```powershell
cd packages\bridge
npm run dev:verify
```

merge 전 **Phase 1 회귀** 1분: runbook 하단 또는 `/dev` 「1~3 자동 실행」.  
WP 완료 시 `/dev` 해당 버튼 **활성화** (예: C1 후 scroll ↑↓).

### 17.1 Phase 1.5 MVP (공식 범위)

> **2026-06-28 확정** — 최종 검토 반영. MVP Go 전까지 **D·E 착수 금지**.

| 구분 | Slice / WP | 비고 |
|------|------------|------|
| **MVP ✅** | **A** A1~A4 (QR·pair·페어링 UX·창 선택) | A5 트레이는 MVP+ |
| **MVP ✅** | **B** B1~B3 (inject 공통·집중·토글) | `minimizeOthers` 기본 **false** |
| **MVP ✅** | **C** C1·C2·C3 (scroll API·모바일 UI·Freeze) | C4 pinch는 MVP+ |
| **MVP ✅** | **F** F1 (Health 패널) | F2~F4는 MVP+ |
| **1.5+ ⏸** | **D** 세션 전환 | **calibrate 위저드** + 1~2주 실사용 후 |
| **1.5+ ⏸** | **E** Accept/Run | 동일. Run 1종만 우선 |
| **1.5+ ⏸** | A5, C4, F2~F4 | 편의·선택 |

**MVP Gate (Phase 1.5 MVP Go):**

- [ ] Slice A Gate — QR → 스트림 ≤ 30초
- [ ] Slice B Gate — 뒤 창 유지 + 전송 3회 (`minimizeOthers: false`)
- [ ] Slice C Gate — 스크롤 **또는** Freeze로 이전 응답 읽기
- [ ] F1 — Health에서 Bridge/Cursor/Tailscale 확인

**MVP 이후 순서:** 실사용 1~2주 → calibrate 위저드 → D → E → **A-mode 스파이크** ([checklist](spike_phaseA_checklist.md)) → Phase 2 G/H

```
MVP:  A ──► B ──► C (+ F1)
1.5+:      (실사용) ──► calibrate ──► D ──► E
Phase 2:   MVP Go ──► H5 spike ──► (Go?) H6  |  No-Go → B-mode만
```

### 17.2 Slice 개요

| Slice | 테마 | WP 수 | 누적 목표 |
|-------|------|-------|-----------|
| **A** | 연결·온보딩 | 5 | QR/코드로 30초 이내 페어링 |
| **B** | 입력 안정 | 3 | 뒤 창 최소화 없이 전송 |
| **C** | 읽기(스크롤) | 4 | 위쪽 대화 확인 |
| **D** | 세션 전환 | 3 | 2개+ 세션 탭 전환 |
| **E** | Agent 버튼 | 2 | Run/Accept 1회 |
| **F** | 상태·마무리 | 4 | Health·LAN·PWA |
| **G** | Phase 2 (배포) | 6 | 랜딩·터널·광고 |
| **H** | Phase 2 (UX) | 6 | 푸시·A-mode 등 |

```
A ──► B ──► (C ∥ D) ──► E ──► F
              │   │
              └───┴── C와 D는 B 완료 후 병렬 가능
G, H는 F(또는 Phase 1.5 Go) 이후
```

---

### 17.3 Slice A — 연결·온보딩

| ID | 작업 | 예상 | 선행 | 완료 기준 |
|----|------|------|------|-----------|
| **WP-A1** | `/setup` QR PNG (Tailscale·LAN URL만) | 0.5d | — | PC에서 QR 2개 표시·스캔 시 URL 열림 |
| **WP-A2** | `/pair` 라우트 + URL `code` 자동 페어링 | 0.5d | A1 | `?code=` 접속 → 토큰 저장 → `/` 이동 |
| **WP-A3** | 모바일 페어링 UX (에러·재연결·만료) | 0.5d | A2 | 401 시 재연결 화면, 성공/실패 문구 |
| **WP-A4** | `/setup` 창 선택 UI → `targetWindowTitle` 저장 | 0.5d | — | 클릭 한 번으로 config 반영 |
| **WP-A5** | Bridge **트레이** (코드·재시작·브라우저 열기) | 1d | A1 | 터미널 없이 코드 확인 |

**Slice A Gate:** iPhone LTE → QR → 스트림 **≤ 30초**. → [runbook Slice A](wp_verify_runbook.md#slice-a--연결)

---

### 17.4 Slice B — 입력 안정 (집중 모드)

| ID | 작업 | 예상 | 선행 | 완료 기준 |
|----|------|------|------|-----------|
| **WP-B1** | `inject` 공통 모듈 (창 찾기·포커스·상대 클릭) | 1d | A4 | scroll/action에서 재사용 가능 |
| **WP-B2** | `POST /focus/prepare` + PowerShell | 1d | B1 | Cursor 전면 + (옵션) 다른 창 최소화 |
| **WP-B3** | 모바일 「집중」토글 + `/message` 연동 | 0.5d | B2 | ON 시 전송 전 auto focus; **3회 연속 성공** |

**Slice B Gate:** 카카오톡 등 뒤 창 **그대로** 두고 전송 성공.

---

### 17.5 Slice C — 읽기 (스크롤·Freeze)

| ID | 작업 | 예상 | 선행 | 완료 기준 |
|----|------|------|------|-----------|
| **WP-C1** | `POST /scroll` API + inject wheel | 1d | B1 | PC Agent 패널 스크롤 확인 |
| **WP-C2** | 모바일 ↑↓ 버튼 + 스와이프 | 0.5d | C1 | 10회 스크롤 후 상단 메시지 가독 |
| **WP-C3** | Freeze (스트림 pause + 마지막 frame) | 0.5d | — | 탭으로 고정, 「라이브」복귀 |
| **WP-C4** | Pinch zoom (CSS transform) | 0.5d | C3 | 고정 frame 확대·패닝 |

**Slice C Gate:** 스크롤 **또는** Freeze로 이전 Agent 응답 읽기 OK.

---

### 17.6 Slice D — 세션 전환

> **Phase 1.5+** — MVP Gate 통과 + calibrate 위저드 후 착수.

| ID | 작업 | 예상 | 선행 | 완료 기준 |
|----|------|------|------|-----------|
| **WP-D1** | `sessionSlots` config + `GET /sessions` | 0.5d | A4 | `/setup`에서 슬롯 3개 등록 |
| **WP-D2** | `POST /session/select` inject (History→클릭) | 1d | B1, D1 | PC에서 세션 전환 확인 |
| **WP-D3** | 모바일 세션 dropdown UI | 0.5d | D2 | 탭 1회 → 3초 이내 스트림 변경 |

**Slice D Gate:** 등록 2+ 세션 전환 + 전송이 **해당 세션**으로 감.

---

### 17.7 Slice E — Agent 버튼

> **Phase 1.5+** — Run 1종 우선. Accept/Reject는 A-mode 또는 calibrate 후.

| ID | 작업 | 예상 | 선행 | 완료 기준 |
|----|------|------|------|-----------|
| **WP-E1** | `POST /action/click` + `actionButtons` config | 1d | B1 | PC Accept/Run 클릭 1회 성공 |
| **WP-E2** | 모바일 [Accept][Run][Reject] 바 | 0.5d | E1 | Run 대화 1회 모바일만으로 진행 |

---

### 17.8 Slice F — 상태·마무리 (Phase 1.5)

| ID | 작업 | 예상 | 선행 | 완료 기준 |
|----|------|------|------|-----------|
| **WP-F1** | `/health` 확장 + 모바일 상태 패널 | 0.5d | — | Bridge/Cursor/Tailscale 표시 |
| **WP-F2** | LAN URL 자동 + 모바일 fallback 순서 | 0.5d | A2 | Wi-Fi 로컬 우선, 실패 시 Tailscale |
| **WP-F3** | PWA `manifest.json` + 아이콘 | 0.5d | — | 홈 화면 추가 시 standalone |
| **WP-F4** | (선택) CF Tunnel `scripts/cf-tunnel.ps1` | 0.5d | — | 문서+스크립트만 |

**Phase 1.5 Go/No-Go:** Slice A~F Gate 전부 + [부록 D](#부록-d--e2e-테스트) E2E.

---

### 17.9 Slice G — Phase 2 배포·인프라

| ID | 작업 | 예상 | 선행 | 완료 기준 |
|----|------|------|------|-----------|
| **WP-G1** | Netlify 랜딩 1페이지 | 0.5d | 1.5 Go | URL 공개 |
| **WP-G2** | PWA shell (Bridge URL 저장) | 1d | G1 | `app/` → redirect Bridge |
| **WP-G3** | 튜토리얼 3편 (설치·연결·FAQ) | 1d | G1 | AdSense 심사용 콘텐츠 |
| **WP-G4** | privacy + ads.txt | 0.5d | G1 | — |
| **WP-G5** | CF Tunnel 가이드 + 스크립트 | 1d | — | Tailscale 없이 HTTPS 접속 |
| **WP-G6** | Windows installer (exe 또는 winget) | 1~2d | F3 | 더블클릭 설치 |

---

### 17.10 Slice H — Phase 2 UX·A-mode

| ID | 작업 | 예상 | 선행 | 완료 기준 |
|----|------|------|------|-----------|
| **WP-H1** | 적응형 스트림 (wifi/lte profile) | 0.5d | C1 | LTE에서 FPS↓ 확인 |
| **WP-H2** | Web Push 또는 ntfy (응답 알림) | 1~2d | — | Agent idle → 알림 1회 |
| **WP-H3** | `/devices` revoke | 0.5d | — | 폐기 후 401 |
| **WP-H4** | 오프라인 메시지 큐 | 1d | B3 | 재연결 후 순차 전송 |
| **WP-H5** | **A-mode 스파이크** (1~2일) | 1~2d | **MVP Go** | [spike_phaseA_report.md](spike_phaseA_report.md) Go/No-Go |
| **WP-H6** | A-mode MVP + 듀얼 탭 | 2~4w | H5 Go | 채팅 탭 텍스트 스크롤 |

> H6은 스파이크 **Go**일 때만 착수. No-Go면 C+D+E로 Phase 2 제한.

---

> H6은 스파이크 **Go**일 때만 착수. No-Go면 B-mode(C·D·E inject)로 Phase 2 제한.  
> 스파이크 절차: [spike_phaseA_checklist.md](spike_phaseA_checklist.md)

---

### 17.11 MVP 착수 순서

```
WP-A1 → A2 → A3 → A4 → B1 → B2 → B3 → C1 → C2 → C3 → F1
```

**1~2일 체감:** A1+A2 → B2 → C1

**1.5+ (MVP Go 이후):** D1→D2→D3, E1→E2, A5, F2~F4

---

### 17.12 Phase 1.5 레거시 매핑

| 구 ID | Work Package |
|-------|----------------|
| 1.5-1 | A1, A2, A3, A4 |
| 1.5-2 | A5 |
| 1.5-3 | F3 |
| 1.5-4 | C1, C2 |
| 1.5-5 | D1, D2, D3 |
| 1.5-6 | B1, B2, B3 |
| 1.5-7 | F1 |
| 1.5-8 | C3, C4 |
| 1.5-9 | E1, E2 |
| 1.5-10 | F2 |
| 1.5-11 | F4 |

---

## 18. 통합 로드맵 (Slice 요약)

| Phase | Slice | 기간 (WP 합) |
|-------|-------|----------------|
| **1.5 MVP** | A·B·C·F1 | ~**12 WP** ≈ 2~3주 |
| **1.5+** | D·E·F 나머지 | MVP Go + calibrate 후 |
| **2** | G + H (선택) | MVP Go + H5 spike Go |
| **3** | WebRTC, 잠금, iOS 네이티브 | 별도 기획 |

**Go/No-Go (Phase 1.5 MVP):** §17.1 MVP Gate.  
**Go/No-Go (Phase 1.5 전체):** MVP + Slice D·E + 부록 D E2E.

---

## 19. 아키텍처 (Phase 2)

```
Netlify (랜딩·광고·PWA) → iPhone PWA (듀얼탭·집중·Freeze·푸시)
                              ↕
                    PC Bridge (/focus /action /scroll /session …)
                              ↕
                         Cursor Agent
                              ↕
              Tailscale · CF Tunnel · LAN
```

---

## 20. 비용 · 리스크

**Phase 1~2:** $0~$1/월 (도메인 선택 시).

**v1.2 추가 리스크:** Accept 좌표 변경 → calibrate; 집중 모드 과 aggressive → minimize 옵션; Web Push iOS → ntfy fallback.

---

## 21. KPI

| 지표 | 1.5 | 2 |
|------|-----|---|
| 최초 연결 | ≤ **30초** | ≤ 20초 |
| 무간섭 전송 | ≥ **90%** | ≥ 95% |
| Agent Run 모바일 | ≥ 1회 | ≥ 90% |
| 푸시→복귀 | — | ≤ 10초 |

---

## 22. 다음 액션

1. **WP-A1** 착수 — [runbook A1](wp_verify_runbook.md#wp-a1--setup-qr-png)  
2. MVP 순서 §17.11: A→B→C→F1 (**D·E 보류**)  
3. MVP Go 후 → [spike_phaseA_checklist.md](spike_phaseA_checklist.md)  
4. [implementation_plan.md](implementation_plan.md) v0.6 — MVP API 매핑

---

## 23. 관련 문서

| 문서 | 관계 |
|------|------|
| [기획서.md](기획서.md) | Phase 0~1 |
| [wp_verify_runbook.md](wp_verify_runbook.md) | **WP별 검증** (PC·iPhone·curl) |
| [spike_phaseA_checklist.md](spike_phaseA_checklist.md) | A-mode 스파이크 (MVP Go 후) |
| [implementation_plan.md](implementation_plan.md) | v0.6 갱신 예정 |
| [phase0_runbook.md](phase0_runbook.md) | 운영 |

---

## 부록 A — `/scroll` API

```http
POST /scroll  { "deltaY": -240, "mode": "wheel" }
POST /scroll/to  { "position": "top"|"bottom"|"ratio", "ratio": 0.0 }
```

---

## 부록 B — Netlify PWA shell

1. `cursor-mobile.app/app/` → Bridge URL 저장 → redirect `/`  
2. 광고: shell 상·하단 only

---

## 부록 C — `/session` API

`GET /sessions` · `POST /session/open-list` · `POST /session/select` — §7 및 v1.1 config 예시 참조.

---

## 부록 D — E2E 테스트

- [ ] QR 30초 페어링 · LTE 스트림  
- [ ] 집중 모드 3회 전송 (뒤 창 유지)  
- [ ] 스크롤·Freeze 가독 · 세션 전환  
- [ ] Accept/Run 1회 · (P2) 푸시·오프라인 큐·revoke

---

## 부록 E — `/focus` · `/action` API

```http
POST /focus/prepare  { "minimizeOthers": false }
POST /action/click   { "action": "accept"|"reject"|"run" }
```

---

## 부록 F — QR 페어링 URL

```
https://cursor-mobile.app/pair#host=100.x.x.x&port=3921&code=123456
http://100.x.x.x:3921/pair?code=123456  → auto pair
```

---

## 부록 G — Work Package 진행표 (템플릿)

| WP | 상태 | PR | 비고 |
|----|------|-----|------|
| A1 | ☐ | | |
| A2 | ☐ | | |
| … | | | |

**상태:** ☐ 대기 · ◐ 진행 · ☑ 완료 · ✗ 보류

---

*본 문서 v1.4.0 — Phase 1.5 **MVP(A·B·C·F1)** 확정, D/E는 1.5+.*
