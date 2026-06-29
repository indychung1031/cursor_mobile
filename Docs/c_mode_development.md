# C모드 — 분리 개발 계획

| 항목 | 내용 |
|------|------|
| 상태 | **스파이크 착수** (B모드와 분리) |
| 기반 | [기획서 §2.3 C모드](기획서.md) |

---

## 원칙

1. **B모드(Phase 1.5 MVP) 코드·동작은 변경하지 않는다.** `/` = MJPEG + inject 그대로.
2. C모드는 **`packages/bridge/src/chat/`** 아래에만 추가한다.
3. **`BRIDGE_CHAT=1`** 일 때만 C API·UI가 활성화된다. 기본값 OFF.
4. 통합(듀얼 탭)은 C 스파이크 **Go** 이후 별도 WP로 진행한다.

---

## 디렉터리

```
packages/bridge/src/chat/
  paths.js        # state.vscdb 경로
  cursorDb.js     # SQLite read-only (composer · bubble)
  routes.js       # /chat/* API
  chatPage.js     # /chat 모바일 UI (B의 mobilePage.js와 분리)
  register.js     # index.js에서 조건부 등록
```

---

## API (스파이크 · 초안)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/chat/health` | DB 파일 존재·readable |
| GET | `/chat/sessions` | composer 목록 (JWT) |
| GET | `/chat/messages?composerId=` | 말풍선 목록 (JWT) |

입력(inject)은 **B모드 `/message` 재사용** — C UI만 분리.

---

## 검증

```powershell
cd packages\bridge
npm run test:chat-spike          # DB 직접 읽기 (Bridge 불필요)
$env:BRIDGE_CHAT='1'; npm start   # /chat UI + API
npm run test:chat-api             # Bridge + JWT
```

---

## 통합 로드맵 (나중)

```
[현재]  B: /          C: /chat (플래그)
   ↓ 스파이크 Go + UX 검증
[통합]  /?tab=stream | /?tab=chat  또는 하단 탭바
   ↓
[Phase 2] WAL watch · SSE · 세션 전환 · B탭 유지( diff/Run )
```

---

## Go / No-Go (스파이크)

| 기준 | Go |
|------|-----|
| Cursor 실행 중 read-only 조회 | 세션 ≥1, 메시지 ≥5 |
| WAL 지연 | 5초 이내 새 메시지 반영 (후속 WP) |
| Cursor 업데이트 | 스키마 변경 시 문서화 |

No-Go 시 B모드만 유지, C모드 플래그 제거 가능.

---

## 의존성

- **Node 22+** 내장 `node:sqlite` (read-only, Visual Studio 빌드 불필요)
- `engines.node` ≥ 22 (C모드 활성화 시)
