import { Injectable } from '@nestjs/common';

export interface RoomState {
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
  constructor() {}

  getHello(): string {
    return 'Hello World!';
  }
}