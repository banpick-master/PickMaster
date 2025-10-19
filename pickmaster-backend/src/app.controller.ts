import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController { // Force redeploy
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
          
  @Post('rooms')
  async createRoom(@Body() initialSettings: any): Promise<{ roomId: string }> {
    const roomId = await this.appService.createRoom(initialSettings);
    return { roomId };
  }

  @Get('rooms/:roomId')
  async getRoom(@Param('roomId') roomId: string): Promise<any> {
    return this.appService.getRoom(roomId);
  }
}
