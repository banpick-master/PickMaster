import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JoinGameDto } from './dto/join-game.dto';
import { SelectChampionDto } from './dto/select-champion.dto';
import { ChangeReadyStateDto } from './dto/change-ready-state.dto';
import { ConfirmResultDto } from './dto/confirm-result.dto';
import { AppService, RoomState } from './app.service';

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
  transports: ['websocket'],
  cors: {
    origin: ['http://localhost:5173', 'https://pick-master.vercel.app/'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly appService: AppService) {}

  @SubscribeMessage('join_game')
  handleJoinRoom(
    @MessageBody() data: JoinGameDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, team, name, playerId } = data;
    client.join(roomId);

    let room = this.appService.getRoom(roomId);
    if (!room) {
      // If room doesn't exist, it means it wasn't created via HTTP POST.
      // This scenario should ideally not happen if frontend flow is correct.
      // For robustness, we can create a minimal room or throw an error.
      // For now, let's assume rooms are created via HTTP POST.
      client.emit('error', { message: `Room ${roomId} not found.` });
      return;
    }

    // Add player to room if not already present
    if (playerId) {
      // Ensure playerMap exists
      if (!room.playerMap) {
        room.playerMap = {};
      }
      room.playerMap[client.id] = playerId;

      if (!room.hostId) {
        room.hostId = playerId;
      }
    }

    if (team && name && playerId) {
      // Remove player from any existing team
      room.blueTeamPlayers = room.blueTeamPlayers.filter(p => p.id !== playerId);
      room.redTeamPlayers = room.redTeamPlayers.filter(p => p.id !== playerId);

      const player = { id: playerId, name, isReady: false };
      if (team === 'blue' && room.blueTeamPlayers.length === 0) {
        room.blueTeamPlayers.push(player);
      } else if (team === 'red' && room.redTeamPlayers.length === 0) {
        room.redTeamPlayers.push(player);
      }
      this.appService.resetReadyState(roomId);
      client.emit('joinedTeam', { team, playerId: playerId });
    }
    this.appService.updateRoom(roomId, room);
    this.server.to(roomId).emit('updateState', room);
  }

  @SubscribeMessage('switchTeam')
  handleSwitchTeam(
    @MessageBody() { roomId, playerId }: { roomId: string, playerId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    let room = this.appService.getRoom(roomId);
    if (!room || !playerId) return;

    const blueTeamIndex = room.blueTeamPlayers.findIndex((p) => p.id === playerId);
    if (blueTeamIndex !== -1) {
      if (room.redTeamPlayers.length > 0) return;
      const player = room.blueTeamPlayers.splice(blueTeamIndex, 1)[0];
      room.redTeamPlayers.push(player);
      this.appService.resetReadyState(roomId);
      client.emit('switchedTeam', { team: 'red' });
      this.appService.updateRoom(roomId, room);
      this.server.to(roomId).emit('updateState', room);
      return;
    }

    const redTeamIndex = room.redTeamPlayers.findIndex((p) => p.id === playerId);
    if (redTeamIndex !== -1) {
      if (room.blueTeamPlayers.length > 0) return;
      const player = room.redTeamPlayers.splice(redTeamIndex, 1)[0];
      room.blueTeamPlayers.push(player);
      this.appService.resetReadyState(roomId);
      client.emit('switchedTeam', { team: 'blue' });
      this.appService.updateRoom(roomId, room);
      this.server.to(roomId).emit('updateState', room);
      return;
    }
  }

  @SubscribeMessage('change_ready_state')
  @UsePipes(new ValidationPipe())
  handleSetReady(
    @MessageBody() data: ChangeReadyStateDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, isReady } = data;
    let room = this.appService.getRoom(roomId);
    if (!room) return;

    // Ensure playerMap exists before accessing
    if (!room.playerMap) {
      room.playerMap = {};
    }
    const playerId = room.playerMap[client.id];
    if (!playerId) return;

    const playerInfo = this.appService.findPlayerInRoom(roomId, playerId);
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
    this.appService.updateRoom(roomId, room);
    this.server.to(roomId).emit('updateState', room);
  }

  @SubscribeMessage('start_draft')
  handleStartDraft(
    @MessageBody() { roomId }: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    let room = this.appService.getRoom(roomId);
    if (!room) return;

    // Ensure playerMap exists before accessing
    if (!room.playerMap) {
      room.playerMap = {};
    }
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

    room.draftStarted = true; // Set draftStarted to true
    this.appService.updateRoom(roomId, room);

    this.server.to(roomId).emit('draft_started', {
      gameCode: roomId,
      startedBy: room.hostId,
      timestamp: Date.now(),
    });
    this.server.to(roomId).emit('updateState', room);
  }

  @SubscribeMessage('select_champion')
  handleSelectChampion(
    @MessageBody() data: SelectChampionDto & { roomId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, champion } = data;
    let room = this.appService.getRoom(roomId);
    if (!room) return;

    // Ensure playerMap exists before accessing
    if (!room.playerMap) {
      room.playerMap = {};
    }
    const playerId = room.playerMap[client.id];
    if (!playerId) return;

    const playerInfo = this.appService.findPlayerInRoom(roomId, playerId);
    if (!playerInfo) return;

    const currentTurn = BANPICK_ORDER[room.turnIndex];
    if (!currentTurn || currentTurn.team !== playerInfo.team) {
      client.emit('error', { message: 'Not your turn' });
      return;
    }

    room.currentSelection = { champion, player: playerInfo.player };
    this.appService.updateRoom(roomId, room);

    this.server.to(roomId).emit('champion_selected', {
      nickname: playerInfo.player.name,
      position: playerInfo.team,
      champion: champion,
      phase: room.turnIndex,
      isConfirmed: false,
    });
    this.server.to(roomId).emit('updateState', room);
  }

  @SubscribeMessage('confirm_selection')
  handleConfirmSelection(
    @MessageBody() { roomId }: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    let room = this.appService.getRoom(roomId);
    if (!room || !room.currentSelection) return;

    // Ensure playerMap exists before accessing
    if (!room.playerMap) {
      room.playerMap = {};
    }
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
    this.appService.updateRoom(roomId, room);

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
    let room = this.appService.getRoom(roomId);
    if (!room) return;

    // Ensure playerMap exists before accessing
    if (!room.playerMap) {
      room.playerMap = {};
    }
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

    const hostInfo = this.appService.findPlayerInRoom(roomId, room.hostId);

    const finishedGame = {
      bluePicks: room.bluePicks,
      redPicks: room.redPicks,
      blueBans: room.blueBans,
      redBans: room.redBans,
      winner: winner,
    };
    room.gameSeries.games.push(finishedGame);

    this.appService.resetDraftState(roomId);
    this.appService.updateRoom(roomId, room);

    this.server.to(roomId).emit('game_result_confirmed', {
      gameCode: roomId,
      confirmedBy: hostInfo ? hostInfo.player.name : 'Host',
      winner: winner,
      blueScore: room.gameSeries.blueWins,
      redScore: room.gameSeries.redWins,
      nextSetNumber: room.gameSeries.currentGame,
      timestamp: Date.now(),
    });
    this.server.to(roomId).emit('updateState', room);
  }

  @SubscribeMessage('disconnecting')
  handleDisconnecting(@ConnectedSocket() client: Socket): void {
    client.rooms.forEach((roomId) => {
      let room = this.appService.getRoom(roomId);
      if (room && roomId !== client.id) {
        // Ensure playerMap exists before accessing
        if (!room.playerMap) {
          room.playerMap = {};
        }
        const playerId = room.playerMap[client.id];
        if (!playerId) return;

        const wasInBlue = room.blueTeamPlayers.some(p => p.id === playerId);
        const wasInRed = room.redTeamPlayers.some(p => p.id === playerId);
        if (wasInBlue) room.blueTeamPlayers = room.blueTeamPlayers.filter(p => p.id !== playerId);
        if (wasInRed) room.redTeamPlayers = room.redTeamPlayers.filter(p => p.id !== playerId);
        delete room.playerMap[client.id];
        if (wasInBlue || wasInRed) {
          this.appService.resetReadyState(roomId);
          this.appService.updateRoom(roomId, room);
          this.server.to(roomId).emit('updateState', room);
        }
      }
    });
  }
}
