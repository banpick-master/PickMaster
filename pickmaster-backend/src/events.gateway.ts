import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JoinRoomDto } from './dto/join-room.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  // 방 정보를 저장할 객체
  private rooms = {};

  private resetReadyState(roomId: string) {
    if (!this.rooms[roomId]) return;
    this.rooms[roomId].readyCheckStatus = 'idle';
    this.rooms[roomId].blueTeamPlayers.forEach((p) => (p.isReady = false));
    this.rooms[roomId].redTeamPlayers.forEach((p) => (p.isReady = false));
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log(`[joinRoom] Received data: ${JSON.stringify(data)} from client: ${client.id}`);
    const { roomId, team, name, playerId } = data;
    client.join(roomId);

    if (!this.rooms[roomId]) {
      this.rooms[roomId] = {
        blueTeamPlayers: [],
        redTeamPlayers: [],
        readyCheckStatus: 'idle',
      };
    }

    if (team && name && playerId) {
      this.rooms[roomId].blueTeamPlayers = this.rooms[roomId].blueTeamPlayers.filter(p => p.id !== playerId);
      this.rooms[roomId].redTeamPlayers = this.rooms[roomId].redTeamPlayers.filter(p => p.id !== playerId);

      const player = { id: playerId, name, isReady: false };

      if (team === 'blue' && this.rooms[roomId].blueTeamPlayers.length === 0) {
        this.rooms[roomId].blueTeamPlayers.push(player);
      } else if (team === 'red' && this.rooms[roomId].redTeamPlayers.length === 0) {
        this.rooms[roomId].redTeamPlayers.push(player);
      }

      this.resetReadyState(roomId);
      client.emit('joinedTeam', { team, playerId: playerId });
    } else if (playerId) {
      // team과 name 정보가 없어도 방에는 참여시킴
      // 추후 joinTeam 이벤트를 통해 팀에 합류
    }

    this.server.to(roomId).emit('updateState', this.rooms[roomId]);
  }

  @SubscribeMessage('switchTeam')
  handleSwitchTeam(
    @MessageBody() { roomId, playerId }: { roomId: string, playerId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = this.rooms[roomId];
    if (!room || !playerId) return;

    const blueTeamIndex = room.blueTeamPlayers.findIndex((p) => p.id === playerId);
    if (blueTeamIndex !== -1) {
      if (room.redTeamPlayers.length > 0) return;
      const player = room.blueTeamPlayers.splice(blueTeamIndex, 1)[0];
      room.redTeamPlayers.push(player);
      this.resetReadyState(roomId);
      client.emit('switchedTeam', { team: 'red' });
      this.server.to(roomId).emit('updateState', room);
      return;
    }

    const redTeamIndex = room.redTeamPlayers.findIndex((p) => p.id === playerId);
    if (redTeamIndex !== -1) {
      if (room.blueTeamPlayers.length > 0) return;
      const player = room.redTeamPlayers.splice(redTeamIndex, 1)[0];
      room.blueTeamPlayers.push(player);
      this.resetReadyState(roomId);
      client.emit('switchedTeam', { team: 'blue' });
      this.server.to(roomId).emit('updateState', room);
      return;
    }
  }

  @SubscribeMessage('setReady')
  handleSetReady(
    @MessageBody() { roomId, playerId }: { roomId: string; playerId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = this.rooms[roomId];
    if (!room) return;

    const player =
      room.blueTeamPlayers.find((p) => p.id === playerId) ||
      room.redTeamPlayers.find((p) => p.id === playerId);
    if (player) {
      player.isReady = !player.isReady;
    }

    const allPlayers = [...room.blueTeamPlayers, ...room.redTeamPlayers];
    // Both teams must have at least one player, and all players must be ready
    const allReady =
      room.blueTeamPlayers.length > 0 &&
      room.redTeamPlayers.length > 0 &&
      allPlayers.every((p) => p.isReady);

    if (allReady) {
      room.readyCheckStatus = 'all-ready';
    } else {
      room.readyCheckStatus = 'idle';
    }

    this.server.to(roomId).emit('updateState', room);
  }

  @SubscribeMessage('disconnecting')
  handleDisconnecting(@ConnectedSocket() client: Socket): void {
    client.rooms.forEach((roomId) => {
      if (this.rooms[roomId] && roomId !== client.id) {
        this.rooms[roomId].blueTeamPlayers = this.rooms[roomId].blueTeamPlayers.filter(
          (player) => player.id !== client.id,
        );
        this.rooms[roomId].redTeamPlayers = this.rooms[roomId].redTeamPlayers.filter(
          (player) => player.id !== client.id,
        );
        this.resetReadyState(roomId);
        this.server.to(roomId).emit('updateState', this.rooms[roomId]);
      }
    });
  }
}