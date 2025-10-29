import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomEntity } from './room.entity';

// This module focuses specifically on the Room entity and its repository
@Module({
  imports: [
    TypeOrmModule.forFeature([RoomEntity]), // Registers RoomEntity with TypeORM, making its Repository available for injection
  ],
  exports: [
    TypeOrmModule, // Exports TypeOrmModule so other modules (like AppModule -> AppService) can inject the RoomRepository
  ],
})
export class RoomModule {}