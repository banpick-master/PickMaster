import { IsEnum, IsString, IsOptional } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  roomId: string;

  @IsString()
  @IsOptional()
  playerId?: string;

  @IsEnum(['blue', 'red', 'spectator'])
  @IsOptional()
  team?: 'blue' | 'red' | 'spectator';

  @IsString()
  @IsOptional()
  name?: string;
}
