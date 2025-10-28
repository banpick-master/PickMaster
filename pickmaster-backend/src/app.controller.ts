import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('api/rooms')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createRoom(@Body() createRoomDto: CreateRoomDto) {
    const room = await this.appService.createRoom(createRoomDto);
    return { roomId: room.roomId };
  }

  @Get(':roomId')
  async getRoom(@Param('roomId') roomId: string) {
    const room = await this.appService.getRoom(roomId);
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }
    return room;
  }
}
