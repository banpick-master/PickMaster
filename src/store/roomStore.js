// src/store/roomStore.js

import { create } from 'zustand';
import { createRoomAPI, getRoomAPI } from '../lib/api';
import { getSocket, joinRoom, subscribeToRoomUpdates, sendStateUpdate, sendJoinTeam, sendSwitchTeam } from '../lib/socket';
import { uid } from 'uid';

const BANPICK_ORDER = [
  { team: "blue", action: "ban" }, { team: "red", action: "ban" },
  { team: "blue", action: "ban" }, { team: "red", action: "ban" },
  { team: "blue", action: "ban" }, { team: "red", action: "ban" },
  { team: "blue", action: "pick" }, { team: "red", action: "pick" },
  { team: "red", action: "pick" }, { team: "blue", action: "pick" },
  { team: "blue", action: "pick" }, { team: "red", action: "pick" },
  { team: "red", action: "ban" }, { team: "blue", action: "ban" },
  { team: "red", action: "ban" }, { team: "blue", action: "ban" },
  { team: "red", action: "pick" }, { team: "blue", action: "pick" },
  { team: "blue", action: "pick" }, { team: "red", action: "pick" },
];

const LOCAL_STORAGE_KEY = 'pickmaster_user';

const initialState = {
  patch: "14.19",
  gameName: "새로운 경기",
  blueTeamName: "블루 팀",
  redTeamName: "레드 팀",
  gameMode: "single",
  timerMode: "default",
  banMode: "tournament",
  gameSeries: { games: [], currentGame: 1, blueWins: 0, redWins: 0 },
  fearlessPicks: [],
  blueTeamPlayers: [],
  redTeamPlayers: [],
  spectators: [],
  readyCheckStatus: 'idle',
  turnIndex: 0,
  blueBans: [],
  redBans: [],
  bluePicks: [],
  redPicks: [],
  swapRequest: null,
  isConnected: false,
  roomId: null,
  myPlayerId: null,
};


export const useRoomStore = create((set, get) => ({
  ...initialState,

  createNewRoom: async (gameInfo) => {
    try {
      const { roomId } = await createRoomAPI(gameInfo);
      const myPlayerId = uid(16);
      set({ ...initialState, ...gameInfo, roomId, myPlayerId, isConnected: true, playMode: 'multi' });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ roomId, playerId: myPlayerId }));
      return { roomId };
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  },

  getMyTeam: () => {
    const { myPlayerId, blueTeamPlayers, redTeamPlayers } = get();
    if (!myPlayerId) return null;
    if (blueTeamPlayers.some(p => p.id === myPlayerId)) return 'blue';
    if (redTeamPlayers.some(p => p.id === myPlayerId)) return 'red';
    return null;
  },

  isMyTurn: () => {
    if (get().roomId === 'local') return true;
    const { turnIndex } = get();
    const myTeam = get().getMyTeam();
    const currentTurn = BANPICK_ORDER[turnIndex];
    return currentTurn && myTeam === currentTurn.team;
  },
  
  startGameSeries: (info) => {
    set({
      ...initialState,
      gameName: info.gameName,
      blueTeamName: info.blueName,
      redTeamName: info.redName,
      gameMode: info.setCount,
      timerMode: info.timerMode,
      banMode: 'fearless',
      roomId: 'local',
      isConnected: true,
    });
  },
  
  selectChampion: (champion) => {
    const { roomId, turnIndex, myPlayerId } = get();
    if (turnIndex >= BANPICK_ORDER.length) return;
    if (roomId !== 'local' && !get().isMyTurn()) return;
    
    const updater = (state) => {
      const currentTurn = BANPICK_ORDER[state.turnIndex];
      const key = currentTurn.team === 'blue' ? (currentTurn.action === 'ban' ? 'blueBans' : 'bluePicks') : (currentTurn.action === 'ban' ? 'redBans' : 'redPicks');
      return { [key]: [...state[key], champion], turnIndex: state.turnIndex + 1 };
    };
    roomId === 'local' ? set(updater) : sendStateUpdate(roomId, updater(get()));
  },
  
  finishGame: ({ winner }) => {
    const updater = (state) => {
      const { gameSeries, bluePicks, redPicks, blueBans, redBans, banMode, fearlessPicks } = state;
      const finishedGame = { bluePicks, redPicks, blueBans, redBans, winner };
      const newGameSeries = { ...gameSeries, games: [...gameSeries.games, finishedGame], blueWins: gameSeries.blueWins + (winner === "blue" ? 1 : 0), redWins: gameSeries.redWins + (winner === "red" ? 1 : 0), currentGame: gameSeries.currentGame + 1 };
      const newFearlessPicks = banMode === 'fearless' ? [...(fearlessPicks || []), ...bluePicks, ...redPicks].filter(Boolean) : (fearlessPicks || []);
      return { gameSeries: newGameSeries, fearlessPicks: newFearlessPicks, turnIndex: 0, blueBans: [], redBans: [], bluePicks: [], redPicks: [], swapRequest: null };
    };
    get().roomId === 'local' ? set(updater) : updateStateAndNotify(set, get, updater);
  },

  resetRoomState: () => set(initialState),
  
  joinTeam: (team, name) => {
    const { roomId, myPlayerId } = get();
    const playerInfo = { id: myPlayerId, name, isReady: false };

    if (!myPlayerId) {
      const newPlayerId = uid(16);
      set({ myPlayerId: newPlayerId });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ roomId, playerId: newPlayerId }));
      sendJoinTeam(roomId, team, { ...playerInfo, id: newPlayerId });
    } else {
      sendJoinTeam(roomId, team, playerInfo);
    }
  },

  switchTeam: () => {
    const { roomId, myPlayerId } = get();
    sendSwitchTeam(roomId, myPlayerId);
  },

  // ✅ [수정됨] connectToRoom 함수
  connectToRoom: async (roomId) => {
    if (roomId === 'local') {
      set({ roomId: 'local', isConnected: true });
      return;
    }

    try {
      const initialStateFromServer = await getRoomAPI(roomId);
      if (initialStateFromServer) {
        set({ ...initialStateFromServer, roomId, isConnected: true });
      } else {
        console.error(`Room with ID ${roomId} not found.`);
        set({ isConnected: false });
        return;
      }
    } catch (error) { console.error("방 상태를 가져오는 데 실패했습니다:", error); set({ isConnected: false }); return; }
    
    let playerId = get().myPlayerId;
    if (!playerId) {
      try {
        const userData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
        if (userData && userData.roomId === roomId) {
          playerId = userData.playerId;
          set({ myPlayerId: playerId });
        }
      } catch (e) { localStorage.removeItem(LOCAL_STORAGE_KEY); }
    }

    getSocket();
    // playerId를 함께 전달하도록 수정
    joinRoom(roomId, playerId); 
    subscribeToRoomUpdates(set);
  },
}));