# cursor_mobile — Claude / Cursor Agent 지침

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| **Git Root** | `c:/Users/indyc/Desktop/antigravity/project/cursor_mobile` |
| **Remote** | `https://github.com/indychung1031/cursor_mobile.git` |
| **Branch** | `main` |
| **문서** | `Docs/` (기획서, ux_expansion_plan, wp_verify_runbook 등) |
| **Bridge** | `packages/bridge/` — Node.js Fastify, B-mode MJPEG + inject |

---

## Git — 커밋 & Push (필수)

### 커밋: **항상 자동**

- 작업(기능 구현, 버그 수정, 문서 갱신 등)을 **마칠 때마다** 로컬 **git commit**을 **반드시** 수행한다.
- 사용자에게 「커밋할까요?」라고 **물어보지 않는다** — 커밋은 기본 동작이다.
- 커밋 전: `git status`, `git diff`로 변경 범위를 확인한다.
- **커밋하지 않는 것:** `.env`, `.bridge-secret`, `config.json`, `node_modules/`, 민감·로컬 런타임 파일.
- 커밋 메시지는 **한국어**, 변경 **목적(why)** 위주 1~2문장.

### Push: **사용자 확인 후만**

- `git push`는 **사용자에게 먼저 물어본 뒤**, 승인을 받았을 때만 실행한다.
- 사용자가 「푸시해」, 「push」 등 **명시적으로 요청**한 경우에만 push한다.
- push 전: 원격과의 차이(`git status`, `git log origin/main..HEAD`)를 확인하고, push할 커밋 범위를 간단히 안내한다.

### 작업 종료 체크리스트

```
1. 변경 사항 커밋 (자동)
2. push 필요 여부 → 사용자에게만 질문
3. (선택) 커밋 해시·메시지 한 줄 요약
```

---

## 언어

- 사용자-facing 답변, 문서, 커밋 메시지는 **한국어**로 작성한다.

---

## MVP 진행 (Phase 1.5)

- **완료·실기 통과:** A1 QR, A2 자동 페어링 (LTE/5G)
- **구현됨·실기 추후:** A3 재연결 UX — [기획서 §12.8](Docs/기획서.md)
- **다음:** A4 `/setup` Cursor 창 선택 → B → C → F1
- **검증:** [wp_verify_runbook.md](Docs/wp_verify_runbook.md)

---

## Bridge 실행

```powershell
cd packages\bridge
$env:BRIDGE_PORT='3921'
npm start
```

- 포트 충돌 시: 기존 3921 프로세스 종료 후 재시작.
- 셸에 `BRIDGE_PORT=3926` 등이 남아 있으면 `.env`보다 우선할 수 있음 → `3921` 명시 권장.
