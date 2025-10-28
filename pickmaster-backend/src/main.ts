import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ .env에서 ALLOWED_ORIGINS 읽고 각 주소의 앞뒤 공백 제거
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) // <-- .trim() 추가
    : ['http://localhost:5173'];

  app.enableCors({
    origin: (origin, callback) => {
      // 개발 중 로컬 환경 등 origin이 없는 경우도 허용 (Postman 등)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`CORS Error: Origin ${origin} not allowed.`); // 어떤 Origin이 차단되었는지 로그 추가
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // ✅ Render 자동 포트 사용
  const port = process.env.PORT || 8080;
  await app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`✅ Allowed Origins: ${allowedOrigins.join(', ')}`); // 허용된 Origin 로그 추가
  });
}

bootstrap();