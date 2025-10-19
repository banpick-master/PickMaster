import { io } from 'socket.io-client';

const URL = 'https://banpick-master-ab3e7.web.app';

export const socket = io(URL, {
  autoConnect: false,
  path: '/api/socket.io',
});

export const getSocket = () => socket;

export const joinRoom = (roomId, playerId, name, team) => {
  socket.emit('join_game', { roomId, playerId, name, team });
};

export const sendJoinTeam = (roomId, team, playerInfo) => {
  const { id: playerId, name } = playerInfo;
  socket.emit('join_game', { roomId, team, playerId, name });
};
export const sendSwitchTeam = (roomId, playerId) => {
  socket.emit('switchTeam', { roomId, playerId });
};

export const sendChangeReadyState = (roomId, isReady) => {
  socket.emit('change_ready_state', { roomId, isReady });
};

export const sendStartDraft = (roomId) => {
  socket.emit('start_draft', { roomId });
};

export const sendSelectChampion = (roomId, champion) => {
  socket.emit('select_champion', { roomId, champion });
};

export const sendConfirmSelection = (roomId) => {
  socket.emit('confirm_selection', { roomId });
};

export const sendConfirmResult = (roomId, winner) => {
  socket.emit('confirm_result', { roomId, winner });
};

export const subscribeToRoomUpdates = (callback) => {
  socket.on('updateState', (state) => {
    callback((oldState) => ({ ...oldState, ...state }));
  });
};

export const subscribeToReadyStateChanged = (callback) => {
  socket.on('ready_state_changed', (data) => {
    callback(data);
  });
};

export const subscribeToDraftStarted = (callback) => {
  socket.on('draft_started', (data) => {
    callback(data);
  });
};

export const subscribeToChampionSelected = (callback) => {
  socket.on('champion_selected', (data) => {
    callback(data);
  });
};

export const subscribeToPhaseProgressed = (callback) => {
  socket.on('phase_progressed', (data) => {
    callback(data);
  });
};

export const subscribeToGameResultConfirmed = (callback) => {
  socket.on('game_result_confirmed', (data) => {
    callback(data);
  });
};

socket.on('connect', () => {
  console.log('Socket.IO connected');
});

socket.on('disconnect', () => {
  console.log('Socket.IO disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error);
});
