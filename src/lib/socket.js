// src/lib/socket.js

import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';
let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {});
    socket.on('connect', () => console.log('Socket.IO connected successfully:', socket.id));
    socket.on('disconnect', (reason) => console.log('Socket.IO disconnected:', reason));
    socket.on('connect_error', (error) => console.error('Socket.IO connection error:', error));
  }
  return socket;
};

/**
 * ✅ [수정됨] joinRoom 함수
 * @param {string} roomId - 참여할 방의 ID
 * @param {string} playerId - 참여하는 플레이어의 ID
 */
export const joinRoom = (roomId, playerId) => {
  const currentSocket = getSocket();
  // roomId와 playerId를 객체로 묶어서 전송합니다.
  currentSocket.emit('joinRoom', { roomId, playerId });
  console.log(`Attempting to join room: ${roomId} as player: ${playerId}`);
};

export const sendJoinTeam = (roomId, team, player) => {
  getSocket().emit('joinTeam', { roomId, team, player });
};

export const sendSwitchTeam = (roomId, playerId) => {
  getSocket().emit('switchTeam', { roomId, playerId });
};

export const sendStateUpdate = (roomId, partialState) => {
  getSocket().emit('updateState', { room: roomId, state: partialState });
};

export const subscribeToRoomUpdates = (callback) => {
  const currentSocket = getSocket();
  currentSocket.off('updateState'); // 중복 리스너 방지
  currentSocket.on('updateState', (state) => {
    console.log('Received state update from server:', state);
    callback(state);
  });
};