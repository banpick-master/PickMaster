import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  autoConnect: false,
});

export default socket;

export const joinRoom = (roomId, playerId, playerName, team) => {
  socket.emit('joinRoom', { roomId, playerId, playerName, team });
};

export const subscribeToRoomUpdates = (callback) => {
  socket.on('roomUpdate', (data) => {
    callback(data);
  });
};

export const sendJoinTeam = (roomId, team, playerInfo) => {
  socket.emit('joinTeam', { roomId, team, playerInfo });
};

export const sendSwitchTeam = (roomId, playerId) => {
  socket.emit('switchTeam', { roomId, playerId });
};

export const sendChangeReadyState = (roomId, isReady) => {
  socket.emit('changeReadyState', { roomId, isReady });
};

export const subscribeToReadyStateChanged = (callback) => {
  socket.on('readyStateChanged', (data) => {
    callback(data);
  });
};

export const sendStartDraft = (roomId) => {
  socket.emit('startDraft', { roomId });
};

export const subscribeToDraftStarted = (callback) => {
  socket.on('draftStarted', (data) => {
    callback(data);
  });
};

export const sendSelectChampion = (roomId, champion) => {
  socket.emit('selectChampion', { roomId, champion });
};

export const sendConfirmSelection = (roomId) => {
  socket.emit('confirmSelection', { roomId });
};

export const subscribeToChampionSelected = (callback) => {
  socket.on('championSelected', (data) => {
    callback(data);
  });
};

export const subscribeToPhaseProgressed = (callback) => {
  socket.on('phaseProgressed', (data) => {
    callback(data);
  });
};

export const sendConfirmResult = (roomId, winner) => {
  socket.emit('confirmResult', { roomId, winner });
};

export const subscribeToGameResultConfirmed = (callback) => {
  socket.on('gameResultConfirmed', (data) => {
    callback(data);
  });
};