import { create } from 'zustand';
import { getRoomAPI } from '../lib/api';
import { getSocket, joinRoom, subscribeToRoomUpdates, sendStateUpdate } from '../lib/socket';

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

const updateStateAndNotify = (set, get, partialStateOrFn) => {
  set(partialStateOrFn);
  const newState = get();
  const { roomId, isConnected, myPlayerId, ...stateToSync } = newState;
  if (roomId && roomId !== 'local') {
    sendStateUpdate(roomId, stateToSync);
  }
};

export const useRoomStore = create((set, get) => ({
  ...initialState,

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

  // ▼▼▼ [수정됨] '혼자하기' 모드를 "시작"할 때만 호출되는 함수로 변경
  startGameSeries: (info) => {
    const isSeries = info.setCount === 'BO3' || info.setCount === 'BO5';
    set({
      gameName: info.gameName,
      blueTeamName: info.blueName,
      redTeamName: info.redName,
      gameMode: info.setCount,
      timerMode: info.timerMode,
      banMode: 'fearless', // 혼자하기는 항상 fearless 모드
      roomId: 'local',
      isConnected: true, // Should be connected for local game
      // Reset game-specific state
      turnIndex: 0,
      blueBans: [],
      redBans: [],
      bluePicks: [],
      redPicks: [],
      swapRequest: null,
      // Reset series-specific state
      gameSeries: { games: [], currentGame: 1, blueWins: 0, redWins: 0 },
      fearlessPicks: [],
    });
  },
  
  selectChampion: (champion) => {
    const { roomId, turnIndex } = get();
    if (turnIndex >= BANPICK_ORDER.length) return;

    if (roomId !== 'local' && !get().isMyTurn()) return;
    
    const updater = (state) => {
      const currentTurn = BANPICK_ORDER[state.turnIndex];
      const key = currentTurn.team === 'blue' ? (currentTurn.action === 'ban' ? 'blueBans' : 'bluePicks') : (currentTurn.action === 'ban' ? 'redBans' : 'redPicks');
      return { [key]: [...state[key], champion], turnIndex: state.turnIndex + 1 };
    };

    roomId === 'local' ? set(updater) : updateStateAndNotify(set, get, updater);
  },
  
  finishGame: ({ winner }) => {
    const updater = (state) => {
      const { gameSeries, bluePicks, redPicks, blueBans, redBans, banMode } = state;
      const finishedGame = { bluePicks, redPicks, blueBans, redBans, winner };
      const newGameSeries = { ...gameSeries, games: [...gameSeries.games, finishedGame], blueWins: gameSeries.blueWins + (winner === "blue" ? 1 : 0), redWins: gameSeries.redWins + (winner === "red" ? 1 : 0), currentGame: gameSeries.currentGame + 1 };
      const newFearlessPicks = banMode === 'fearless' ? [...state.fearlessPicks, ...bluePicks, ...redPicks].filter(Boolean) : [];
      return { gameSeries: newGameSeries, fearlessPicks: newFearlessPicks, turnIndex: 0, blueBans: [], redBans: [], bluePicks: [], redPicks: [], swapRequest: null };
    };
    get().roomId === 'local' ? set(updater) : updateStateAndNotify(set, get, updater);
  },

  resetRoomState: () => set(initialState),

  // --- (이하 다른 함수들은 수정할 필요 없음) ---
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
    try {
      const userData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
      if (userData && userData.roomId === roomId) set({ myPlayerId: userData.playerId });
    } catch (e) { localStorage.removeItem(LOCAL_STORAGE_KEY); }
    getSocket();
    joinRoom(roomId);
    subscribeToRoomUpdates(set);
  },
}));