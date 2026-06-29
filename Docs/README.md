# cursor_mobile — 문서 인덱스

이 프로젝트의 **모든 문서는 `Docs/` 폴더에만** 저장합니다.

## 문서 목록

| 문서 | 설명 |
|------|------|
| [기획서.md](기획서.md) | 제품 기획서 (§9 체크리스트, §11 iPhone 앱 vs Safari) |
| [ux_expansion_plan.md](ux_expansion_plan.md) | **사용성 확장 v1.4** — Phase 1.5 MVP 확정 |
| [wp_verify_runbook.md](wp_verify_runbook.md) | **WP별 검증** — PC `/dev` + iPhone |
| [known_risks.md](known_risks.md) | **알려진 한계·문제 가능성** — 실사용 리스크·대응 (Living Doc) |
| [c_mode_development.md](c_mode_development.md) | C모드(DB 텍스트) 분리 개발 |
| [spike_phaseA_checklist.md](spike_phaseA_checklist.md) | A-mode 스파이크 (MVP Go 후) |
| [implementation_plan.md](implementation_plan.md) | 구현 계획서 (API, 코드 스니펫) |
| [phase0_runbook.md](phase0_runbook.md) | Phase 0 실행 가이드 |

## 현재 상태 (v0.7.4)

- **Phase 0~1:** ✅ B-mode 동작 검증
- **Phase 1.5 MVP:** [ux_expansion_plan §17.1](ux_expansion_plan.md#171-phase-15-mvp-공식-범위) — A·B·C·F1 착수 (D/E 보류)

```
[ iPhone Safari ] → Tailscale → [ Bridge @ PC ] → MJPEG + 클립보드 → Cursor Agent
```

## 논의 필요

[iPhone 앱 vs Safari — 기획서 §11](기획서.md#11-모바일-클라이언트--iphone-앱-vs-safarichrome-논의-필요)
