import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import html2canvas from 'html2canvas';
import TeamSlot from "../components/TeamSlot";
import { ChampionSelect } from "../components/ChampionSelect";
import TurnTimer from "../components/TurnTimer";
import SeriesScoreboard from "../components/SeriesScoreboard";
import { useRoomStore } from "../store/roomStore";
import { Box, Typography, Button, Container, Paper, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Stack } from "@mui/material";
import { styled } from '@mui/material/styles';

const BANPICK_ORDER = [
  { team: "blue", action: "ban" }, { team: "red", action: "ban" },
  { team: "blue", action: "ban" }, { team: "red", action: "ban" },
  { team: "blue", action: "ban" }, { team: "red", action: "ban" },
  { team: "blue", action: "pick" }, { team: "red", action: "pick" },
  { team: "red", action: "pick" }, { team: "blue", action: "pick" },
  { team: "blue", action: "pick" }, { team: "red", action: "pick" },
  { team: "red", action: "ban" }, { team: "blue", action: "ban" },
  { team: "red", action: "ban" }, { team: "blue", action: "ban" },
  { team: "red", action: "pick" }, { team: "blue", action: "pick" },
  { team: "blue", action: "pick" }, { team: "red", action: "pick" },
];

const PageContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  padding: theme.spacing(1, 2),
  gap: theme.spacing(1),
}));

const MainGrid = styled(Grid)({
  flexGrow: 1,
});

const BanPickCompletePaper = styled(Paper)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
}));

const BlueTeamButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.teamBlue.main,
  '&:hover': {
    backgroundColor: theme.palette.teamBlue.dark,
  },
}));

const RedTeamButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.teamRed.main,
  '&:hover': {
    backgroundColor: theme.palette.teamRed.dark,
  },
}));

const GameBanPickPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const captureRef = useRef(null);

  const {
    connectToRoom,
    gameMode, gameSeries, blueTeamName, redTeamName, timerMode, banMode,
    turnIndex, blueBans, redBans, bluePicks, redPicks, swapRequest, fearlessPicks,
    selectChampion, resetBoard, handleSwapRequest, handleSwapAccept, handleSwapCancel, finishGame, startGameSeries, getMyTeam
  } = useRoomStore();

  const [champions, setChampions] = useState([]);
  const [gameWinnerSelected, setGameWinnerSelected] = useState(false);

  useEffect(() => {
    if (roomId) {
      connectToRoom(roomId);
    }
    return () => {};
  }, [roomId, connectToRoom]);

  useEffect(() => {
    if (roomId !== 'local') {
      startGameSeries();
    }
  }, [roomId, startGameSeries]);

  useEffect(() => {
    const fetchChampions = async () => {
      try {
        const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await res.json();
        const latest = versions[0];
        const champRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latest}/data/ko_KR/champion.json`);
        const champData = await champRes.json();
        const champArray = Object.values(champData.data).map((c) => ({
          id: c.id,
          name: c.name,
          image: `https://ddragon.leagueoflegends.com/cdn/${latest}/img/champion/${c.image.full}`,
          tags: c.tags,
        }));
        champArray.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        setChampions(champArray);
      } catch (err) {
        console.error("챔피언 데이터 로딩 실패:", err);
      }
    };
    fetchChampions();
  }, []);

  useEffect(() => {
    let winner = null;
    const requiredWins = gameMode === 'BO3' ? 2 : (gameMode === 'BO5' ? 3 : 1);
    if (gameSeries.blueWins === requiredWins) winner = blueTeamName;
    else if (gameSeries.redWins === requiredWins) winner = redTeamName;

    if (winner) {
      navigate('/series-result', { 
        state: { gameSeries, blueTeamName, redTeamName } 
      });
    }
  }, [gameSeries, gameMode, blueTeamName, redTeamName, navigate]);
  
  useEffect(() => {
    if (gameSeries.currentGame > 1) {
        setGameWinnerSelected(false);
    }
  }, [gameSeries.currentGame]);

  const currentTurn = BANPICK_ORDER[turnIndex];
  const isBanpickFinished = turnIndex >= BANPICK_ORDER.length;
  const myTeam = getMyTeam();
  const isMyTurn = currentTurn && myTeam === currentTurn.team;

  const handleFinishGameWrapper = (winner) => {
    finishGame({ winner });
    setGameWinnerSelected(true);
  };

  const getUnselectableChampionNames = () => {
    const unselectable = new Set([
      ...bluePicks, ...redPicks, ...blueBans, ...redBans
    ].filter(Boolean).map(c => c.name));

    if (banMode === 'fearless') {
      (fearlessPicks || []).forEach(c => unselectable.add(c.name));
    }

    return unselectable;
  };

  const renderTurnIndicator = () => {
    if (!currentTurn || isBanpickFinished) return null;

    const teamName = currentTurn.team === 'blue' ? blueTeamName : redTeamName;
    const actionText = currentTurn.action === 'ban' ? '금지할 챔피언' : '선택할 챔피언';
    const turnMessage = `${teamName}이(가) ${actionText}을(를) 선택 중입니다...`;
    const myTurnMessage = `당신이 ${actionText}을(를) 선택할 차례입니다!`;

    return (
      <Typography variant="h6" align="center" sx={{ my: 1, color: isMyTurn ? 'primary.main' : 'text.primary' }}>
        {isMyTurn ? myTurnMessage : turnMessage}
      </Typography>
    );
  };

  const renderSwapDialog = () => {
    if (!swapRequest?.to) return null;
    const { from, to } = swapRequest;
    const picks = from.team === 'blue' ? bluePicks : redPicks;
    const fromChamp = picks[from.index];
    const toChamp = picks[to.index];
    if (!fromChamp || !toChamp) return null;

    return (
      <Dialog open={true} onClose={handleSwapCancel}>
        <DialogTitle>챔피언 스왑</DialogTitle>
        <DialogContent>
          <DialogContentText>{fromChamp.name} 챔피언과 {toChamp.name} 챔피언을 교환하시겠습니까?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSwapCancel}>취소</Button>
          <Button onClick={handleSwapAccept} autoFocus>확인</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <PageContainer maxWidth="xl" ref={captureRef}>
      {renderSwapDialog()}
      <Box>
        <SeriesScoreboard />
      </Box>
      <MainGrid container spacing={2}>
        <Grid item xs={12} md={2} sx={{ display: 'flex', flexDirection: 'column' }}>
          <TeamSlot team="blue" bans={blueBans} picks={bluePicks} currentTurn={currentTurn} isBanpickFinished={isBanpickFinished} onSwap={handleSwapRequest} swapRequest={swapRequest} />
        </Grid>
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {isBanpickFinished ? (
            <BanPickCompletePaper elevation={3}>
              {gameWinnerSelected ? (
                gameMode !== 'single' ? (
                  <>
                    <Typography variant="h4">게임 {gameSeries.currentGame -1} 종료</Typography>
                    <Typography>다음 게임을 준비하세요.</Typography>
                  </>
                ) : <Typography variant="h4">게임 종료</Typography>
              ) : (
                <>
                  <Typography variant="h5" gutterBottom>밴/픽 완료!</Typography>
                  <Typography variant="body1" sx={{ mb: 1, textAlign: 'center' }}>승리 팀을 선택하기 전에 각 팀의 챔피언을 스왑할 수 있습니다.</Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>(스왑하려면 팀원의 챔피언 초상화를 순서대로 클릭하세요)</Typography>
                  <Typography variant="h6">승리 팀을 선택하세요:</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <BlueTeamButton variant="contained" onClick={() => handleFinishGameWrapper('blue')}>{blueTeamName} 승리</BlueTeamButton>
                    <RedTeamButton variant="contained" onClick={() => handleFinishGameWrapper('red')}>{redTeamName} 승리</RedTeamButton>
                  </Box>
                </>
              )}
            </BanPickCompletePaper>
          ) : (
            <Stack spacing={2} sx={{ height: '100%' }}>
              {timerMode !== 'none' && <TurnTimer />}
              {renderTurnIndicator()}
              <Box sx={{ flex: 1, minHeight: 0, borderRadius: 1 }}>
                <ChampionSelect champions={champions} onSelect={selectChampion} disabledChampions={getUnselectableChampionNames()} isLocked={!isMyTurn} />
              </Box>
            </Stack>
          )}
        </Grid>
        <Grid item xs={12} md={2} sx={{ display: 'flex', flexDirection: 'column' }}>
          <TeamSlot team="red" bans={redBans} picks={redPicks} currentTurn={currentTurn} isBanpickFinished={isBanpickFinished} onSwap={handleSwapRequest} swapRequest={swapRequest} />
        </Grid >
      </MainGrid>
    </PageContainer>
  );
};

export default GameBanPickPage;
