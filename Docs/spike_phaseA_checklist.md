# A-mode 스파이크 체크리스트 (1~2일)

> **목적:** Cursor Extension으로 Agent 채팅 **텍스트·세션·전송**을 읽/쓸 수 있는지 **구현 전** 검증.  
> **산출물:** [spike_phaseA_report.md](spike_phaseA_report.md) (Go / No-Go / 조건부 Go)  
> **착수 조건:** [Phase 1.5 MVP](ux_expansion_plan.md#171-phase-15-mvp-공식-범위) 완료 **또는** B-mode 스크롤(C1) 실패 시 **조기 착수**

---

## 0. 준비 (30분)

- [ ] Cursor 최신 stable + Agent 패널 사용 가능
- [ ] VS Code Extension 개발 환경 — [Your First Extension](https://code.visualstudio.com/api/get-started/your-first-extension)
- [ ] `packages/extension/` (또는 임시 `spike/extension/`) 빈 extension scaffold
- [ ] Agent 대화 **2개 이상** 세션 열어 둠 (History에 항목 2+)

---

## Day 1 — DOM 접근 가능성 (4~6h)

### S1. Agent 패널 위치

- [ ] Developer: Toggle Developer Tools → Agent 사이드바 DOM 존재 확인
- [ ] Extension `vscode.window` API로 **webview / sidebar view** id 수집
- [ ] **기록:** 패널 타입 (webview vs native DOM vs iframe)

| 결과 | 체크 |
|------|------|
| DOM 직접 접근 가능 | ☐ |
| iframe/webview만 — executeScript 필요 | ☐ |
| 접근 불가 (shadow / CSP) | ☐ → **No-Go 후보** |

### S2. 메시지 텍스트 1턴 추출

- [ ] 사용자 메시지 1개 + Agent 응답 1개 **plain text** 추출
- [ ] **기록:** selector / API / hook 방식
- [ ] Cursor **재시작 후**에도 동일 방식 동작?

| 결과 | 체크 |
|------|------|
| 1턴 추출 성공 | ☐ |
| 부분만 (markdown/raw 혼합) | ☐ |
| 실패 | ☐ |

### S3. Mutation / 이벤트

- [ ] 새 Agent 응답 시 **이벤트** 감지 (MutationObserver / onDidChange 등)
- [ ] 지연 측정: 응답 완료 → Extension 수신 **≤ 2초**

---

## Day 2 — 세션·전송·Bridge 연동 (4~6h)

### S4. 세션 목록

- [ ] History / 세션 목록 **2개 이상** 제목 읽기
- [ ] `session/select`에 해당하는 **프로그램 전환** 가능 (클릭 inject 없이)

| 결과 | 체크 |
|------|------|
| 목록 + active id | ☐ |
| 목록만 (전환 API 없음) | ☐ → B-mode D 유지 |
| 불가 | ☐ |

### S5. 메시지 전송 트리거

- [ ] Extension에서 **입력창에 텍스트 + Enter** (또는 send command) 가능
- [ ] Bridge HTTP → Extension 메시지 **PoC** (localhost only)

```text
[Bridge POST /extension/send] → Extension → Cursor Agent 입력
```

- [ ] 클립보드 inject **없이** 1회 전송 성공

### S6. 버튼 상태 (선택 — E Slice 대체 가능성)

- [ ] Run / Accept 버튼 **존재·좌표 없이** DOM에서 탐지 가능?
- [ ] 클릭 트리거 1회

| 있음 | ☐ → Slice E B-mode inject 대체 가능 |
| 없음 | ☐ → B-mode E 유지 |

---

## Go / No-Go 기준

| 판정 | 조건 |
|------|------|
| **Go** | S2 ✅ + S5 ✅ + (S4 ✅ 또는 B-mode 세션 유지 acceptable) |
| **조건부 Go** | S2 ✅, S5 △ (clipboard fallback), S4 ❌ |
| **No-Go** | S2 ❌ — B-mode(C scroll + Freeze)만 Phase 2까지 유지 |

---

## 리스크 기록 (필수)

스파이크 중 아래를 `spike_phaseA_report.md`에 적을 것:

| 항목 | 기록 |
|------|------|
| Cursor 버전 | |
| DOM 구조 요약 | |
| 깨지기 쉬운 지점 | (class명, webview, 업데이트) |
| B-mode 대비 이점 | (스크롤, 세션, E 버튼) |
| 예상 MVP 기간 | H6 2~4w realistic? |

---

## 보고서 템플릿

완료 후 `spike_phaseA_report.md` 생성:

```markdown
# A-mode 스파이크 보고서

| 항목 | 내용 |
|------|------|
| 날짜 | YYYY-MM-DD |
| Cursor 버전 | |
| 판정 | Go / 조건부 Go / No-Go |

## S1~S6 결과
(체크리스트 복사)

## 아키텍처 스케치
Extension ↔ Bridge ↔ Mobile

## 다음 단계
- Go → WP-H6 착수
- No-Go → Phase 2는 B-mode (C+D+E inject)만
```

---

## 관련 문서

| 문서 | 관계 |
|------|------|
| [ux_expansion_plan.md §6 트랙 C](ux_expansion_plan.md#6-채팅-히스토리--스크롤--세션-검토) | A-mode 근본 해결 |
| [ux_expansion_plan.md §17.9 H5](ux_expansion_plan.md#179-slice-h--phase-2-uxa-mode) | WP-H5 |
| [기획서.md §2 A모드](기획서.md#2-두-가지-모드) | B vs A |
