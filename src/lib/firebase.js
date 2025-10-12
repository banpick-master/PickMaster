import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Firebase Authentication을 위한 함수들을 import 합니다.
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCD0iV564LrtR61xzBVfr351FT-FXUq95A",
  authDomain: "banpick-master-ab3e7.firebaseapp.com",
  projectId: "banpick-master-ab3e7",
  storageBucket: "banpick-master-ab3e7.firebasestorage.app",
  messagingSenderId: "518947930993",
  appId: "1:518947930993:web:c7b02a5b7a9097bf156cd0",
  measurementId: "G-ZZ09H1BFCX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- 추가된 부분 ---
// Firebase Authentication 인스턴스를 초기화하고 export 합니다.
export const auth = getAuth(app);
// ------------------

// Cloud Firestore 인스턴스를 초기화하고 export 합니다.
export const db = getFirestore(app);


// --- 추가된 부분 ---
/**
 * 앱이 시작될 때 사용자의 인증 상태를 확인하고,
 * 로그인되어 있지 않으면 익명으로 로그인시킵니다.
 */
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 사용자가 이미 로그인되어 있는 경우 (익명 포함)
    console.log("User is signed in with uid:", user.uid);
  } else {
    // 사용자가 로그인되어 있지 않은 경우, 익명으로 로그인 시도
    signInAnonymously(auth)
      .then(() => {
        console.log("Signed in anonymously");
      })
      .catch((error) => {
        console.error("Error signing in anonymously:", error);
      });
  }
});
// ------------------