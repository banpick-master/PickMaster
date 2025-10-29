import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomEntity } from './room/room.entity';

export type RoomState = RoomEntity;

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
  ) {}

  async createRoom(createRoomDto: CreateRoomDto): Promise<RoomState> {
    const roomId = uuidv4();
    const newRoom: Partial<RoomEntity> = {
      roomId,
      gameName: createRoomDto.gameName,
      blueTeamName: createRoomDto.blueName,
      redTeamName: createRoomDto.redName,
      gameMode: createRoomDto.setCount,
      timerMode: createRoomDto.timerMode,
      banMode: 'tournament',
      blueTeamPlayers: [],
      redTeamPlayers: [],
      spectatorIds: [],
      readyCheckStatus: 'idle',
      turnIndex: 0,
      blueBans: [],
      redBans: [],
      bluePicks: [],
      redPicks: [],
      swapRequest: null,
      gameSeries: { games: [], currentGame: 1, blueWins: 0, redWins: 0 },
      fearlessPicks: [],
      playerMap: {},
      hostId: null,
      draftStarted: false,
      currentSelection: null,
    };
    const room = this.roomRepository.create(newRoom);
    return this.roomRepository.save(room);
  }

  async getRoom(roomId: string): Promise<RoomState | undefined> {
    const room = await this.roomRepository.findOne({ where: { roomId } });
    return room ?? undefined;
  }

  async updateRoom(roomId: string, roomState: Partial<RoomState>): Promise<RoomState> {
    await this.roomRepository.update({ roomId }, roomState);
    const room = await this.getRoom(roomId);
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found.`);
    }
    return room;
  }

  async findPlayerInRoom(roomId: string, playerId: string) {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    const bluePlayer = room.blueTeamPlayers.find(p => p.id === playerId);
    if (bluePlayer) return { player: bluePlayer, team: 'blue' };
    const redPlayer = room.redTeamPlayers.find(p => p.id === playerId);
    if (redPlayer) return { player: redPlayer, team: 'red' };
    return null;
  }

  async resetReadyState(roomId: string) {
    const room = await this.getRoom(roomId);
    if (!room) return;
    room.readyCheckStatus = 'idle';
    room.blueTeamPlayers.forEach((p) => (p.isReady = false));
    room.redTeamPlayers.forEach((p) => (p.isReady = false));
    await this.updateRoom(roomId, room);
  }

  async resetDraftState(roomId: string) {
    const room = await this.getRoom(roomId);
    if (!room) return;
    room.turnIndex = 0;
    room.blueBans = [];
    room.redBans = [];
    room.bluePicks = [];
    room.redPicks = [];
    room.currentSelection = null;
    room.draftStarted = false;
    await this.updateRoom(roomId, room);
  }
}