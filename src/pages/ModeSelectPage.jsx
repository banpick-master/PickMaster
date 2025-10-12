import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useRoomStore } from "../store/roomStore";
import { createRoomAPI } from "../lib/api"; // createRoomAPI 임포트
import { Container, Box, Typography, TextField, Button, Paper, ToggleButtonGroup, ToggleButton, Grid, Stack } from "@mui/material";
import { styled } from '@mui/material/styles';

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const SettingsPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
}));

const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const FullWidthToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  width: '100%',
}));


export default function ModeSelectPage() {
  const navigate = useNavigate();
  // setGameInfo만 스토어에서 가져옵니다.
  const { setGameInfo } = useRoomStore();

  const [gameName, setGameName] = useState("새로운 경기");
  const [blueName, setBlueName] = useState("블루 팀");
  const [redName, setRedName] = useState("레드 팀");
  const [setCount, setSetCount] = useState("single");
  const [timerMode, setTimerMode] = useState("default");
  const [banMode, setBanMode] = useState("tournament"); // 밴 모드 상태 추가
  const [playMode, setPlayMode] = useState("single"); // 'single' vs 'multi'

  const handleStart = async () => {
    if (!gameName.trim() || !blueName.trim() || !redName.trim()) {
      alert("경기 이름과 팀 이름을 모두 입력해주세요!");
      return;
    }
    
    if (playMode === 'single') {
      // 혼자하기: 스토어 상태를 업데이트하고, 로컬 게임 페이지로 이동
      setGameInfo({
        gameName,
        blueName,
        redName,
        setCount,
        timerMode,
        banMode, // 선택된 밴 모드 전달
      });
      navigate('/game/local');
    } else {
      // 함께하기: 백엔드 API를 통해 새로운 방을 만들고 대기방으로 이동
      try {
        const initialSettings = {
          gameName,
          blueTeamName: blueName,
          redTeamName: redName,
          gameMode: setCount,
          timerMode,
          banMode,
        };
        const data = await createRoomAPI(initialSettings);
        navigate(`/room/${data.roomId}`);
      } catch (error) {
        console.error("방 생성에 실패했습니다:", error);
        alert("방 생성에 실패했습니다. 서버 상태를 확인하거나 잠시 후 다시 시도해주세요.");
      }
    }
  };

  return (
    <Root>
      <Container maxWidth="md">
        <SettingsPaper elevation={3}>
          <Title variant="h3" align="center">
            게임 설정
          </Title>

          <Stack spacing={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <SectionTitle variant="overline">게임 방식</SectionTitle>
                <FullWidthToggleButtonGroup color="primary" value={playMode} exclusive onChange={(e, val) => val && setPlayMode(val)}>
                  <ToggleButton value="single">혼자하기</ToggleButton>
                  <ToggleButton value="multi">함께하기</ToggleButton>
                </FullWidthToggleButtonGroup>
              </Grid>
            </Grid>
            
            <TextField
              label="경기 이름"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              required
              fullWidth
            />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="블루팀 이름"
                  value={blueName}
                  onChange={(e) => setBlueName(e.target.value)}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="레드팀 이름"
                  value={redName}
                  onChange={(e) => setRedName(e.target.value)}
                  required
                  fullWidth
                />
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

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <SectionTitle variant="overline">밴픽 모드</SectionTitle>
                <FullWidthToggleButtonGroup color="primary" value={banMode} exclusive onChange={(e, val) => val && setBanMode(val)}>
                  <ToggleButton value="tournament">토너먼트 드래프트</ToggleButton>
                  <ToggleButton value="fearless">피어리스 드래프트</ToggleButton>
                </FullWidthToggleButtonGroup>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handleStart}
              sx={{ mt: 2, py: 1.5 }}
            >
              다음
            </Button>
          </Stack>
        </SettingsPaper>
      </Container>
    </Root>
  );
}