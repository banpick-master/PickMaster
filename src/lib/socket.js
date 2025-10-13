import { io } from 'socket.io-client';

// =================================================================
// 중요: 이 주소를 실제 배포된 백엔드 서버의 주소로 변경해야 합니다.
// 예: 'https://your-backend-server.com'
// =================================================================
const SOCKET_URL = 'http://localhost:3000';

let socket;

/**
 * 서버와 소켓 연결을 설정하고 반환합니다.
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected successfully:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });
  }
  return socket;
};

/**
 * 특정 방에 참여하기 위해 'joinRoom' 이벤트를 보냅니다.
// src/lib/socket.js

// ... (기존 코드 생략)

/**
 * 특정 방에 참여하기 위해 'joinRoom' 이벤트를 보냅니다.
 * @param {string} roomId - 참여할 방의 ID
 * @param {string} playerId - 참여하는 플레이어의 ID
 */
export const joinRoom = (roomId, playerId) => {
  const currentSocket = getSocket();
  // ✅ [수정] roomId와 playerId를 객체로 묶어서 전송
  currentSocket.emit('joinRoom', { roomId, playerId });
  console.log(`Attempting to join room: ${roomId} as player: ${playerId}`);
};

// ... (이하 코드 동일)

/**
 * 서버에 팀 합류 이벤트를 보냅니다.
 * @param {string} roomId
 * @param {'blue' | 'red'} team
 * @param {object} player
 */
export const sendJoinTeam = (roomId, team, player) => {
  const currentSocket = getSocket();
  currentSocket.emit('joinTeam', { roomId, team, player });
};

/**
 * 서버에 진영 변경 이벤트를 보냅니다.
 * @param {string} roomId
 * @param {string} playerId
 */
export const sendSwitchTeam = (roomId, playerId) => {
  const currentSocket = getSocket();
  currentSocket.emit('switchTeam', { roomId, playerId });
};


/**
 * 서버로 상태의 부분적인 업데이트를 보냅니다.
 * @param {string} roomId - 상태를 보낼 방의 ID
 * @param {object} state - 변경된 부분 상태
 */
export const sendStateUpdate = (roomId, partialState) => {
  const currentSocket = getSocket();
  currentSocket.emit('updateState', { room: roomId, state: partialState });
};

/**
 * 방의 상태 업데이트를 구독합니다.
 * 서버에서 'updateState' 메시지를 받으면 콜백 함수를 실행합니다.
 * @param {(state: object) => void} callback - 상태 업데이트 시 호출될 콜백
 */
export const subscribeToRoomUpdates = (callback) => {
  const currentSocket = getSocket();
  // 기존 리스너를 제거하여 중복 등록을 방지합니다.
  currentSocket.off('updateState');
  currentSocket.on('updateState', (state) => {
    console.log('Received state update from server:', state);
    callback(state);
  });
};