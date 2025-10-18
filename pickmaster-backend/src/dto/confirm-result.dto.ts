import { IsEnum } from 'class-validator';

export class ConfirmResultDto {
  @IsEnum(['blue', 'red'])
  winner: 'blue' | 'red';
}
