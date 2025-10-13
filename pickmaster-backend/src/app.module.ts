import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsGateway } from './events.gateway';
import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
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
  exports: [firestoreProvider],
})
export class AppModule {}