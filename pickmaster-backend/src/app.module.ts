import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsGateway } from './events.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config'; // ConfigService import
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomModule } from './room/room.module'; // RoomModule import
import { RoomEntity } from './room/room.entity'; // RoomEntity import

@Module({
  imports: [
    // Load environment variables (.env file or system variables)
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available globally
      envFilePath: '.env', // Specify .env file path (optional for local dev)
    }),
    // Configure TypeORM asynchronously to use ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Make ConfigModule available within this factory
      useFactory: (configService: ConfigService) => {
        // Get the database connection URL from environment variables
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is not set.');
        }
        console.log('Using DATABASE_URL:', databaseUrl ? '****** (set)' : 'Not Set');

        return {
          type: 'postgres', // Database type
          url: databaseUrl, // Use the connection URL from env var
          entities: [RoomEntity], // Specify entities (tables) TypeORM should manage
          synchronize: true, // Auto-update DB schema based on entities (dev only! Use migrations in prod)
          ssl: databaseUrl.includes('render.com') // Enable SSL for Render databases
               ? { rejectUnauthorized: false } // Required for Render's self-signed certs
               : false,
          logging: configService.get<string>('NODE_ENV') !== 'production', // Log SQL queries only in dev
        };
      },
      inject: [ConfigService], // Inject ConfigService into the factory
    }),
    // Import RoomModule to make RoomRepository available
    RoomModule,
  ],
  controllers: [AppController], // Handles HTTP requests
  providers: [AppService, EventsGateway], // Contains business logic and WebSocket gateway
  exports: [],
})
export class AppModule {}
