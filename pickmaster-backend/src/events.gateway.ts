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
import { AppService } from './app.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventsGateway');

  constructor(private readonly appService: AppService) {}

  // Helper to read, update, save, and broadcast state safely
  private async updateAndBroadcast(roomId: string, updateFn: (state: any) => any) {
    try {
      const currentState = await this.appService.getRoom(roomId) || {};
      const newState = updateFn(currentState);
      await this.appService.updateRoom(roomId, newState);
      this.server.to(roomId).emit('updateState', newState); // Broadcast the new, authoritative state
      this.logger.log(`State updated and broadcasted to room ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to update and broadcast state for room ${roomId}`, error);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, roomId: string) {
    client.join(roomId);
    this.logger.log(`Client ${client.id} joined room ${roomId}`);
    const roomState = await this.appService.getRoom(roomId);
    if (roomState) {
      // Send the current full state to the client that just joined
      client.emit('updateState', roomState);
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, roomId: string) {
    client.leave(roomId);
    this.logger.log(`Client ${client.id} left room ${roomId}`);
  }

  // Specific handler for a player joining a team
  @SubscribeMessage('joinTeam')
  async handleJoinTeam(client: Socket, payload: { roomId: string; team: 'blue' | 'red'; player: any }) {
    this.logger.log(`Player ${payload.player.name} attempting to join ${payload.team} team in room ${payload.roomId}`);
    
    await this.updateAndBroadcast(payload.roomId, (state) => {
      const teamKey = payload.team === 'blue' ? 'blueTeamPlayers' : 'redTeamPlayers';
      const otherTeamKey = payload.team === 'blue' ? 'redTeamPlayers' : 'blueTeamPlayers';

      // Initialize team arrays if they don't exist
      if (!state[teamKey]) state[teamKey] = [];
      if (!state[otherTeamKey]) state[otherTeamKey] = [];

      // Check if player is already in a team
      const isAlreadyInBlue = state.blueTeamPlayers.some(p => p.id === payload.player.id);
      const isAlreadyInRed = state.redTeamPlayers.some(p => p.id === payload.player.id);
      if (isAlreadyInBlue || isAlreadyInRed) {
        this.logger.warn(`Player ${payload.player.name} is already in a team.`);
        return state; // Return current state without modification
      }

      // Add player to the team if it's not full (assuming 1 player per team for now)
      if (state[teamKey].length === 0) {
        state[teamKey].push(payload.player);
      } else {
        this.logger.warn(`Team ${payload.team} in room ${payload.roomId} is already full.`);
      }
      
      return state;
    });
  }

  @SubscribeMessage('switchTeam')
  async handleSwitchTeam(client: Socket, payload: { roomId: string; playerId: string; }) {
    this.logger.log(`Player ${payload.playerId} attempting to switch teams in room ${payload.roomId}`);

    await this.updateAndBroadcast(payload.roomId, (state) => {
      const { blueTeamPlayers, redTeamPlayers } = state;
      const playerInBlue = blueTeamPlayers.find(p => p.id === payload.playerId);
      const playerInRed = redTeamPlayers.find(p => p.id === payload.playerId);

      if (playerInBlue && redTeamPlayers.length === 0) {
        // Move from blue to red
        state.blueTeamPlayers = [];
        state.redTeamPlayers = [{ ...playerInBlue, isReady: false }];
        this.logger.log(`Player ${payload.playerId} moved from blue to red team.`);
      } else if (playerInRed && blueTeamPlayers.length === 0) {
        // Move from red to blue
        state.redTeamPlayers = [];
        state.blueTeamPlayers = [{ ...playerInRed, isReady: false }];
        this.logger.log(`Player ${payload.playerId} moved from red to blue team.`);
      } else {
        this.logger.warn(`Player ${payload.playerId} cannot switch teams. Conditions not met.`);
      }

      return state;
    });
  }

  // Generic handler for other state updates.
  // The client should only send the specific part of the state that changed.
  @SubscribeMessage('updateState')
  async handleStateUpdate(client: Socket, payload: { room: string; state: any }) {
    this.logger.log(`Generic state update for room ${payload.room}`);
    await this.updateAndBroadcast(payload.room, (state) => {
      // Deep merge would be better here, but for now, simple merge is ok for non-array properties
      return { ...state, ...payload.state };
    });
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // A full implementation should handle removing the player from the room state here.
    // This requires a mapping of socket.id to a player ID.
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }
}
