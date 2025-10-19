import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import * as functions from 'firebase-functions/v1';
import { AppModule } from './app.module';

const expressServer = express();

const createFunction = async (expressInstance): Promise<void> => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://banpick-master-ab3e7.web.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.init();
};

createFunction(expressServer)
  .then(() => console.log('Nest Ready'))
  .catch(err => console.error('Nest broken', err));

export const api = functions.region('asia-northeast3').https.onRequest(expressServer);
