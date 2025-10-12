import { useParams } from "react-router-dom";
import TeamSlot from "../components/TeamSlot";
import SeriesScoreboard from "../components/SeriesScoreboard";
import { Container, Box, Typography } from "@mui/material";
import { styled } from '@mui/material/styles';

// 임시 데이터 (실제로는 store나 props에서 받아야 함)
const tempPicks = Array(5).fill(null);
const tempBans = Array(5).fill(null);

const SpectatorContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
}));

const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const TeamSlotsWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  width: '100%',
  maxWidth: '1400px',
  gap: theme.spacing(4),
}));

export default function SpectatorPage() {
  const { roomId } = useParams();
  // `useRoomStore`에서 실제 밴픽 데이터를 가져와야 합니다.
  // 현재는 임시 데이터를 사용하고 있습니다.
  // const { bluePicks, redPicks, blueBans, redBans } = useRoomStore(state => state.banpickData); // 예시

  return (
    <SpectatorContainer maxWidth="xl">
      <Title variant="h2">
        관전 모드 - 방 ID: {roomId}
      </Title>
      
      <SeriesScoreboard />

      <TeamSlotsWrapper>
        <Box sx={{ flex: 1 }}>
          <TeamSlot team="blue" picks={tempPicks} bans={tempBans} />
        </Box>
        <Box sx={{ flex: 1 }}>
          {/* 
            실제 데이터를 props로 전달해야 합니다. 
            예: <TeamSlot team="red" picks={redPicks} bans={redBans} />
          */}
          <TeamSlot team="red" picks={tempPicks} bans={tempBans} />
        </Box>
      </TeamSlotsWrapper>
    </SpectatorContainer>
  );
}