import { create } from 'zustand';
import { createRoomAPI, getRoomAPI } from '../lib/api';
import { 
  getSocket, 
  joinRoom, 
  subscribeToRoomUpdates, 
  sendJoinTeam, 
  sendSwitchTeam, 
  sendChangeReadyState, 
  subscribeToReadyStateChanged, 
  sendStartDraft,
  subscribeToDraftStarted,
  sendSelectChampion,
  sendConfirmSelection,
  subscribeToChampionSelected,
  subscribeToPhaseProgressed,
  sendConfirmResult,
  subscribeToGameResultConfirmed
} from '../lib/socket';
import { uid } from 'uid';

import championData from '../data/champions.json';

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
  hostId: null,
  draftStarted: false,
    currentSelection: null, // Add new state for temporary selection
    champions: [],
      isChampionDataLoaded: false,
    };
    
    
    export const useRoomStore = create((set, get) => ({
      ...initialState,
    
      fetchChampions: () => {
        const champArray = Object.values(championData.data).map((c) => ({ id: c.id, name: c.name, image: `https://ddragon.leagueoflegends.com/cdn/15.20.1/img/champion/${c.image.full}`, tags: c.tags }));
        champArray.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        set({ champions: champArray, isChampionDataLoaded: true });
      },  createNewRoom: async (gameInfo) => {
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
    set((state) => ({
      ...initialState,
      champions: state.champions,
      isChampionDataLoaded: state.isChampionDataLoaded,
      gameName: info.gameName,
      blueTeamName: info.blueName,
      redTeamName: info.redName,
      gameMode: info.setCount,
      timerMode: info.timerMode,
      banMode: 'fearless',
      roomId: 'local',
      isConnected: true,
    }));
  },
  
  selectChampion: (champion) => {
    const { roomId } = get();
    if (get().turnIndex >= BANPICK_ORDER.length || !get().isMyTurn()) return;

    if (roomId === 'local') {
      set({ currentSelection: champion });
    } else {
      sendSelectChampion(roomId, champion);
    }
  },


  finishGame: ({ winner }) => {
    const { roomId } = get();
    if (roomId === 'local') {
      const updater = (state) => {
        const { gameSeries, bluePicks, redPicks, blueBans, redBans, banMode, fearlessPicks } = state;
        const finishedGame = { bluePicks, redPicks, blueBans, redBans, winner };
        const newGameSeries = { ...gameSeries, games: [...gameSeries.games, finishedGame], blueWins: gameSeries.blueWins + (winner === "blue" ? 1 : 0), redWins: gameSeries.redWins + (winner === "red" ? 1 : 0), currentGame: gameSeries.currentGame + 1 };
        const newFearlessPicks = banMode === 'fearless' ? [...(fearlessPicks || []), ...bluePicks, ...redPicks].filter(Boolean) : (fearlessPicks || []);
        return { gameSeries: newGameSeries, fearlessPicks: newFearlessPicks, turnIndex: 0, blueBans: [], redBans: [], bluePicks: [], redPicks: [], swapRequest: null };
      };
      set(updater);
    } else {
      sendConfirmResult(roomId, winner);
    }
  },

  confirmSelection: () => {
    const { roomId, currentSelection } = get();
    if (!currentSelection) return;

    if (roomId === 'local') {
      const championToConfirm = currentSelection;
      set((state) => {
        const currentTurn = BANPICK_ORDER[state.turnIndex];
        const key = currentTurn.team === 'blue' 
          ? (currentTurn.action === 'ban' ? 'blueBans' : 'bluePicks') 
          : (currentTurn.action === 'ban' ? 'redBans' : 'redPicks');
        
        return {
          turnIndex: state.turnIndex + 1,
          [key]: [...(state[key] || []), championToConfirm],
          currentSelection: null,
        };
      });
    } else {
      sendConfirmSelection(roomId);
    }
  },

  selectAndConfirmChampion: (champion) => {
    alert(`Champion clicked: ${champion.name}`);
    const { roomId, turnIndex } = get();
    if (roomId !== 'local' || turnIndex >= BANPICK_ORDER.length) {
      alert(`Condition failed: roomId=${roomId}, turnIndex=${turnIndex}`);
      return;
    }

    set((state) => {
      alert('Updating state...');
      const currentTurn = BANPICK_ORDER[state.turnIndex];
      const key = currentTurn.team === 'blue'
        ? (currentTurn.action === 'ban' ? 'blueBans' : 'bluePicks')
        : (currentTurn.action === 'ban' ? 'redBans' : 'redPicks');

      return {
        turnIndex: state.turnIndex + 1,
        [key]: [...(state[key] || []), champion],
      };
    });
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

  setReadyState: (isReady) => {
    const { roomId } = get();
    if (roomId !== 'local') {
      sendChangeReadyState(roomId, isReady);
    }
  },

  startDraft: () => {
    const { roomId } = get();
    if (roomId !== 'local') {
      sendStartDraft(roomId);
    }
  },

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
    const freshState = get();
    const allPlayers = [...(freshState.blueTeamPlayers || []), ...(freshState.redTeamPlayers || [])];
    const myPlayerObject = allPlayers.find(p => p.id === freshState.myPlayerId);
    const myName = myPlayerObject ? myPlayerObject.name : null;
    let myTeam = null;
    if (myPlayerObject) {
        if (freshState.blueTeamPlayers.some(p => p.id === freshState.myPlayerId)) {
            myTeam = 'blue';
        } else if (freshState.redTeamPlayers.some(p => p.id === freshState.myPlayerId)) {
            myTeam = 'red';
        }
    }
    joinRoom(roomId, freshState.myPlayerId, myName, myTeam);
    
    subscribeToRoomUpdates(set);
    subscribeToChampionSelected((data) => {
      const { champions } = get();
      let championObject = null;

      // Check if the champion object is nested inside the data object
      const potentialChampion = (data && data.champion) ? data.champion : data;

      if (typeof potentialChampion === 'string') {
        championObject = champions.find(c => c.id === potentialChampion || c.name === potentialChampion);
      } else if (typeof potentialChampion === 'object' && potentialChampion !== null && potentialChampion.id) {
        championObject = potentialChampion;
      }
      
      if (championObject) {
        set({ currentSelection: championObject });
      } else {
        console.error("Received champion data could not be processed:", data);
      }
    });
    subscribeToPhaseProgressed((data) => {
      console.log('Phase progressed, server confirmed:', data);
      set((state) => {
        const { fromPhase, confirmedChampion } = data;
        const turn = BANPICK_ORDER[fromPhase];
        if (!turn) return {};

        const key = turn.team === 'blue' 
          ? (turn.action === 'ban' ? 'blueBans' : 'bluePicks') 
          : (turn.action === 'ban' ? 'redBans' : 'redPicks');
        
        const currentSlot = state[key] || [];

        return {
          turnIndex: state.turnIndex + 1,
          [key]: [...currentSlot, confirmedChampion],
          currentSelection: null,
        };
      });
    });

    subscribeToReadyStateChanged((data) => {
        set((state) => {
            const findAndUpdate = (players) => {
                return players.map(p => {
                    if (p.name === data.nickname) {
                        return { ...p, isReady: data.isReady };
                    }
                    return p;
                });
            };
            return {
                blueTeamPlayers: findAndUpdate(state.blueTeamPlayers),
                redTeamPlayers: findAndUpdate(state.redTeamPlayers),
            };
        });
    });



    subscribeToDraftStarted((data) => {
        set({ draftStarted: true });
    });

    subscribeToGameResultConfirmed((data) => {
        console.log('Game result confirmed by server:', data);
        // The updateState event will handle the UI refresh
    });
  },
}));