import { useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import { useRoomStore } from './store/roomStore';
import  LobbyPage  from "./pages/LobbyPage";  // 방 목록 페이지  
import GameBanPickPage from "./pages/GameBanPickPage";
import SpectatorPage from "./pages/SpectatorPage";
import ModeSelectPage from "./pages/ModeSelectPage";
import SeriesResultPage from "./pages/SeriesResultPage";
import RoomPage from "./pages/RoomPage"; // 추가

const App = () => {
  const fetchChampions = useRoomStore((state) => state.fetchChampions);

  useEffect(() => {
    fetchChampions();
  }, [fetchChampions]);

  return (
    <Routes>
      {/* 초기 페이지: 방 목록 */}
      <Route path="/" element={<LobbyPage />} />
      
      {/* 모드 선택 페이지 */}
      <Route path="/mode-select" element={<ModeSelectPage />} />

      {/* 대기방 페이지 */}
      <Route path="/room/:roomId" element={<RoomPage />} />
      
      {/* 밴픽 페이지 */}
      <Route path="/game/:roomId" element={<GameBanPickPage />} />
      
      {/* 관전자 페이지 */}
      <Route path="/spectate/:roomId" element={<SpectatorPage />} />

      {/* 결과 페이지 */}
      <Route path="/series-result" element={<SeriesResultPage />} />
    </Routes>
  );
};

export default App;
