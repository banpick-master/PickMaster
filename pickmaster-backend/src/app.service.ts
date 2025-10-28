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

  /**
   * [수정됨] 컨트롤러가 async/await를 사용하므로 Promise를 반환하도록 변경
   */
  async createRoom(createRoomDto: CreateRoomDto): Promise<RoomState> {
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
    return newRoom; // async 함수는 자동으로 Promise를 반환합니다.
  }

  /**
   * [수정됨] 컨트롤러가 async/await를 사용하므로 Promise를 반환하도록 변경
   */
  async getRoom(roomId: string): Promise<RoomState | undefined> {
    return this.rooms.get(roomId);
  }

  /**
   * [수정됨] 일관성을 위해 async로 변경 (웹소켓 게이트웨이용)
   */
  async updateRoom(roomId: string, roomState: RoomState): Promise<void> {
    this.rooms.set(roomId, roomState);
  }

  // --- 나머지 헬퍼 함수들은 동기 방식이어도 괜찮습니다 ---

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
    this.updateRoom(roomId, room); // updateRoom 호출
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
    this.updateRoom(roomId, room); // updateRoom 호출
  }
}