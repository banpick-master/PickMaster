import { create } from 'zustand';
import { getRoomAPI } from '../lib/api'; // (가정) lib/api.js에 이 함수가 구현되어 있어야 합니다.
import { getSocket, joinRoom, subscribeToRoomUpdates, sendStateUpdate } from '../lib/socket'; // (가정) lib/socket.js에 이 함수들이 구현되어 있어야 합니다.

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

// 상태를 업데이트하고, 변경된 상태를 소켓을 통해 다른 클라이언트에게 전송하는 래퍼 함수
const updateStateAndNotify = (set, get, partialStateOrFn) => {
  set(partialStateOrFn);
  const newState = get();
  // myPlayerId 같이 클라이언트마다 다른 값은 제외하고 순수 게임 상태만 동기화
  const { roomId, isConnected, myPlayerId, ...stateToSync } = newState; 
  if (roomId) {
    sendStateUpdate(roomId, stateToSync);
  }
};

export const useRoomStore = create((set, get) => ({
  ...initialState,

  // --- Getter 함수 ---
  getMyTeam: () => {
    const { myPlayerId, blueTeamPlayers, redTeamPlayers } = get();
    if (!myPlayerId) return null;
    if (blueTeamPlayers.some(p => p.id === myPlayerId)) return 'blue';
    if (redTeamPlayers.some(p => p.id === myPlayerId)) return 'red';
    return null;
  },

  isMyTurn: () => {
    const { turnIndex } = get();
    const myTeam = get().getMyTeam();
    const currentTurn = BANPICK_ORDER[turnIndex];
    return currentTurn && myTeam === currentTurn.team;
  },

  // --- 연결 및 참가 액션 ---
  connectToRoom: async (roomId) => {
    // 1. API를 통해 방의 현재 상태를 가져옵니다.
    try {
      const initialStateFromServer = await getRoomAPI(roomId);
      set({ ...initialStateFromServer, roomId, isConnected: true });
    } catch (error) {
      console.error("방 상태를 가져오는 데 실패했습니다:", error);
      set({ isConnected: false });
      return;
    }

    // 2. localStorage에 저장된 내 정보가 있는지 확인하고 복원합니다.
    try {
      const userData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
      if (userData && userData.roomId === roomId) {
        set({ myPlayerId: userData.playerId });
      }
    } catch (e) {
      console.error("localStorage에서 사용자 정보를 불러오는 데 실패했습니다.", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }

    // 3. 소켓에 연결하고 방에 조인합니다.
    getSocket();
    joinRoom(roomId);
    subscribeToRoomUpdates((serverState) => {
      // 서버로부터 업데이트된 상태를 받으면 내 상태에 덮어씌웁니다.
      set(serverState);
    });
  },
  
  joinTeam: (team, name) => {
    const { blueTeamPlayers, redTeamPlayers, roomId } = get();
    const myTeam = get().getMyTeam();
    if (myTeam) return; // 이미 팀이 있으면 아무것도 하지 않음

    if ((team === 'blue' && blueTeamPlayers.length > 0) || (team === 'red' && redTeamPlayers.length > 0)) {
      alert('이미 플레이어가 있습니다.');
      return;
    }
    
    // ID 생성 방식 강화
    const newPlayer = { id: `${team}-${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`, name, isReady: false };
    
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ roomId, playerId: newPlayer.id }));
    } catch (e) {
      console.error("localStorage에 사용자 정보를 저장하는 데 실패했습니다.", e);
    }
    
    updateStateAndNotify(set, get, (state) => ({
      myPlayerId: newPlayer.id,
      [team === 'blue' ? 'blueTeamPlayers' : 'redTeamPlayers']: [...state[team === 'blue' ? 'blueTeamPlayers' : 'redTeamPlayers'], newPlayer]
    }));
  },

  switchTeam: () => {
    const myTeam = get().getMyTeam();
    if (!myTeam) return;

    updateStateAndNotify(set, get, (state) => {
      const { myPlayerId, blueTeamPlayers, redTeamPlayers } = state;
      const player = (myTeam === 'blue' ? blueTeamPlayers : redTeamPlayers).find(p => p.id === myPlayerId);
      if (!player) return {};

      if (myTeam === 'blue' && redTeamPlayers.length === 0) {
        return {
          blueTeamPlayers: [],
          redTeamPlayers: [{...player, isReady: false}],
        };
      } else if (myTeam === 'red' && blueTeamPlayers.length === 0) {
        return {
          redTeamPlayers: [],
          blueTeamPlayers: [{...player, isReady: false}],
        };
      }
      return {};
    });
  },

  // --- 밴픽 진행 액션 ---
  selectChampion: (champion) => {
    if (!get().isMyTurn()) {
      console.warn("당신의 턴이 아닙니다.");
      return;
    }
    updateStateAndNotify(set, get, state => {
      const { turnIndex } = state;
      const currentTurn = BANPICK_ORDER[turnIndex];
      const key = currentTurn.team === 'blue' ? (currentTurn.action === 'ban' ? 'blueBans' : 'bluePicks') : (currentTurn.action === 'ban' ? 'redBans' : 'redPicks');
      return { [key]: [...state[key], champion], turnIndex: state.turnIndex + 1 };
    });
  },

  handleSwapRequest: (team, index) => {
    const { turnIndex } = get();
    // 밴픽이 완료된 후에만 스왑 요청 가능
    if (turnIndex < BANPICK_ORDER.length) return;
    
    updateStateAndNotify(set, get, state => {
      if (!state.swapRequest) return { swapRequest: { from: { team, index } } };
      if (state.swapRequest.from && !state.swapRequest.to) {
        if (state.swapRequest.from.team !== team || state.swapRequest.from.index === index) return { swapRequest: null };
        return { swapRequest: { ...state.swapRequest, to: { team, index } } };
      }
      return {};
    });
  },

  handleSwapAccept: () => {
    const { turnIndex } = get();
    if (turnIndex < BANPICK_ORDER.length) return;

    updateStateAndNotify(set, get, state => {
      const { from, to } = state.swapRequest;
      if (!from || !to) return { swapRequest: null };
      const picksKey = from.team === 'blue' ? 'bluePicks' : 'redPicks';
      const newPicks = [...state[picksKey]];
      [newPicks[from.index], newPicks[to.index]] = [newPicks[to.index], newPicks[from.index]];
      return { [picksKey]: newPicks, swapRequest: null };
    });
  },

  handleSwapCancel: () => updateStateAndNotify(set, get, { swapRequest: null }),
  
  finishGame: ({ winner }) => {
    const { turnIndex } = get();
    if (turnIndex < BANPICK_ORDER.length) return;
    
    updateStateAndNotify(set, get, state => {
        const { gameSeries, bluePicks, redPicks, blueBans, redBans, banMode } = state;
        const finishedGame = { bluePicks, redPicks, blueBans, redBans, winner };
        const newGameSeries = { ...gameSeries, games: [...gameSeries.games, finishedGame], blueWins: gameSeries.blueWins + (winner === "blue" ? 1 : 0), redWins: gameSeries.redWins + (winner === "red" ? 1 : 0), currentGame: gameSeries.currentGame + 1 };
        const newFearlessPicks = banMode === 'fearless' ? [ ...state.fearlessPicks, ...bluePicks.filter(Boolean), ...redPicks.filter(Boolean), ...blueBans.filter(Boolean), ...redBans.filter(Boolean) ] : [];
        return { gameSeries: newGameSeries, fearlessPicks: newFearlessPicks, turnIndex: 0, blueBans: [], redBans: [], bluePicks: [], redPicks: [], swapRequest: null };
    });
  },

  // --- 기타 게임 관리 액션 ---
  setGameInfo: (info) => updateStateAndNotify(set, get, { ...initialState, ...info }),
  startReadyCheck: () => updateStateAndNotify(set, get, { readyCheckStatus: 'in-progress' }),
  setPlayerReady: (team, playerId) => {
    if (get().myPlayerId !== playerId) {
        console.warn('자신의 준비 상태만 변경할 수 있습니다.');
        return;
    }
    updateStateAndNotify(set, get, (state) => {
      const teamKey = team === 'blue' ? 'blueTeamPlayers' : 'redTeamPlayers';
      const updatedTeam = state[teamKey].map(p => p.id === playerId ? { ...p, isReady: true } : p);
      const allBlueReady = state.blueTeamPlayers.every(p => p.isReady);
      const allRedReady = state.redTeamPlayers.every(p => p.isReady);
      return {
        [teamKey]: updatedTeam,
        readyCheckStatus: (allBlueReady && allRedReady && state.blueTeamPlayers.length > 0 && state.redTeamPlayers.length > 0) ? 'all-ready' : 'in-progress',
      };
    });
  },
  resetBoard: () => updateStateAndNotify(set, get, { turnIndex: 0, blueBans: [], redBans: [], bluePicks: [], redPicks: [], swapRequest: null }),
  startGameSeries: () => updateStateAndNotify(set, get, { gameSeries: { currentGame: 1, blueWins: 0, redWins: 0, games: [] }, fearlessPicks: [], turnIndex: 0, blueBans: [], redBans: [], bluePicks: [], redPicks: [], swapRequest: null }),
}));