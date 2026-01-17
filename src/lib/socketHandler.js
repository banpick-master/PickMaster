import { BANPICK_ORDER } from './constants';

export const handleSocketMessage = (payload, set, get) => {
  if (!payload) return;

  const { type, data } = payload;

  // 만약 payload가 type 없이 데이터만 온다면, 전체 상태 업데이트로 간주 (혹은 구조에 따라 조정 필요)
  if (!type && typeof payload === 'object') {
     console.log('Received state update without type:', payload);
     set((state) => ({ ...state, ...payload }));
     return;
  }

  console.log(`Received Socket Message: ${type}`, data);

  switch (type) {
    case 'UPDATE_STATE': // socket.io 'updateState'
      set((state) => ({ ...state, ...data }));
      break;

    case 'READY_STATE_CHANGED': // socket.io 'ready_state_changed'
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
      break;

    case 'DRAFT_STARTED': // socket.io 'draft_started'
      set({ draftStarted: true, turnDuration: data.turnDuration, turnEndTime: data.turnEndTime });
      break;

    case 'CHAMPION_SELECTED': // socket.io 'champion_selected'
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
      }
      break;

    case 'PHASE_PROGRESSED': // socket.io 'phase_progressed'
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
      break;

    case 'GAME_RESULT_CONFIRMED': // socket.io 'game_result_confirmed'
       console.log('Game result confirmed:', data);
       // 보통 결과 확정 후 상태 업데이트도 같이 오므로 로그만 남김
       break;

    default:
      console.warn('Unknown message type:', type);
      // Fallback: type이 없지만 data가 있는 경우 병합 시도
      if (data) {
          set((state) => ({ ...state, ...data }));
      }
      break;
  }
};