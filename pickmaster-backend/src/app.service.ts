import { Injectable, Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class AppService {
  constructor(
    @Inject('FIRESTORE') private readonly db: Firestore,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async createRoom(initialSettings: any): Promise<string> {
    const newRoomData = {
        ...initialSettings,
        createdAt: new Date(), // Using JS Date for simplicity, can use serverTimestamp
    };
    const docRef = await this.db.collection('rooms').add(newRoomData);
    return docRef.id;
  }

  async getRoom(roomId: string): Promise<any> {
    const docRef = this.db.collection('rooms').doc(roomId);
    const doc = await docRef.get();
    if (!doc.exists) {
      // In a real app, you might throw a NotFoundException
      return null;
    }
    return doc.data();
  }
}
