import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let client = null;
let currentRoomId = null;

// 환경 변수에서 기본 URL 가져오기 (예: http://localhost:8080)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:10000';

export const getClient = () => client;

export const connectStomp = (roomId, onConnect, onDisconnect, onMessage) => {
  currentRoomId = roomId;

  client = new Client({
    // SockJS를 사용하여 연결 (WebSocket 지원하지 않는 브라우저 대비 및 Spring Boot 기본 설정 호환)
    webSocketFactory: () => new SockJS(`${SOCKET_URL}/ws`),
    
    // 연결 성공 시
    onConnect: (frame) => {
      console.log('STOMP connected:', frame);
      
      // 방 구독 (Spring Boot에서 해당 방의 업데이트를 받는 경로라고 가정: /topic/room/{roomId})
      client.subscribe(`/topic/room/${roomId}`, (message) => {
        if (message.body) {
          const payload = JSON.parse(message.body);
          onMessage(payload);
        }
      });

      if (onConnect) onConnect();
    },

    // 연결 에러 시
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    },

    // 연결 끊김 시
    onWebSocketClose: () => {
      console.log('STOMP connection closed');
      if (onDisconnect) onDisconnect();
    },
    
    // 디버그 로그 (개발 중 필요시 활성화)
    // debug: (str) => {
    //   console.log(str);
    // },
    
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  client.activate();
};

export const disconnectStomp = () => {
  if (client) {
    client.deactivate();
    client = null;
    currentRoomId = null;
  }
};

// --- Send Functions (Mapping to Spring Boot @MessageMapping) ---

// 공통 전송 함수
const send = (destination, body = {}) => {
  if (client && client.connected) {
    client.publish({
      destination: destination,
      body: JSON.stringify(body),
    });
  } else {
    console.error('STOMP client is not connected. Cannot send message to:', destination);
  }
};

// 1. 게임 참여 (Join)
// Spring Controller: @MessageMapping("/room/{roomId}/join")
export const joinRoom = (roomId, playerId, name, team) => {
  send(`/app/room/${roomId}/join`, { playerId, name, team });
};

// 1-1. 팀 선택/변경 (Join Team / Switch Team)
// 기존 로직 유지: team 파라미터가 있으면 특정 팀 조인, 없으면 스위치
// Spring Controller: @MessageMapping("/room/{roomId}/team")
export const sendJoinTeam = (roomId, team, playerInfo) => {
  const { id: playerId, name } = playerInfo;
  send(`/app/room/${roomId}/join`, { playerId, name, team });
};

export const sendSwitchTeam = (roomId, playerId) => {
    // Spring Boot 쪽에서 switch 액션을 별도로 처리하거나, join으로 덮어쓰기 할 수 있음.
    // 여기서는 별도 엔드포인트 `/switch`를 가정하거나, join 메시지에 team을 null/undefined로 보내서 처리할 수도 있음.
    // 명시적으로 switch 엔드포인트를 호출하도록 변경
    send(`/app/room/${roomId}/switch`, { playerId });
};

// 2. 준비 상태 변경
// Spring Controller: @MessageMapping("/room/{roomId}/ready")
export const sendChangeReadyState = (roomId, isReady) => {
  send(`/app/room/${roomId}/ready`, { isReady });
};

// 3. 드래프트 시작 (방장)
// Spring Controller: @MessageMapping("/room/{roomId}/start")
export const sendStartDraft = (roomId) => {
  send(`/app/room/${roomId}/start`, {});
};

// 4. 챔피언 선택
// Spring Controller: @MessageMapping("/room/{roomId}/select")
export const sendSelectChampion = (roomId, champion) => {
  send(`/app/room/${roomId}/select`, { champion });
};

// 5. 선택 확정 (Lock in)
// Spring Controller: @MessageMapping("/room/{roomId}/lock")
export const sendConfirmSelection = (roomId) => {
  send(`/app/room/${roomId}/lock`, {});
};

// 6. 게임 결과 확정
// Spring Controller: @MessageMapping("/room/{roomId}/result")
export const sendConfirmResult = (roomId, winner) => {
  send(`/app/room/${roomId}/result`, { winner });
};