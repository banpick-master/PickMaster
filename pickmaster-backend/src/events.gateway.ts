import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventsGateway');

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    // Optionally, notify others in the room
    client.to(room).emit('userJoined', `User ${client.id} joined the room`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    // Optionally, notify others in the room
    client.to(room).emit('userLeft', `User ${client.id} left the room`);
  }

  @SubscribeMessage('messageToRoom')
  handleMessageToRoom(client: Socket, payload: { room: string; message: any }) {
    const room = this.server.sockets.adapter.rooms.get(payload.room);
    const numClients = room ? room.size : 0;
    this.logger.log(`Room: ${payload.room} has ${numClients} client(s)`);

    // Broadcast the received state to all clients in the room under the 'updateState' event
    this.server.to(payload.room).emit('updateState', payload.message);
    this.logger.log(`Broadcasting state update to room ${payload.room}`);
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // You might want to handle room cleanup here
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }
}
