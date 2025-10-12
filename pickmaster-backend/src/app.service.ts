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
      return null;
    }
    return doc.data();
  }

    // 👇 [추가] 방 상태를 업데이트하는 함수
    async updateRoom(roomId: string, state: any): Promise<void> {
      const docRef = this.db.collection('rooms').doc(roomId);
      // merge: true 옵션으로 기존 데이터를 유지하면서 새로운 데이터만 덮어씁니다.
      await docRef.set(state, { merge: true });
    }
}
