// pickmaster-backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. CORS 설정 (Vercel 주소 허용)
  // ❗️ Vercel 배포 주소를 여기에 꼭 추가하세요!
  const allowedOrigins = [
    'http://localhost:5173', // 로컬 테스트용
    'https://pick-master.vercel.app', // 👈 이 부분을 Vercel 주소로 변경
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
    credentials: true,
  });

  // 2. 포트 설정 (Render 환경에 맞게 변경)
  // Render에서 제공하는 process.env.PORT를 사용, 없으면 3000번
  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
bootstrap();