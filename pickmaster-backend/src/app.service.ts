import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { v4 as uuidv4 } from 'uuid';

export interface RoomState {
  roomId: string;
  createdAt: Date;
  gameName: string;
  blueTeamName: string;
  redTeamName: string;
  gameMode: string;
  timerMode: string;
  banMode: string;
  blueTeamPlayers: any[];
  redTeamPlayers: any[];
  spectatorIds: string[];
  readyCheckStatus: 'idle' | 'in-progress' | 'done' | 'all-ready';
  turnIndex: number;
  blueBans: any[];
  redBans: any[];
  bluePicks: any[];
  redPicks: any[];
  swapRequest: any | null;
  gameSeries: { games: any[]; currentGame: number; blueWins: number; redWins: number };
  fearlessPicks: any[];
  playerMap: Record<string, string>; // socketId to playerId mapping
  hostId: string | null;
  draftStarted: boolean;
  currentSelection: any; // Temporary selection during ban/pick
}

@Injectable()
export class AppService {
  private readonly rooms: Map<string, RoomState> = new Map();

  constructor() {}

  createRoom(createRoomDto: CreateRoomDto): RoomState {
    const roomId = uuidv4();
    const newRoom: RoomState = {
      roomId,
      createdAt: new Date(),
      gameName: createRoomDto.gameName,
      blueTeamName: createRoomDto.blueName,
      redTeamName: createRoomDto.redName,
      gameMode: createRoomDto.setCount,
      timerMode: createRoomDto.timerMode,
      banMode: 'tournament', // Default value, can be changed later
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
    this.rooms.set(roomId, newRoom);
    return newRoom;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  updateRoom(roomId: string, roomState: RoomState): void {
    this.rooms.set(roomId, roomState);
  }

  findPlayerInRoom(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const bluePlayer = room.blueTeamPlayers.find(p => p.id === playerId);
    if (bluePlayer) return { player: bluePlayer, team: 'blue' };
    const redPlayer = room.redTeamPlayers.find(p => p.id === playerId);
    if (redPlayer) return { player: redPlayer, team: 'red' };
    return null;
  }

  resetReadyState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.readyCheckStatus = 'idle';
    room.blueTeamPlayers.forEach((p) => (p.isReady = false));
    room.redTeamPlayers.forEach((p) => (p.isReady = false));
    this.updateRoom(roomId, room);
  }

  resetDraftState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.turnIndex = 0;
    room.blueBans = [];
    room.redBans = [];
    room.bluePicks = [];
    room.redPicks = [];
    room.currentSelection = null;
    room.draftStarted = false;
    this.updateRoom(roomId, room);
  }
}