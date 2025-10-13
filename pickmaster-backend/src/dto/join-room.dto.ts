// src/dto/join-room.dto.ts
import { IsEnum, IsString } from 'class-validator';

export class JoinRoomDto {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsString()
  roomId: string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsString()
  playerId: string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsEnum(['blue', 'red', 'spectator'])
  team: 'blue' | 'red' | 'spectator';
}
