import { BANPICK_ORDER } from './constants'; // BANPICK_ORDER를 별도 파일로 분리할 것을 가정

export const initializeSocketListeners = (socket, set, get) => {
  socket.on('connect', () => {
    console.log('Socket.IO connected');
    set({ isConnected: true });
  });

  socket.on('disconnect', () => {
    console.log('Socket.IO disconnected');
    set({ isConnected: false });
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  socket.on('updateState', (state) => {
    set((oldState) => ({ ...oldState, ...state }));
  });

  socket.on('ready_state_changed', (data) => {
    set((state) => {
      const findAndUpdate = (players) => {
        if (!players) return [];
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

  socket.on('draft_started', (data) => {
    set({ draftStarted: true, turnDuration: data.turnDuration, turnEndTime: data.turnEndTime });
  });

  socket.on('champion_selected', (data) => {
    const { champions } = get();
    let championObject = null;
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

  socket.on('phase_progressed', (data) => {
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
        turnDuration: data.turnDuration,
        turnEndTime: data.turnEndTime,
      };
    });
  });

  socket.on('game_result_confirmed', (data) => {
    console.log('Game result confirmed by server:', data);
    // The updateState event will handle the UI refresh
  });
};
