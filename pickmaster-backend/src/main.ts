import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = [
    'http://localhost:5173', // 로컬 테스트용 (Vite 기본 포트)
    'https://YOUR_VERCEL_FRONTEND_URL.vercel.app', // Vercel 배포 주소
  ];
  app.enableCors({
    origin: (origin, callback) => {
      // origin이 없거나(postman 등) 허용된 목록에 있으면 허용
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // 쿠키나 인증 헤더 등 전송 허용
  });

  await app.listen(3000);
}

bootstrap();