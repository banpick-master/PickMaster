// pickmaster-backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


// ✅ .env 파일 로드

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ .env에서 CORS 허용 주소 읽기
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // ✅ Render에서 PORT 환경변수 자동 제공
  const port = process.env.PORT || 8080; // Render가 지정한 PORT 사용
  await app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

bootstrap();
