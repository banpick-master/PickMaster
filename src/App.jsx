import { useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import { useRoomStore } from './store/roomStore';
import  LobbyPage  from "./pages/LobbyPage";  // 방 목록 페이지  
import GameBanPickPage from "./pages/GameBanPickPage";
import SpectatorPage from "./pages/SpectatorPage";
import ModeSelectPage from "./pages/ModeSelectPage";
import SeriesResultPage from "./pages/SeriesResultPage";
import RoomPage from "./pages/RoomPage"; // 추가
import SinglePlayerGamePage from "./pages/SinglePlayerGamePage";

import { Box, CircularProgress, Typography } from "@mui/material";

const App = () => {
  const fetchChampions = useRoomStore((state) => state.fetchChampions);
  const isChampionDataLoaded = useRoomStore((state) => state.isChampionDataLoaded);

  useEffect(() => {
    fetchChampions();
  }, [fetchChampions]);

  // if (!isChampionDataLoaded) {
  //   return (
  //     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
  //       <CircularProgress />
  //       <Typography> 챔피언 데이터를 불러오는 중입니다...</Typography>
  //     </Box>
  //   );
  // }

  return (
    <Routes>
      {/* 초기 페이지: 방 목록 */}
      <Route path="/" element={<LobbyPage />} />
      
      {/* 모드 선택 페이지 */}
      <Route path="/mode-select" element={<ModeSelectPage />} />

      {/* 대기방 페이지 */}
      <Route path="/room/:roomId" element={<RoomPage />} />
      
      {/* 밴픽 페이지 */}
      <Route path="/game/single-player" element={<SinglePlayerGamePage />} />
      <Route path="/game/:roomId" element={<GameBanPickPage />} />
      
      {/* 관전자 페이지 */}
      <Route path="/spectate/:roomId" element={<SpectatorPage />} />

      {/* 결과 페이지 */}
      <Route path="/series-result" element={<SeriesResultPage />} />
    </Routes>
  );
};

export default App;