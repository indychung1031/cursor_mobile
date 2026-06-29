# C모드 — 분리 개발 계획

| 항목 | 내용 |
|------|------|
| 상태 | **스파이크 Go + hotfix 적용** |
| 기반 | [기획서 §2.3 C모드](기획서.md) |

---

## 원칙

1. **B모드(Phase 1.5 MVP) 코드·동작은 변경하지 않는다.** `/` = MJPEG + inject 그대로.
2. C모드는 **`packages/bridge/src/chat/`** 아래에만 추가한다.
3. **`BRIDGE_CHAT=1`** 일 때 C API·UI 활성화. `start-bridge.bat` 기본 ON.
4. 통합(듀얼 탭)은 iPhone 실기 검증 후 별도 WP.

---

## 적용된 hotfix (2026-06-29)

| 이슈 | 조치 |
|------|------|
| 빈 말풍선 | `text.trim()` 없는 bubble 제외 |
| 대용량 폴링 | `tail=80` 기본, `since=` 증분, 클라이언트 캐시 200건 |
| WAL 지연 | `fs.watch` + SSE `/chat/events` |
| inject 불일치 | `/chat/inject-status` + UI 배너 |
| focus/prepare | C UI 「집중」토글 (B모드와 동일) |
| 보안 | setup token, pairing/regenerate/window localhost·token 가드 |
| JWT URL | stream은 httpOnly 쿠키 인증 (`@fastify/cookie`) |
| Health FPS | 0fps일 때 target으로 대체하지 않음 |

---

## API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/chat/health` | DB 상태 (JWT) |
| GET | `/chat/sessions?limit=50` | 최근 세션 |
| GET | `/chat/messages?composerId=&tail=80` | 최근 N건 |
| GET | `/chat/messages?composerId=&since=` | 증분 |
| GET | `/chat/inject-status?composerId=` | inject 대상 안내 |
| GET | `/chat/events` | SSE (WAL 변경) |

---

## 검증

```powershell
cd packages\bridge
npm install
npm run test:chat-spike
$env:BRIDGE_CHAT='1'; npm start
npm run test:chat-api
npm run test:pair
```

---

## 의존성

- **Node 22+** `node:sqlite` (read-only)
- `@fastify/cookie` (stream/SSE 쿠키 인증)
