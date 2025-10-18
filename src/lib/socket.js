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

export const joinRoom = (roomId, playerId, name, team) => {
  const currentSocket = getSocket();
  currentSocket.emit('join_game', { roomId, playerId, name, team });
  console.log(`Attempting to join room: ${roomId} as player: ${playerId} with name: ${name} and team: ${team}`);
};

export const sendJoinTeam = (roomId, team, player) => {
  getSocket().emit('join_game', { roomId, team, name: player.name, playerId: player.id });
};

export const sendSwitchTeam = (roomId, playerId) => {
  getSocket().emit('switchTeam', { roomId, playerId });
};

export const sendChangeReadyState = (roomId, isReady) => {
  getSocket().emit('change_ready_state', { roomId, isReady });
};

export const sendSelectChampion = (roomId, champion) => {
  getSocket().emit('select_champion', { roomId, champion });
};

export const sendConfirmSelection = (roomId) => {
  getSocket().emit('confirm_selection', { roomId });
};

export const sendStartDraft = (roomId) => {
  getSocket().emit('start_draft', { roomId });
};

export const sendConfirmResult = (roomId, winner) => {
  getSocket().emit('confirm_result', { roomId, winner });
};

// --- Subscriptions ---

export const subscribeToRoomUpdates = (callback) => {
  const currentSocket = getSocket();
  currentSocket.off('updateState');
  currentSocket.on('updateState', (state) => {
    console.log('Received state update from server:', state);
    callback(state);
  });
};

export const subscribeToReadyStateChanged = (callback) => {
    const currentSocket = getSocket();
    currentSocket.off('ready_state_changed');
    currentSocket.on('ready_state_changed', (data) => {
        console.log('Received ready_state_changed event:', data);
        callback(data);
    });
};

export const subscribeToAllPlayersReady = (callback) => {
    const currentSocket = getSocket();
    currentSocket.off('all_players_ready');
    currentSocket.on('all_players_ready', () => {
        console.log('Received all_players_ready event');
        callback();
    });
};

export const subscribeToChampionSelected = (callback) => {
    const currentSocket = getSocket();
    currentSocket.off('champion_selected');
    currentSocket.on('champion_selected', (data) => {
        console.log('Received champion_selected event:', data);
        callback(data);
    });
};

export const subscribeToPhaseProgressed = (callback) => {
    const currentSocket = getSocket();
    currentSocket.off('phase_progressed');
    currentSocket.on('phase_progressed', (data) => {
        console.log('Received phase_progressed event:', data);
        callback(data);
    });
};

export const subscribeToDraftStarted = (callback) => {
    const currentSocket = getSocket();
    currentSocket.off('draft_started');
    currentSocket.on('draft_started', (data) => {
        console.log('Received draft_started event:', data);
        callback(data);
    });
};

export const subscribeToGameResultConfirmed = (callback) => {
    const currentSocket = getSocket();
    currentSocket.off('game_result_confirmed');
    currentSocket.on('game_result_confirmed', (data) => {
        console.log('Received game_result_confirmed event:', data);
        callback(data);
    });
};