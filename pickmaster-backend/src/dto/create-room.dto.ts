import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  gameName: string;

  @IsString()
  @IsNotEmpty()
  blueName: string;

  @IsString()
  @IsNotEmpty()
  redName: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['single', 'BO3', 'BO5'])
  setCount: 'single' | 'BO3' | 'BO5';

  @IsString()
  @IsNotEmpty()
  @IsIn(['default', 'infinite'])
  timerMode: 'default' | 'infinite';
}