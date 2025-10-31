# Pick Master  

![Project Logo](https://i.imgur.com/your-logo-image-url.png) **실제 LoL 대회와 같은 밴픽(Ban-Pick) 경험을 친구들과 무료로 즐겨보세요!**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://pick-master.vercel.app/)

`Pick Master`는 리그 오브 레전드 e스포츠 팬과 플레이어들을 위한 실시간 밴픽 시뮬레이션 웹 애플리케이션입니다. 실제 대회와 동일한 룰을 적용하여 친구들과 함께 전략적인 밴픽을 연습하거나, 가상의 드림팀 매치를 시뮬레이션해볼 수 있습니다.

## ✨ 주요 기능

-   **실시간 밴픽**: 친구를 초대하여 실시간으로 밴픽을 진행할 수 있습니다. (혼자하기 모드 및 친구와 함께하기 모드 지원)
-   **다양한 게임 모드**: 단판, 3판 2선승(Bo3), 5판 3선승(Bo5) 등 다양한 시리즈 모드를 지원합니다.
-   **대회 룰 적용**: 실제 대회와 동일한 밴픽 순서와 시간을 적용하여 긴장감 넘치는 경험을 제공합니다.
-   **챔피언 데이터 연동**: Riot Dragon API를 통해 항상 최신 챔피언 정보를 제공합니다.
-   **결과 공유**: 밴픽 완료 후 결과를 이미지 파일로 저장하고 공유할 수 있습니다.

## 🛠️ 기술 스택

-   **프론트엔드 프레임워크**: `React` (UI 구축)
-   **빌드 도구**: `Vite` (빠른 개발 서버 및 번들링)
-   **라우팅**: `React Router DOM` (페이지 라우팅 관리)
-   **상태 관리**: `Zustand` (간결한 전역 상태 관리)
-   **UI 라이브러리**: `Material-UI (MUI)` (Google Material Design 기반 UI 컴포넌트)
    -   `@emotion/react`, `@emotion/styled`: MUI의 스타일링 엔진
    -   `@mui/icons-material`: Material Design 아이콘
-   **백엔드 서비스**: `Firebase` (인증, 데이터베이스 등)
    -   `Firebase Firestore`: 실시간 데이터베이스
    -   `Firebase Hosting`: 웹 애플리케이션 배포
-   **실시간 통신**:
    -   `Socket.IO Client`: 웹소켓 기반 실시간 통신
    -   `SockJS Client`, `StompJS`: 웹소켓 폴백 및 STOMP 프로토콜 지원
    -   `Yjs`, `y-webrtc`: 실시간 협업 및 데이터 동기화 (P2P WebRTC)
-   **유틸리티**:
    -   `html2canvas`: HTML 요소를 캡처하여 이미지로 변환 (결과 공유 기능)
-   **개발 도구**:
    -   `ESLint`: 코드 품질 및 스타일 유지
    -   `@vitejs/plugin-react`: Vite에서 React 사용을 위한 플러그인
    -   `@types/react`, `@types/react-dom`: TypeScript 타입 정의 (개발 편의성)

-   **백엔드 프레임워크**: `NestJS` (확장 가능한 서버 애플리케이션 구축)
    -   `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`: NestJS 핵심 모듈
    -   `@nestjs/websockets`, `@nestjs/platform-socket.io`: 웹소켓 통신 지원
-   **백엔드 서비스**: `Firebase Admin` (Firebase 서비스 서버 측 통합)
-   **개발 도구 (백엔드)**:
    -   `TypeScript`: 백엔드 개발 언어
    -   `Jest`: 테스트 프레임워크
    -   `ESLint`, `Prettier`: 코드 품질 및 포맷팅

## 🚀 시작하기

### Prerequisites

-   Node.js (v18.x or higher)
-   npm or yarn

### Installation

1.  **리포지토리 클론:**
    ```bash
    git clone https://github.com/cookiboii/pickmaster-banpick-simulator.git
    cd pickmaster-banpick-simulator
    ```

2.  **프론트엔드 의존성 설치 및 실행:**
    ```bash
    # 현재 디렉토리가 리포지토리 루트인 경우
    npm install
    npm run dev
    ```

3.  **백엔드 의존성 설치 및 실행 (선택 사항):**
    ```bash
    cd pickmaster-backend
    npm install
    npm run start:dev
    ```

    이제 브라우저에서 `http://localhost:5173` (또는 터미널에 표시된 다른 포트)으로 접속하여 프로젝트를 확인할 수 있습니다.

---

*이 프로젝트는 cookiboii에 의해 개발되었습니다.*
*피드백 및 문의는 [개발자 GitHub](https://github.com/cookiboii)를 통해 부탁드립니다.*

