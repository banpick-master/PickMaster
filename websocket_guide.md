# Pick Master 프로젝트: 웹소켓(Socket.IO) 작동 방식

제출하신 프로젝트에서 **웹소켓(WebSockets)**은 '함께하기' 모드를 구현하는 핵심 기술입니다. 💖

이 기술이 없다면, 다른 플레이어가 챔피언을 선택하거나 준비 완료를 눌렀을 때 그 정보를 즉시 알 수 없고 매번 새로고침을 해야 했을 것입니다.

프로젝트 내에서 웹소켓이 어떻게 사용되는지 구체적으로 설명해 드립니다.

---

## 1. 웹소켓의 역할: 실시간 통신 📡

웹소켓은 서버(백엔드)와 클라이언트(프론트엔드) 간의 **지속적인 양방향 연결**을 가능하게 합니다.

* **(이전 방식) HTTP:** 클라이언트가 요청하고(Request) 서버가 응답(Response)하면 연결이 끊어집니다.
* **(현재 방식) WebSocket:** 한번 연결되면, 서버가 원할 때 언제든 클라이언트에게 데이터를 밀어넣을 수 있습니다(Push).

이 프로젝트에서는 **Socket.IO** 라이브러리를 사용하여 웹소켓 통신을 더욱 편리하게 구현했습니다.

---

## 2. 구현 방식

* **백엔드 (NestJS):** `@nestjs/websockets`와 `@nestjs/platform-socket.io` 모듈을 사용합니다.
    * 핵심 파일은 `pickmaster-backend/src/events.gateway.ts`입니다. 이 파일은 "게이트웨이" 역할을 하며, 클라이언트로부터 오는 모든 실시간 요청을 수신하고 처리합니다.
* **프론트엔드 (React):** `socket.io-client` 라이브러리를 사용합니다.
    * `src/lib/socket.js` 파일에서 소켓 연결을 설정하고, 서버로 이벤트를 보내거나(`emit`) 서버로부터 이벤트를 받는(`on`) 함수들을 정의합니다.
    * `src/store/roomStore.js`에서 이 소켓 함수들을 호출하여 실제 애플리케이션 상태(Zustand)와 연동합니다.

---

## 3. 주요 동작 흐름 (이벤트 기반)

전체 밴픽 과정은 "이벤트"를 주고받는 방식으로 진행됩니다.

1.  **접속 및 참가:**
    * 클라이언트가 방에 접속하면 `join_game` 이벤트를 서버로 전송(emit)합니다.
    * 서버(`events.gateway.ts`)는 `join_game` 이벤트를 수신(`@SubscribeMessage`)하여, 해당 클라이언트를 특정 `roomId`를 가진 소켓 "방"에 입장시킵니다 (`client.join(roomId)`).
    * 서버는 데이터베이스에서 방의 현재 상태를 가져와, 방에 있는 **모든 인원**에게 `updateState` 이벤트를 전송하여 최신 상태를 공유합니다.

2.  **준비 완료:**
    * 클라이언트가 "준비" 버튼을 누르면 `change_ready_state` 이벤트를 서버로 전송합니다.
    * 서버는 해당 플레이어의 상태를 'ready'로 변경하고, 다시 `updateState`를 방 전체에 전송하여 모든 플레이어의 화면에 "준비완료"가 표시되도록 합니다.

3.  **밴픽 진행:**
    * 방장이 `start_draft` 이벤트를 전송하면, 서버는 `draft_started` 이벤트를 방 전체에 전송하여 모든 플레이어의 화면을 밴픽 페이지로 이동시킵니다.
    * 현재 턴인 플레이어가 챔피언을 클릭하면 `select_champion` 이벤트를 전송합니다.
    * 서버는 이를 `currentSelection` (임시 선택) 상태로 저장하고 `updateState`를 전파하여, 다른 사람들이 현재 어떤 챔피언을 고르고 있는지 볼 수 있게 합니다.
    * 플레이어가 "선택 확정"을 누르면 `confirm_selection` 이벤트를 전송합니다.
    * 서버는 `currentSelection`을 실제 `bluePicks` 또는 `redBans` 배열로 옮기고, `turnIndex`를 1 증가시킨 뒤, `updateState`를 전송하여 턴을 넘깁니다.

4.  **연결 종료:**
    * 만약 플레이어가 브라우저를 닫으면 (`disconnecting`), 서버는 이를 감지하여 해당 플레이어를 방에서 자동으로 제거하고, 이 변경 사항을 `updateState`로 모두에게 알립니다.

---

## 4. 주요 이벤트 목록

`events.gateway.ts`와 `socket.js`를 기준으로, 이 프로젝트는 다음과 같은 핵심 이벤트들을 사용합니다.

### 클라이언트 → 서버 (Client emits)

* `join_game`: 방 입장 및 팀 선택
* `switchTeam`: 팀 변경
* `change_ready_state`: 준비/준비 취소
* `start_draft`: (방장) 밴픽 시작
* `select_champion`: 챔피언 임시 선택
* `confirm_selection`: 챔피언 선택 확정
* `confirm_result`: (방장) 해당 세트의 승리 팀 보고

### 서버 → 클라이언트 (Server emits)

* `updateState`: (가장 중요) 방의 모든 최신 정보(플레이어 목록, 밴픽 상태, 턴 순서 등)를 클라이언트로 전송.
* `draft_started`: 밴픽이 시작되었음을 알림.
* `game_result_confirmed`: 한 세트가 종료되고 승리 팀이 확정되었음을 알림.
* `error`: 잘못된 요청 (예: 방장이 아닌데 시작을 누름)이 있을 때 해당 클라이언트에게만 오류를 보냄.
