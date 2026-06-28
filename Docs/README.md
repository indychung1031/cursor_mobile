# cursor_mobile — 문서 인덱스

이 프로젝트의 **모든 문서는 `Docs/` 폴더에만** 저장합니다.

## 문서 목록

| 문서 | 설명 |
|------|------|
| [기획서.md](기획서.md) | 제품 기획서 (§9 체크리스트, §11 iPhone 앱 vs Safari) |
| [implementation_plan.md](implementation_plan.md) | 구현 계획서 (API, 코드 스니펫) |
| [phase0_runbook.md](phase0_runbook.md) | Phase 0 실행 가이드 |

## 현재 상태 (v0.7.0)

- **Phase 0~1:** 모니터 ON + Cursor 전면, **잠금·절전 배제**
- **Phase 1 클라이언트:** iPhone **Safari(웹)** 우선
- **Phase 3 백로그:** Win+L 잠금 대응, iOS 네이티브 재논의

```
[ iPhone Safari ] → Tailscale → [ Bridge @ PC ] → MJPEG + 클립보드 → Cursor Agent
```

## 논의 필요

[iPhone 앱 vs Safari — 기획서 §11](기획서.md#11-모바일-클라이언트--iphone-앱-vs-safarichrome-논의-필요)
