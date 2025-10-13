import { Injectable, Inject } from '@nestjs/common';
import { Firestore, FieldValue } from 'firebase-admin/firestore';

export interface RoomState {
  createdAt: any; // FieldValue
  gameName: string;
  blueTeamName: string;
  redTeamName: string;
  gameMode: string;
  timerMode: string;
  banMode: string;
  blueTeamPlayers: any[];
  redTeamPlayers: any[];
  spectatorIds: string[];
  readyCheckStatus: 'idle' | 'in-progress' | 'done';
  turnIndex: number;
  blueBans: any[];
  redBans: any[];
  bluePicks: any[];
  redPicks: any[];
  swapRequest: any | null;
  gameSeries: { games: any[]; currentGame: number; blueWins: number; redWins: number };
  fearlessPicks: any[];
}

@Injectable()
export class AppService {
  constructor(@Inject('FIRESTORE') private readonly db: Firestore) {}

  getHello(): string {
    return 'Hello World!';
  }

  async createRoom(initialSettings: any): Promise<string> {
    const newRoomData: Omit<RoomState, 'createdAt'> = {
      gameName: initialSettings.gameName || "새로운 경기",
      blueTeamName: initialSettings.blueName || "블루 팀",
      redTeamName: initialSettings.redName || "레드 팀",
      gameMode: initialSettings.setCount || "single",
      timerMode: initialSettings.timerMode || "default",
      banMode: initialSettings.banMode || "tournament",
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
    };
  
    const docRef = await this.db.collection('rooms').add({
      ...newRoomData,
      createdAt: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }

  async getRoom(roomId: string): Promise<RoomState | null> {
    const docRef = this.db.collection('rooms').doc(roomId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as RoomState;
  }

  async updateRoom(roomId: string, state: Partial<RoomState>): Promise<void> {
    const docRef = this.db.collection('rooms').doc(roomId);
    await docRef.update(state);
  }
}