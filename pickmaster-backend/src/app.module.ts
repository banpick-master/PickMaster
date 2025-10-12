import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsGateway } from './events.gateway';
import * as admin from 'firebase-admin';
import { ServiceAccount } from "firebase-admin";

const firestoreProvider = {
  provide: 'FIRESTORE',
  useFactory: () => {
    // The service account key is expected to be in a JSON file
    // in the root of the 'pickmaster-backend' directory.
    // The user will be instructed on how to obtain this file.
    const serviceAccount: ServiceAccount = require('../serviceAccountKey.json');

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
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
