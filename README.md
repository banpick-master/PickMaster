Markdown# 🛡️ Pick Master - LoL 실시간 밴픽 시뮬레이터

![Project Logo](https://i.imgur.com/your-logo-image-url.png) 
> **"실제 LCK 대회와 동일한 긴장감, 친구들과 함께하는 실시간 전략 밴픽 플랫폼"**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=vercel)](https://pick-master.vercel.app/)
[![Tech Stack](https://img.shields.io/badge/Stack-NestJS%20%7C%20React%20%7C%20PostgreSQL-blue?style=for-the-badge)](https://github.com/cookiboii/pickmaster-banpick-simulator)

`Pick Master`는 리그 오브 레전드(LoL) e스포츠의 밴픽 과정을 웹상에서 완벽하게 구현한 **실시간 멀티플레이 시뮬레이션 서비스**입니다.
최신 대회 룰인 **피어리스 드래프트(Fearless Draft)** 모드를 지원하며, WebSocket을 활용해 **0.1초의 오차 없는 실시간 동기화**를 제공합니다.

---

## 📅 프로젝트 개요

* **개발 기간**: 2025.9 ~ 202X.10 (4주)
* **개발 인원**: 1인 개발 (Full Stack)
* **주요 목표**: 
    * 복잡한 게임 상태(State)를 서버 기준으로 완벽하게 동기화하는 **WebSocket 아키텍처 구현**
    * 배열 및 객체 데이터가 많은 게임 로그를 효율적으로 저장하기 위한 **RDBMS의 JSONB 활용**

---

## ✨ 주요 기능 (Key Features)

### 1. 실시간 멀티플레이 밴픽 (Real-time Draft)
* 방장(Host)이 방을 생성하고 초대 코드를 통해 상대방이 접속합니다.
* **Socket.IO**를 통해 픽/밴, 타이머, 진영 변경 등의 액션이 모든 참가자 화면에 즉시 반영됩니다.
* 관전자(Spectator) 모드를 지원하여 제3자가 밴픽 과정을 지켜볼 수 있습니다.

### 2. 다양한 게임 모드 및 룰 지원
* **매치 설정**: 단판, 3판 2선승(Bo3), 5판 3선승(Bo5) 지원.
* **피어리스 드래프트(Fearless Draft)**: 이전 세트에서 사용한 챔피언을 다음 세트에서 금지하는 최신 e스포츠 룰 로직 구현.
* **타이머 설정**: 대회 룰과 동일한 시간 제한 또는 무제한 모드 선택 가능.

### 3. 직관적인 UI/UX
* Riot Dragon API를 연동하여 항상 최신 챔피언 데이터를 제공합니다.
* `MUI`와 `Emotion`을 활용한 반응형 다크 모드 디자인.
* 밴픽 결과를 이미지로 저장하여 공유하는 기능 (`html2canvas`).

---

## 🏗️ 시스템 아키텍처 (Architecture)

이 프로젝트는 상태 무결성을 보장하기 위해 **"Server as a Single Source of Truth"** 원칙을 따르는 이벤트 주도 아키텍처로 설계되었습니다.

```mermaid
graph TD
    subgraph Client [Frontend (React + Zustand)]
        UI[User Interface]
        Store[Room Store (Zustand)]
        SocketClient[Socket.IO Client]
        
        UI -->|Action (Select/Ban)| Store
        Store -->|Emit Event| SocketClient
        SocketClient -->|Update State| Store
    end

    subgraph Backend [Backend (NestJS)]
        Gateway[Events Gateway (WebSocket)]
        Service[App Service (Logic)]
        Repo[TypeORM Repository]
        
        SocketClient <-->|Real-time Events| Gateway
        Gateway -->|Validate & Process| Service
        Service -->|Save State| Repo
    end

    subgraph Data [Database (PostgreSQL)]
        DB[(PostgreSQL)]
        Repo <-->|Read/Write JSONB| DB
    end

    %% Flow
    linkStyle default stroke-width:2px,fill:none,stroke:black
🛠️ 기술 스택 (Tech Stack)Frontend기술선정 이유React 19최신 훅과 컴포넌트 기반 아키텍처를 통한 효율적인 UI 구성Vite빠른 빌드 속도와 HMR(Hot Module Replacement)로 개발 생산성 향상ZustandRedux 대비 보일러플레이트가 적고, 소켓 이벤트 핸들러 내에서 상태 접근이 용이함Socket.IO Client웹소켓 연결 관리 및 재접속 처리, 이벤트 기반 통신 구현MUI (Material-UI)완성도 높은 디자인 시스템을 활용하여 직관적인 인터페이스 구축Backend기술선정 이유NestJS모듈 구조를 통해 확장성 있고 유지보수가 용이한 백엔드 아키텍처 구축Socket.IONamespace/Room 기능을 활용한 효율적인 게임 세션 관리TypeORM객체 지향적인 데이터베이스 조작 및 엔티티 관리PostgreSQL강력한 트랜잭션 지원 및 JSONB 타입을 통한 유연한 게임 데이터 저장InfrastructureDeploy: Vercel (Frontend), Render (Backend, DB)Version Control: Git, GitHub🚀 기술적 챌린지 및 해결 (Troubleshooting)1. 복잡한 게임 상태의 효율적 저장 (PostgreSQL JSONB)문제 상황: 밴픽 데이터(bluePicks, redBans 등)와 게임 시리즈 정보(gameSeries)는 배열과 객체가 중첩된 형태라, 전통적인 RDBMS의 정규화 방식(1:N 테이블 분리)으로는 스키마가 지나치게 복잡해지고 조회 시 다수의 JOIN이 발생하는 문제가 있었습니다.해결 방안: PostgreSQL의 JSONB 컬럼을 도입했습니다. RoomEntity 내에 bluePicks, gameSeries 등을 JSON 형태로 저장하여, 스키마 유연성을 확보하면서도 단일 쿼리로 게임의 전체 상태를 빠르게 조회할 수 있도록 최적화했습니다.TypeScript// src/room/room.entity.ts
@Column('jsonb', { default: [] })
bluePicks: any[]; 

@Column('jsonb', { default: { games: [], ... } })
gameSeries: { games: any[]; ... };
2. 실시간 동기화와 Race Condition 방지문제 상황: 두 명의 플레이어가 동시에 같은 챔피언을 픽하려고 할 때, 클라이언트에서만 검증하면 데이터 불일치가 발생할 수 있었습니다.해결 방안: "서버 권한 위임(Authoritative Server)" 모델을 적용했습니다.클라이언트는 select_champion 이벤트를 서버로 전송만 합니다.서버(AppService)에서 현재 턴(turnIndex)과 픽 유효성을 검증합니다.검증이 완료되면 서버가 updateState 이벤트를 모든 클라이언트에 브로드캐스팅하여 상태를 강제로 동기화합니다.3. 피어리스 드래프트(Fearless Draft) 로직 구현구현: 단순 밴픽을 넘어, gameSeries 내의 이전 경기 기록을 누적하여 fearlessPicks 배열을 관리했습니다. 픽 요청이 들어올 때 이 배열을 순회하여 중복 픽을 서버 단에서 원천 차단함으로써 복잡한 최신 대회 룰을 시스템적으로 보장했습니다.🏃‍♂️ 실행 방법 (Getting Started)FrontendBashcd pickmaster-banpick-simulator
npm install
npm run dev
BackendBashcd pickmaster-backend
npm install

# .env 파일 설정 필요 (DB 연결 정보 등)
# DATABASE_URL=postgresql://user:pass@host/db

npm run start:dev
📂 폴더 구조 (Directory Structure)📦 pickmaster
├── 📂 src (Frontend)
│   ├── 📂 components  # TeamSlot, ChampionSelect 등 UI 컴포넌트
│   ├── 📂 pages       # GameBanPickPage, RoomPage 등 페이지
│   ├── 📂 store       # Zustand 상태 관리 (roomStore.js)
│   └── 📂 lib         # Socket.IO 연결 및 API 유틸 (socket.js)
│
└── 📂 pickmaster-backend (Backend)
    ├── 📂 src
    │   ├── 📂 room        # RoomEntity, RoomModule (DB)
    │   ├── 📂 dto         # 데이터 전송 객체 (Validation)
    │   ├── app.service.ts # 비즈니스 로직 (밴픽 룰 처리)
    │   └── events.gateway.ts # 소켓 이벤트 핸들러
Developed by cookiboii