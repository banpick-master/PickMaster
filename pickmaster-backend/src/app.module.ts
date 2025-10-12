import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsGateway } from './events.gateway';
import * as admin from 'firebase-admin'; // 큰따옴표를 작은따옴표로 변경
import { Firestore } from 'firebase-admin/firestore'; // 큰따옴표를 작은따옴표로 변경
import * as serviceAccount from '../serviceAccountKey.json';

const firestoreProvider = {
  provide: 'FIRESTORE',
  useFactory: () => {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
    }
    return admin.firestore();
  },
};

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, EventsGateway, firestoreProvider],
  exports: [firestoreProvider], // Firestore 프로바이더를 다른 모듈에서 사용할 수 있도록 export
})
export class AppModule {}