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
      // 필요한 경우 여기에 소켓 옵션을 추가합니다.
      // 예: transports: ['websocket']
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
 * @param {string} roomId - 참여할 방의 ID
 */
export const joinRoom = (roomId) => {
  const currentSocket = getSocket();
  currentSocket.emit('joinRoom', roomId);
  console.log(`Attempting to join room: ${roomId}`);
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

/**
 * 서버로 상태 업데이트를 보냅니다.
 * @param {string} roomId - 상태를 보낼 방의 ID
 * @param {object} state - 보낼 새로운 상태
 */
export const sendStateUpdate = (roomId, state) => {
  const currentSocket = getSocket();
  currentSocket.emit('messageToRoom', { room: roomId, message: state });
};
