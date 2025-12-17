import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsGateway } from './events.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomModule } from './room/room.module';
import { RoomEntity } from './room/room.entity';

@Module({
  imports: [
    // 환경 변수 로드 설정
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '.env',
    }),
    
    // TypeORM 비동기 설정 (배포 환경 최적화)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        // NODE_ENV가 'production'이면 배포 환경으로 간주
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        if (!databaseUrl) {
          throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
        }

        console.log(`[DB 연결] 현재 환경: ${isProduction ? '배포(Production)' : '개발(Development)'}`);

        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [RoomEntity],
          
          /**
           * [중요] 배포 환경(production)에서는 synchronize를 반드시 false로 해야 합니다.
           * true로 할 경우, 서버가 재시작될 때마다 데이터가 초기화되거나 
           * 의도치 않게 테이블 구조가 변경되어 데이터 손실이 발생할 수 있습니다.
           * 배포 환경에서는 'Migration(마이그레이션)'을 사용하는 것이 정석입니다.
           */
          synchronize: !isProduction, 

          /**
           * [SSL 설정]
           * 배포 환경(isProduction)이거나, 로컬 호스트가 아닌 외부 DB URL일 경우 SSL을 켭니다.
           * rejectUnauthorized: false는 대부분의 클라우드 DB(Render, Heroku 등)에서 필수입니다.
           */
          ssl: isProduction || (databaseUrl && !databaseUrl.includes('localhost'))
            ? { rejectUnauthorized: false }
            : false,

          // 배포 환경에서는 쿼리 로그를 꺼서 성능 저하 및 보안 이슈 방지
          logging: !isProduction,
        };
      },
      inject: [ConfigService],
    }),
    
    RoomModule,
  ],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}