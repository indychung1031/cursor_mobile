# Phase 0 실행 가이드

Bridge Phase 0: Tailscale + Bridge 뼈대 + 조기 검증.

## 1. Tailscale + `.env`

1. [tailscale.com](https://tailscale.com) — PC·iPhone 설치, 동일 계정
2. 2FA 활성화
3. 프로젝트 루트 `.env`에 PC Tailscale IP 입력:

```powershell
cd c:\Users\indyc\Desktop\antigravity\project\cursor_mobile
copy .env.example .env
notepad .env
```

```env
TAILSCALE_IP=100.x.x.x
```

> `.env`는 git에 올라가지 않습니다. IP만 본인 PC에 저장됩니다.

## 2. Bridge 실행

```powershell
cd packages\bridge
npm install
npm start
```

또는 `scripts\start-bridge.bat`

확인:

- http://localhost:3921/health
- http://localhost:3921/displays

## 3. 캡처 좌표 설정

1. Cursor Agent 패널이 보이게 둔다 (Win+L 사용 안 함)
2. `packages/bridge/config.example.json`을 `config.json`으로 복사
3. `region` x/y/width/height를 채팅 패널에 맞게 수정

```powershell
copy config.example.json config.json
npm run test:capture
```

출력: `packages/bridge/output/test_capture.jpg` → iPhone으로 전송해 가독성 확인

## 4. 모바일 접속

Tailscale 켠 iPhone Safari — `.env`의 `TAILSCALE_IP` 사용:

- **`http://<TAILSCALE_IP>:3921/`** ← iPhone에서 이 주소 사용 (화면 표시)
- `http://<TAILSCALE_IP>:3921/health` — JSON API (Safari는 파일 저장 창이 뜰 수 있음)
- LTE/5G(Wi-Fi OFF)에서도 동일

## 5. Phase 0 체크리스트

기획서 [§9 Phase 0](기획서.md#phase-0--인프라-구성--조기-검증-12일) 항목을 `[x]`로 갱신.

## powercfg 원복

Bridge를 `Ctrl+C`로 종료하면 저장해 둔 모니터 타임아웃을 복원한다.  
비정상 종료 시 Windows **설정 → 전원**에서 디스play 끄기 시간을 수동 조정.
