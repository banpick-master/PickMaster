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
import { AppService } from './app.service';
import { BANPICK_ORDER } from './common/constants';

@UsePipes(new ValidationPipe())
@WebSocketGateway({
  transports: ['websocket'],
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly appService: AppService) {}

  private async startTurnTimer(roomId: string) {
    let room = await this.appService.getRoom(roomId);
    if (!room || room.timerMode === 'infinite' || room.turnIndex >= BANPICK_ORDER.length) {
      return;
    }
  
    const turnDuration = this.appService.getTurnDuration(room.timerMode);
    const turnEndTime = Date.now() + turnDuration;
  
    room.turnDuration = turnDuration;
    room.turnEndTime = turnEndTime;
  
    await this.appService.updateRoom(roomId, { turnDuration, turnEndTime });
  
    this.appService.startTimer(roomId, turnDuration, () => {
      this.handleTurnTimeout(roomId);
    });
  }

  async handleTurnTimeout(roomId: string) {
    let room = await this.appService.getRoom(roomId);
    if (!room) return;
  
    // If there's no selection, the turn is forfeited, and we just move on.
    // The current selection (or lack thereof) is 'confirmed' automatically.
    const fromPhase = room.turnIndex;
    const currentTurn = BANPICK_ORDER[fromPhase];
    let confirmedChampion = room.currentSelection ? room.currentSelection.champion : null;
    let confirmingPlayerName = room.currentSelection ? room.currentSelection.player.name : 'System';
  
    // If it's a pick phase and no champion was selected, we can't just proceed with null.
    // For now, we'll log an error and stop. A more robust solution could pick a random champ or end the game.
    if (currentTurn.action === 'pick' && !confirmedChampion) {
      console.error(`Room ${roomId}: Pick phase timed out without a selection.`);
      // Potentially emit an error to the room
      // this.server.to(roomId).emit('error', { message: 'Pick timer expired without a selection.' });
      return; // Or implement more robust logic
    }
  
    // Update bans/picks array
    if (confirmedChampion) {
      if (currentTurn.action === 'ban') {
        if (currentTurn.team === 'blue') room.blueBans = [...room.blueBans, confirmedChampion];
        else room.redBans = [...room.redBans, confirmedChampion];
      } else {
        if (currentTurn.team === 'blue') room.bluePicks = [...room.bluePicks, confirmedChampion];
        else room.redPicks = [...room.redPicks, confirmedChampion];
      }
    }
  
    room.turnIndex++;
    room.currentSelection = null;
  
    const updatedRoom = await this.appService.updateRoom(roomId, room);
  
    this.server.to(roomId).emit('phase_progressed', {
      gameCode: roomId,
      confirmedBy: confirmingPlayerName,
      fromPhase: fromPhase,
      toPhase: room.turnIndex,
      confirmedChampion: confirmedChampion, // Can be null for a forfeited ban
      timestamp: Date.now(),
      turnDuration: updatedRoom.turnDuration,
      turnEndTime: updatedRoom.turnEndTime,
    });
    this.server.to(roomId).emit('updateState', updatedRoom);
  
    // Start timer for the next turn
    this.startTurnTimer(roomId);
  }

  @SubscribeMessage('join_game')
  async handleJoinRoom(
    @MessageBody() data: JoinGameDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomId, team, name, playerId } = data;
    client.join(roomId);

    let room = await this.appService.getRoom(roomId);
    if (!room) {
      client.emit('error', { message: `Room ${roomId} not found.` });
      return;
    }

    if (playerId) {
      if (!room.playerMap) {
        room.playerMap = {};
      }
      room.playerMap[client.id] = playerId;

      if (!room.hostId) {
        room.hostId = playerId;
      }
    }

    if (team && name && playerId) {
      room.blueTeamPlayers = room.blueTeamPlayers.filter(p => p.id !== playerId);
      room.redTeamPlayers = room.redTeamPlayers.filter(p => p.id !== playerId);

      const player = { id: playerId, name, isReady: false };
      if (team === 'blue') {
        room.blueTeamPlayers.push(player);
      } else if (team === 'red') {
        room.redTeamPlayers.push(player);
      }
      room = this.appService.resetReadyState(room);
      client.emit('joinedTeam', { team, playerId: playerId });
    }
    const updatedRoom = await this.appService.updateRoom(roomId, room);
    this.server.to(roomId).emit('updateState', updatedRoom);
  }

  @SubscribeMessage('switchTeam')
  async handleSwitchTeam(
    @MessageBody() { roomId, playerId }: { roomId: string, playerId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    let room = await this.appService.getRoom(roomId);
    if (!room || !playerId) return;

    const blueTeamIndex = room.blueTeamPlayers.findIndex((p) => p.id === playerId);
    if (blueTeamIndex !== -1) {
      if (room.redTeamPlayers.length > 0) return;
      const player = room.blueTeamPlayers.splice(blueTeamIndex, 1)[0];
      room.redTeamPlayers.push(player);
      room = this.appService.resetReadyState(room);
      client.emit('switchedTeam', { team: 'red' });
      const updatedRoom = await this.appService.updateRoom(roomId, room);
      this.server.to(roomId).emit('updateState', updatedRoom);
      return;
    }

    const redTeamIndex = room.redTeamPlayers.findIndex((p) => p.id === playerId);
    if (redTeamIndex !== -1) {
      if (room.blueTeamPlayers.length > 0) return;
      const player = room.redTeamPlayers.splice(redTeamIndex, 1)[0];
      room.blueTeamPlayers.push(player);
      room = this.appService.resetReadyState(room);
      client.emit('switchedTeam', { team: 'blue' });
      const updatedRoom = await this.appService.updateRoom(roomId, room);
      this.server.to(roomId).emit('updateState', updatedRoom);
      return;
    }
  }

  @SubscribeMessage('change_ready_state')
  async handleSetReady(
    @MessageBody() data: ChangeReadyStateDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomId, isReady } = data;
    let room = await this.appService.getRoom(roomId);
    if (!room) return;

    if (!room.playerMap) {
      room.playerMap = {};
    }
    const playerId = room.playerMap[client.id];
    if (!playerId) return;

    const playerInfo = this.appService.findPlayerInRoom(room, playerId);
    if (!playerInfo) return;

    if (playerInfo.team === 'blue') {
      room.blueTeamPlayers = room.blueTeamPlayers.map(p =>
        p.id === playerId ? { ...p, isReady: isReady } : p
      );
    } else {
      room.redTeamPlayers = room.redTeamPlayers.map(p =>
        p.id === playerId ? { ...p, isReady: isReady } : p
      );
    }
    this.server.to(roomId).emit('ready_state_changed', {
      nickname: playerInfo.player.name,
      position: playerInfo.team,
      isReady: isReady,
    });

    const allPlayers = [...room.blueTeamPlayers, ...room.redTeamPlayers];
    const allReady = room.blueTeamPlayers.length > 0 && room.redTeamPlayers.length > 0 && allPlayers.every((p) => p.isReady);

    if (allReady) {
      room.readyCheckStatus = 'all-ready';
    } else {
      room.readyCheckStatus = 'idle';
    }
    const updatedRoom = await this.appService.updateRoom(roomId, room);
    this.server.to(roomId).emit('updateState', updatedRoom);
  }

  @SubscribeMessage('start_draft')
  async handleStartDraft(
    @MessageBody() { roomId }: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    let room = await this.appService.getRoom(roomId);
    if (!room) return;

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

    room.draftStarted = true;
    const updatedRoom = await this.appService.updateRoom(roomId, { draftStarted: true });
    
    this.server.to(roomId).emit('draft_started', {
      gameCode: roomId,
      startedBy: room.hostId,
      timestamp: Date.now(),
      turnDuration: updatedRoom.turnDuration,
      turnEndTime: updatedRoom.turnEndTime,
    });
    this.server.to(roomId).emit('updateState', updatedRoom);
    this.startTurnTimer(roomId);
  }

  @SubscribeMessage('select_champion')
  async handleSelectChampion(
    @MessageBody() data: SelectChampionDto & { roomId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomId, champion } = data;
    let room = await this.appService.getRoom(roomId);
    if (!room) return;

    if (!room.playerMap) {
      room.playerMap = {};
    }
    const playerId = room.playerMap[client.id];
    if (!playerId) return;

    const playerInfo = this.appService.findPlayerInRoom(room, playerId);
    if (!playerInfo) return;

    const currentTurn = BANPICK_ORDER[room.turnIndex];
    if (!currentTurn || currentTurn.team !== playerInfo.team) {
      client.emit('error', { message: 'Not your turn' });
      return;
    }

    if (room.banMode === 'fearless' && room.fearlessPicks.some(p => p.id === champion.id)) {
      client.emit('error', { message: 'This champion has already been picked in this series.' });
      return;
    }

    room.currentSelection = { champion, player: playerInfo.player };
    const updatedRoom = await this.appService.updateRoom(roomId, room);

    this.server.to(roomId).emit('champion_selected', {
      nickname: playerInfo.player.name,
      position: playerInfo.team,
      champion: champion,
      phase: room.turnIndex,
      isConfirmed: false,
    });
    this.server.to(roomId).emit('updateState', updatedRoom);
  }

  @SubscribeMessage('confirm_selection')
  async handleConfirmSelection(
    @MessageBody() { roomId }: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    this.appService.clearTimer(roomId);
    let room = await this.appService.getRoom(roomId);
    if (!room || !room.currentSelection) return;

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
    
    // Pass the updated fields directly to updateRoom
    const updatedRoom = await this.appService.updateRoom(roomId, {
      turnIndex: room.turnIndex,
      currentSelection: null,
      blueBans: room.blueBans,
      redBans: room.redBans,
      bluePicks: room.bluePicks,
      redPicks: room.redPicks,
    });

    this.server.to(roomId).emit('phase_progressed', {
      gameCode: roomId,
      confirmedBy: confirmingPlayerName,
      fromPhase: fromPhase,
      toPhase: room.turnIndex,
      confirmedChampion: confirmedChampion,
      timestamp: Date.now(),
      turnDuration: updatedRoom.turnDuration,
      turnEndTime: updatedRoom.turnEndTime,
    });
    this.server.to(roomId).emit('updateState', updatedRoom);

    if (room.turnIndex < BANPICK_ORDER.length) {
      this.startTurnTimer(roomId);
    }
  }

  @SubscribeMessage('confirm_result')
  async handleConfirmResult(
    @MessageBody() data: ConfirmResultDto & { roomId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomId, winner } = data;
    let room = await this.appService.getRoom(roomId);
    if (!room) return;

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

    const hostInfo = this.appService.findPlayerInRoom(room, room.hostId);

    const finishedGame = {
      bluePicks: room.bluePicks,
      redPicks: room.redPicks,
      blueBans: room.blueBans,
      redBans: room.redBans,
      winner: winner,
    };
    room.gameSeries.games.push(finishedGame);

    room = this.appService.resetDraftState(room);

    const updatedRoom = await this.appService.updateRoom(roomId, room);

    this.server.to(roomId).emit('game_result_confirmed', {
      gameCode: roomId,
      confirmedBy: hostInfo ? hostInfo.player.name : 'Host',
      winner: winner,
      blueScore: room.gameSeries.blueWins,
      redScore: room.gameSeries.redWins,
      nextSetNumber: room.gameSeries.currentGame,
      timestamp: Date.now(),
    });
    this.server.to(roomId).emit('updateState', updatedRoom);
  }

  @SubscribeMessage('disconnecting')
  async handleDisconnecting(@ConnectedSocket() client: Socket): Promise<void> {
    for (const roomId of client.rooms) {
      if (roomId === client.id) continue;

      let room = await this.appService.getRoom(roomId);
      if (room) {
        if (!room.playerMap) {
          room.playerMap = {};
        }
        const playerId = room.playerMap[client.id];
        if (!playerId) continue;
        
        this.appService.clearTimer(roomId);

        const wasInBlue = room.blueTeamPlayers.some(p => p.id === playerId);
        const wasInRed = room.redTeamPlayers.some(p => p.id === playerId);
        if (wasInBlue) room.blueTeamPlayers = room.blueTeamPlayers.filter(p => p.id !== playerId);
        if (wasInRed) room.redTeamPlayers = room.redTeamPlayers.filter(p => p.id !== playerId);
        delete room.playerMap[client.id];

        if (wasInBlue || wasInRed) {
          room = this.appService.resetReadyState(room);
          const updatedRoom = await this.appService.updateRoom(roomId, room);
          this.server.to(roomId).emit('updateState', updatedRoom);
        }
      }
    }
  }
}
