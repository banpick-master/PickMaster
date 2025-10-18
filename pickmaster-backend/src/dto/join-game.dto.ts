import { IsEnum, IsString, IsOptional } from 'class-validator';

export class JoinGameDto {
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
