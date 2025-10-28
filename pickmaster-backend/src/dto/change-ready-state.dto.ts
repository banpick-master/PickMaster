import { IsBoolean, IsString } from 'class-validator';

export class ChangeReadyStateDto {
  @IsString()
  roomId: string;

  @IsBoolean()
  isReady: boolean;
}