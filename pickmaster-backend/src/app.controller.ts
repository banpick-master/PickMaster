import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/api/rooms')
  async createRoom(@Body() initialSettings: any): Promise<{ roomId: string }> {
    const roomId = await this.appService.createRoom(initialSettings);
    return { roomId };
  }

  @Get('/api/rooms/:roomId')
  async getRoom(@Param('roomId') roomId: string): Promise<any> {
    return this.appService.getRoom(roomId);
  }
}
