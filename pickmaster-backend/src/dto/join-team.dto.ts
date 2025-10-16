import { IsEnum, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PlayerDto {
  @IsString()
  id: string;

  @IsString()
  name: string;
}

export class JoinTeamDto {
  @IsString()
  roomId: string;

  @IsEnum(['blue', 'red'])
  team: 'blue' | 'red';

  @ValidateNested()
  @Type(() => PlayerDto)
  player: PlayerDto;
}
