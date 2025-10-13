import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AppService, RoomState } from './app.service';

const BANPICK_ORDER = [
  { team: 'blue', action: 'ban' },
  { team: 'red', action: 'ban' },
  { team: 'blue', action: 'ban' },
  { team: 'red', action: 'ban' },
  { team: 'blue', action: 'ban' },
  { team: 'red', action: 'ban' },
  { team: 'blue', action: 'pick' },
  { team: 'red', action: 'pick' },
  { team: 'red', action: 'pick' },
  { team: 'blue', action: 'pick' },
  { team: 'blue', action: 'pick' },
  { team: 'red', action: 'pick' },
  { team: 'red', action: 'ban' },
  { team: 'blue', action: 'ban' },
  { team: 'red', action: 'ban' },
  { team: 'blue', action: 'ban' },
  { team: 'red', action: 'pick' },
  { team: 'blue', action: 'pick' },
  { team: 'blue', action: 'pick' },
  { team: 'red', action: 'pick' },
];

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventsGateway');
  private clients: Map<string, { roomId: string, playerId: string }> = new Map();

  constructor(private readonly appService: AppService) {}

  private async updateAndBroadcast(roomId: string, updateFn: (state: RoomState) => Partial<RoomState>) {
    try {
      this.logger.log(`[updateAndBroadcast] Starting for room: ${roomId}`);
      const currentState = await this.appService.getRoom(roomId);
      if (!currentState) {
        this.logger.error(`Room ${roomId} not found for update.`);
        return;
      }

      const updates = updateFn(currentState);

      if (Object.keys(updates).length === 0) {
        this.logger.log('[updateAndBroadcast] No state changes to apply.');
        return;
      }

      await this.appService.updateRoom(roomId, updates);
      const newState = await this.appService.getRoom(roomId);

      this.logger.log(`[updateAndBroadcast] Broadcasting 'updateState' to room: ${roomId}`);
      this.logger.log(`[updateAndBroadcast] State being broadcast: ${JSON.stringify(newState)}`);

      this.server.to(roomId).emit('updateState', newState);
      this.logger.log(`[updateAndBroadcast] Broadcast complete for room: ${roomId}`);
    } catch (error) {
      this.logger.error(`[updateAndBroadcast] Error for room ${roomId}:`, error);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, payload: { roomId: string, playerId: string}) {
    client.join(payload.roomId);
    this.clients.set(client.id, { roomId: payload.roomId, playerId: payload.playerId });
    this.logger.log(`Client ${client.id} (${payload.playerId}) joined room ${payload.roomId}`);
    this.logger.log(`Socket ${client.id} has been added to Socket.IO room: ${payload.roomId}`);
    const roomState = await this.appService.getRoom(payload.roomId);
    if (roomState) {
      client.emit('updateState', roomState);
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, roomId: string) {
    client.leave(roomId);
    this.clients.delete(client.id);
    this.logger.log(`Client ${client.id} left room ${roomId}`);
  }

  @SubscribeMessage('joinTeam')
  async handleJoinTeam(client: Socket, payload: { roomId: string; team: 'blue' | 'red'; player: { id: string; name: string } }) {
    this.logger.log(`Player ${payload.player.name} attempting to join ${payload.team} team in room ${payload.roomId}`);
    this.clients.set(client.id, { roomId: payload.roomId, playerId: payload.player.id });
    
    await this.updateAndBroadcast(payload.roomId, (state) => {
      const teamKey = payload.team === 'blue' ? 'blueTeamPlayers' : 'redTeamPlayers';
      const otherTeamKey = payload.team === 'blue' ? 'redTeamPlayers' : 'blueTeamPlayers';

      if (!state[teamKey]) state[teamKey] = [];
      if (!state[otherTeamKey]) state[otherTeamKey] = [];

      const isAlreadyInBlue = state.blueTeamPlayers.some(p => p.id === payload.player.id);
      const isAlreadyInRed = state.redTeamPlayers.some(p => p.id === payload.player.id);

      if (isAlreadyInBlue || isAlreadyInRed) {
        this.logger.warn(`Player ${payload.player.name} is already in a team.`);
        return {};
      }

      if (state[teamKey].length === 0) { // 1 player per team logic
        return { [teamKey]: [payload.player] };
      } else {
        this.logger.warn(`Team ${payload.team} in room ${payload.roomId} is already full.`);
        return {};
      }
    });
  }

  @SubscribeMessage('switchTeam')
  async handleSwitchTeam(client: Socket, payload: { roomId: string; playerId: string; }) {
    this.logger.log(`Player ${payload.playerId} attempting to switch teams in room ${payload.roomId}`);

    await this.updateAndBroadcast(payload.roomId, (state) => {
      const { blueTeamPlayers, redTeamPlayers } = state;
      const playerInBlue = blueTeamPlayers.find(p => p.id === payload.playerId);
      const playerInRed = redTeamPlayers.find(p => p.id === payload.playerId);

      if (!playerInBlue && !playerInRed) {
        this.logger.warn(`Player ${payload.playerId} not found in any team.`);
        return {};
      }

      if (playerInBlue) {
        if (redTeamPlayers.length === 0) { // 1 player per team logic
          return {
            blueTeamPlayers: [],
            redTeamPlayers: [playerInBlue],
          };
        } else {
          this.logger.warn('Red team is full, cannot switch.');
          return {};
        }
      } else { // Player is in Red Team
        if (blueTeamPlayers.length === 0) { // 1 player per team logic
          return {
            redTeamPlayers: [],
            blueTeamPlayers: [playerInRed],
          };
        } else {
          this.logger.warn('Blue team is full, cannot switch.');
          return {};
        }
      }
    });
  }

  @SubscribeMessage('selectChampion')
  async handleSelectChampion(client: Socket, payload: { roomId: string, champion: any, playerId: string }) {
    await this.updateAndBroadcast(payload.roomId, (state) => {
        const { turnIndex, blueTeamPlayers } = state;
        if (turnIndex >= BANPICK_ORDER.length) return {};

        const currentTurn = BANPICK_ORDER[turnIndex];
        const playerTeam = blueTeamPlayers.some(p => p.id === payload.playerId) ? 'blue' : 'red';

        if (playerTeam !== currentTurn.team) {
            this.logger.warn(`Player ${payload.playerId} tried to act on wrong turn.`);
            return {};
        }

        const key = currentTurn.team === 'blue' 
            ? (currentTurn.action === 'ban' ? 'blueBans' : 'bluePicks') 
            : (currentTurn.action === 'ban' ? 'redBans' : 'redPicks');
        
        return {
          [key]: [...state[key], payload.champion],
          turnIndex: turnIndex + 1,
        };
    });
  }

  @SubscribeMessage('finishGame')
  async handleFinishGame(client: Socket, payload: { roomId: string; winner: 'blue' | 'red' }) {
    await this.updateAndBroadcast(payload.roomId, (state) => {
      const { gameSeries, bluePicks, redPicks, blueBans, redBans, banMode, fearlessPicks } = state;
      const finishedGame = { bluePicks, redPicks, blueBans, redBans, winner: payload.winner };
      const newGameSeries = { 
          ...gameSeries, 
          games: [...gameSeries.games, finishedGame], 
          blueWins: gameSeries.blueWins + (payload.winner === "blue" ? 1 : 0), 
          redWins: gameSeries.redWins + (payload.winner === "red" ? 1 : 0),
          currentGame: gameSeries.currentGame + 1 
      };
      const newFearlessPicks = banMode === 'fearless' ? [...(fearlessPicks || []), ...bluePicks, ...redPicks].filter(Boolean) : (fearlessPicks || []);
      
      return { 
          gameSeries: newGameSeries, 
          fearlessPicks: newFearlessPicks, 
          turnIndex: 0, 
          blueBans: [], 
          redBans: [], 
          bluePicks: [], 
          redPicks: [], 
          swapRequest: null 
      };
    });
  }

    @SubscribeMessage('playerReady')
    async handlePlayerReady(client: Socket, payload: { roomId: string, playerId: string }) {
        await this.updateAndBroadcast(payload.roomId, (state) => {
            this.logger.warn('handlePlayerReady is not implemented for the current data model.');
            return {};
        });
    }

  @SubscribeMessage('startReadyCheck')
  async handleStartReadyCheck(client: Socket, roomId: string) {
      await this.updateAndBroadcast(roomId, (state) => {
          return { readyCheckStatus: 'done' };
      });
  }

  @SubscribeMessage('updateState')
  async handleStateUpdate(client: Socket, payload: { room: string; state: any }) {
    this.logger.log(`Generic state update for room ${payload.room}`);
    await this.updateAndBroadcast(payload.room, (state) => {
      return { ...state, ...payload.state };
    });
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  async handleDisconnect(client: Socket) {
    const clientInfo = this.clients.get(client.id);
    if (clientInfo) {
      const { playerId, roomId } = clientInfo;
      this.logger.log(`Client disconnected: ${client.id} (${playerId}) from room ${roomId}`);

      await this.updateAndBroadcast(roomId, (state) => {
        const newBlueTeam = state.blueTeamPlayers.filter(p => p.id !== playerId);
        const newRedTeam = state.redTeamPlayers.filter(p => p.id !== playerId);

        return {
          blueTeamPlayers: newBlueTeam,
          redTeamPlayers: newRedTeam,
        };
      });

      this.clients.delete(client.id);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }
}