import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JoinGameDto } from './dto/join-game.dto';
import { SelectChampionDto } from './dto/select-champion.dto';
import { ChangeReadyStateDto } from './dto/change-ready-state.dto';
import { ConfirmResultDto } from './dto/confirm-result.dto';

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

@WebSocketGateway({
  cors: {
    origin: 'https://banpick-master-ab3e7.web.app',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  private rooms = {};

  private find_player_in_room(roomId: string, playerId: string) {
    const room = this.rooms[roomId];
    if (!room) return null;
    const bluePlayer = room.blueTeamPlayers.find(p => p.id === playerId);
    if (bluePlayer) return { player: bluePlayer, team: 'blue' };
    const redPlayer = room.redTeamPlayers.find(p => p.id === playerId);
    if (redPlayer) return { player: redPlayer, team: 'red' };
    return null;
  }

  private resetReadyState(roomId: string) {
    if (!this.rooms[roomId] || !this.rooms[roomId].blueTeamPlayers) return;
    this.rooms[roomId].readyCheckStatus = 'idle';
    this.rooms[roomId].blueTeamPlayers.forEach((p) => (p.isReady = false));
    this.rooms[roomId].redTeamPlayers.forEach((p) => (p.isReady = false));
  }

  private resetDraftState(roomId: string) {
    const room = this.rooms[roomId];
    if (!room) return;
    room.turnIndex = 0;
    room.blueBans = [];
    room.redBans = [];
    room.bluePicks = [];
    room.redPicks = [];
    room.currentSelection = null;
  }

  @SubscribeMessage('join_game')
  handleJoinRoom(
    @MessageBody() data: JoinGameDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, team, name, playerId } = data;
    client.join(roomId);

    if (!this.rooms[roomId]) {
      this.rooms[roomId] = {
        playerMap: {},
        hostId: null,
        blueTeamPlayers: [],
        redTeamPlayers: [],
        readyCheckStatus: 'idle',
        turnIndex: 0,
        blueBans: [],
        redBans: [],
        bluePicks: [],
        redPicks: [],
        currentSelection: null,
        gameSeries: { games: [], blueWins: 0, redWins: 0, currentGame: 1 },
        fearlessPicks: [],
      };
    }

    if (playerId) {
      this.rooms[roomId].playerMap[client.id] = playerId;
      if (!this.rooms[roomId].hostId) {
        this.rooms[roomId].hostId = playerId;
      }
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

  @SubscribeMessage('change_ready_state')
  handleSetReady(
    @MessageBody() data: ChangeReadyStateDto & { roomId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, isReady } = data;
    const room = this.rooms[roomId];
    if (!room) return;
    const playerId = room.playerMap[client.id];
    if (!playerId) return;
    const playerInfo = this.find_player_in_room(roomId, playerId);
    if (!playerInfo) return;
    playerInfo.player.isReady = isReady;
    this.server.to(roomId).emit('ready_state_changed', {
      nickname: playerInfo.player.name,
      position: playerInfo.team,
      isReady: playerInfo.player.isReady,
    });
    const allPlayers = [...room.blueTeamPlayers, ...room.redTeamPlayers];
    const allReady = room.blueTeamPlayers.length > 0 && room.redTeamPlayers.length > 0 && allPlayers.every((p) => p.isReady);

    if (allReady) {
      room.readyCheckStatus = 'all-ready';
    } else {
      room.readyCheckStatus = 'idle';
    }
    this.server.to(roomId).emit('updateState', room);
  }

  @SubscribeMessage('start_draft')
  handleStartDraft(
    @MessageBody() { roomId }: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = this.rooms[roomId];
    if (!room) return;
    const playerId = room.playerMap[client.id];
    if (room.hostId !== playerId) {
      client.emit('error', { message: 'Only the host can start the draft.' });
      return;
    }
    const allPlayers = [...room.blueTeamPlayers, ...room.redTeamPlayers];
    const allReady = room.blueTeamPlayers.length > 0 && room.redTeamPlayers.length > 0 && allPlayers.every((p) => p.isReady);
    if (!allReady) {
      client.emit('error', { message: 'Not all players are ready.' });
      return;
    }
    this.server.to(roomId).emit('draft_started', {
      gameCode: roomId,
      startedBy: room.hostId,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('select_champion')
  handleSelectChampion(
    @MessageBody() data: SelectChampionDto & { roomId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, champion } = data;
    const room = this.rooms[roomId];
    if (!room) return;
    const playerId = room.playerMap[client.id];
    if (!playerId) return;
    const playerInfo = this.find_player_in_room(roomId, playerId);
    if (!playerInfo) return;
    const currentTurn = BANPICK_ORDER[room.turnIndex];
    if (!currentTurn || currentTurn.team !== playerInfo.team) {
      client.emit('error', { message: 'Not your turn' });
      return;
    }
    room.currentSelection = { champion, player: playerInfo.player };
    this.server.to(roomId).emit('champion_selected', {
      nickname: playerInfo.player.name,
      position: playerInfo.team,
      champion: champion,
      phase: room.turnIndex,
      isConfirmed: false,
    });
  }

  @SubscribeMessage('confirm_selection')
  handleConfirmSelection(
    @MessageBody() { roomId }: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = this.rooms[roomId];
    if (!room || !room.currentSelection) return;
    const playerId = room.playerMap[client.id];
    if (!playerId || playerId !== room.currentSelection.player.id) {
      client.emit('error', { message: 'You are not the one who made the selection' });
      return;
    }
    const currentTurn = BANPICK_ORDER[room.turnIndex];
    const confirmedChampion = room.currentSelection.champion;
    const confirmingPlayerName = room.currentSelection.player.name;
    if (currentTurn.action === 'ban') {
      if (currentTurn.team === 'blue') room.blueBans = [...room.blueBans, confirmedChampion];
      else room.redBans = [...room.redBans, confirmedChampion];
    } else {
      if (currentTurn.team === 'blue') room.bluePicks = [...room.bluePicks, confirmedChampion];
      else room.redPicks = [...room.redPicks, confirmedChampion];
    }
    const fromPhase = room.turnIndex;
    room.turnIndex++;
    room.currentSelection = null;
    this.server.to(roomId).emit('phase_progressed', {
      gameCode: roomId,
      confirmedBy: confirmingPlayerName,
      fromPhase: fromPhase,
      toPhase: room.turnIndex,
      confirmedChampion: confirmedChampion,
      timestamp: Date.now(),
    });
    this.server.to(roomId).emit('updateState', room);
  }

  @SubscribeMessage('confirm_result')
  handleConfirmResult(
    @MessageBody() data: ConfirmResultDto & { roomId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, winner } = data;
    const room = this.rooms[roomId];
    if (!room) return;

    const playerId = room.playerMap[client.id];
    if (room.hostId !== playerId) {
      client.emit('error', { message: 'Only the host can confirm the result.' });
      return;
    }

    if (winner === 'blue') {
      room.gameSeries.blueWins++;
    } else {
      room.gameSeries.redWins++;
    }
    room.gameSeries.currentGame++;

    const picksToArchive = [...room.bluePicks, ...room.redPicks].filter(Boolean);
    room.fearlessPicks = [...(room.fearlessPicks || []), ...picksToArchive];

    const hostInfo = this.find_player_in_room(roomId, room.hostId);

    const finishedGame = {
      bluePicks: room.bluePicks,
      redPicks: room.redPicks,
      blueBans: room.blueBans,
      redBans: room.redBans,
      winner: winner,
    };
    room.gameSeries.games.push(finishedGame);

    this.server.to(roomId).emit('game_result_confirmed', {
      gameCode: roomId,
      confirmedBy: hostInfo ? hostInfo.player.name : 'Host',
      winner: winner,
      blueScore: room.gameSeries.blueWins,
      redScore: room.gameSeries.redWins,
      nextSetNumber: room.gameSeries.currentGame,
      timestamp: Date.now(),
    });

    this.resetDraftState(roomId);
    this.server.to(roomId).emit('updateState', room);
  }

  @SubscribeMessage('disconnecting')
  handleDisconnecting(@ConnectedSocket() client: Socket): void {
    client.rooms.forEach((roomId) => {
      const room = this.rooms[roomId];
      if (room && roomId !== client.id) {
        const playerId = room.playerMap[client.id];
        if (!playerId) return;
        const wasInBlue = room.blueTeamPlayers.some(p => p.id === playerId);
        const wasInRed = room.redTeamPlayers.some(p => p.id === playerId);
        if (wasInBlue) room.blueTeamPlayers = room.blueTeamPlayers.filter(p => p.id !== playerId);
        if (wasInRed) room.redTeamPlayers = room.redTeamPlayers.filter(p => p.id !== playerId);
        delete room.playerMap[client.id];
        if (wasInBlue || wasInRed) {
          this.resetReadyState(roomId);
          this.server.to(roomId).emit('updateState', room);
        }
      }
    });
  }
}
