import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useRoomStore } from "../store/roomStore";
import { Container, Box, Typography, TextField, Button, Paper, ToggleButtonGroup, ToggleButton, Grid, Stack } from "@mui/material";
import { styled } from '@mui/material/styles';

const Root = styled('div')(({ theme }) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: theme.palette.background.default }));
const SettingsPaper = styled(Paper)(({ theme }) => ({ padding: theme.spacing(5), borderRadius: theme.shape.borderRadius * 2, backgroundColor: theme.palette.background.paper }));
const Title = styled(Typography)(({ theme }) => ({ marginBottom: theme.spacing(4) }));
const SectionTitle = styled(Typography)(({ theme }) => ({ marginBottom: theme.spacing(1) }));
const FullWidthToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({ width: '100%' }));

export default function ModeSelectPage() {
  const navigate = useNavigate();
  // ▼▼▼ [수정됨] createNewRoom, startGameSeries 함수를 가져옵니다.
  const { createNewRoom, startGameSeries } = useRoomStore();

  const [gameName, setGameName] = useState("새로운 경기");
  const [blueName, setBlueName] = useState("블루 팀");
  const [redName, setRedName] = useState("레드 팀");
  const [setCount, setSetCount] = useState("single");
  const [timerMode, setTimerMode] = useState("default");
  const [playMode, setPlayMode] = useState("single");

  const handleStart = async () => {
    if (!gameName.trim() || !blueName.trim() || !redName.trim()) {
      alert("경기 이름과 팀 이름을 모두 입력해주세요!");
      return;
    }
    
    const gameInfo = { gameName, blueName, redName, setCount, timerMode };

    if (playMode === 'single') {
      // ▼▼▼ [수정됨] '혼자하기' 모드 시작 시 startGameSeries 함수를 호출합니다.
      startGameSeries(gameInfo);
      navigate('/game/local');
    } else {
      try {
        const newRoom = await createNewRoom(gameInfo);
        navigate(`/room/${newRoom.roomId}`);
      } catch (error) {
        alert("방 만들기에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  return (
    <Root>
      <Container maxWidth="md">
        <SettingsPaper elevation={3}>
          <Title variant="h3" align="center">게임 설정</Title>
          <Stack spacing={4}>
            {/* ... (이하 JSX 코드는 수정할 필요 없음) ... */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <SectionTitle variant="overline">게임 방식</SectionTitle>
                <FullWidthToggleButtonGroup color="primary" value={playMode} exclusive onChange={(e, val) => val && setPlayMode(val)}>
                  <ToggleButton value="single">혼자하기</ToggleButton>
                  <ToggleButton value="multi" disabled>함께하기</ToggleButton>
                </FullWidthToggleButtonGroup>
              </Grid>
            </Grid>
            
            <TextField label="경기 이름" value={gameName} onChange={(e) => setGameName(e.target.value)} required fullWidth />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField label="블루팀 이름" value={blueName} onChange={(e) => setBlueName(e.target.value)} required fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="레드팀 이름" value={redName} onChange={(e) => setRedName(e.target.value)} required fullWidth />
              </Grid>
            </Grid>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <SectionTitle variant="overline">세트 수 선택</SectionTitle>
                <FullWidthToggleButtonGroup color="primary" value={setCount} exclusive onChange={(e, val) => val && setSetCount(val)}>
                  <ToggleButton value="single">단판</ToggleButton>
                  <ToggleButton value="BO3">3판 2선</ToggleButton>
                  <ToggleButton value="BO5">5판 3선</ToggleButton>
                </FullWidthToggleButtonGroup>
              </Grid>
              <Grid item xs={12} sm={6}>
                <SectionTitle variant="overline">밴픽 타이머</SectionTitle>
                <FullWidthToggleButtonGroup color="primary" value={timerMode} exclusive onChange={(e, val) => val && setTimerMode(val)}>
                  <ToggleButton value="default">대회 동일</ToggleButton>
                  <ToggleButton value="infinite">무제한</ToggleButton>
                </FullWidthToggleButtonGroup>
              </Grid>
            </Grid>

            <Button variant="contained" color="primary" size="large" fullWidth onClick={handleStart} sx={{ mt: 2, py: 1.5 }}>
              게임 시작
            </Button>
          </Stack>
        </SettingsPaper>
      </Container>
    </Root>
  );
}