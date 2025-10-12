import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { Box, Typography, Button, Container, Paper, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRoomStore } from '../store/roomStore';

const ResultPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: 'transparent', // 배경을 투명하게 하여 body의 배경 이미지가 보이도록 함
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: `0 0 20px ${theme.palette.primary.main}30`,
}));

const ChampionImage = styled('img')(({ theme }) => ({
  width: 70,
  height: 70,
  borderRadius: '50%',
  objectFit: 'cover',
  border: `2px solid ${theme.palette.divider}`,
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.1)',
  }
}));

const BanImage = styled(ChampionImage)({
  filter: 'grayscale(100%)',
  width: 45,
  height: 45,
  opacity: 0.7,
});

const TeamResultPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isWinner',
})(({ theme, isWinner }) => ({
  padding: theme.spacing(3),
  backgroundColor: isWinner ? theme.palette.background.paper : 'transparent',
  border: `2px solid ${isWinner ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: isWinner ? `0 0 25px ${theme.palette.primary.main}70` : 'none',
  transition: 'all 0.3s ease-in-out',
}));

const TeamResult = ({ teamName, picks, bans, isWinner, teamColor }) => (
  <TeamResultPaper isWinner={isWinner} elevation={isWinner ? 10 : 1}>
    <Typography variant="h4" sx={{ color: teamColor, fontWeight: 'bold', textAlign: 'center' }}>
      {isWinner ? `👑 VICTORY 👑` : `DEFEAT`}
    </Typography>
    <Typography variant="h5" sx={{ textAlign: 'center', mb: 3 }}>{teamName}</Typography>
    
    <Box mb={3}>
      <Typography variant="overline" display="block" textAlign="center">PICKS</Typography>
      <Grid container spacing={2} mt={1} justifyContent="center">
        {picks.map((p, i) => (
          <Grid item key={i}>{p ? <ChampionImage src={p.image} alt={p.name} /> : <Box sx={{width: 70, height: 70}}/>}</Grid>
        ))}
      </Grid>
    </Box>
    <Box>
      <Typography variant="overline" display="block" textAlign="center">BANS</Typography>
      <Grid container spacing={1} mt={1} justifyContent="center">
        {bans.map((b, i) => (
          <Grid item key={i}>{b ? <BanImage src={b.image} alt={b.name} /> : <Box sx={{width: 45, height: 45}}/>}</Grid>
        ))}
      </Grid>
    </Box>
  </TeamResultPaper>
);

const SeriesResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const captureRef = useRef(null);
  const { startGameSeries } = useRoomStore();

  const { gameSeries, blueTeamName, redTeamName } = location.state || {};

  if (!gameSeries) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h4">결과 데이터가 없습니다.</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          홈으로 돌아가기
        </Button>
      </Container>
    );
  }

  const winner = gameSeries.blueWins > gameSeries.redWins ? blueTeamName : redTeamName;
  const finalGame = gameSeries.games[gameSeries.games.length - 1];

  const handleCapture = async () => {
    if (!captureRef.current) return;
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#111827',
        useCORS: true,
        logging: true,
        imageTimeout: 15000,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `pick-master-result-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("화면 캡처 중 오류 발생:", error);
      alert("화면 캡처에 실패했습니다.");
    }
  };

  const handleReturnToLobby = () => {
    startGameSeries();
    navigate('/');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <ResultPaper ref={captureRef}>
        <Typography variant="h2" align="center" sx={{ fontWeight: 'bold', mb: 1, textTransform: 'uppercase' }}>
          Series Result
        </Typography>
        <Typography variant="h2" align="center" sx={{ mb: 4, letterSpacing: 4 }}>
          <Typography component="span" variant="h2" color="teamBlue.light" sx={{fontWeight: 'bold'}}>{gameSeries.blueWins}</Typography>
          <Typography component="span" variant="h2" sx={{ mx: 3 }}>-</Typography>
          <Typography component="span" variant="h2" color="teamRed.light" sx={{fontWeight: 'bold'}}>{gameSeries.redWins}</Typography>
        </Typography>

        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <TeamResult 
              teamName={blueTeamName} 
              picks={finalGame.bluePicks} 
              bans={finalGame.blueBans} 
              isWinner={winner === blueTeamName}
              teamColor="teamBlue.main"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TeamResult 
              teamName={redTeamName} 
              picks={finalGame.redPicks} 
              bans={finalGame.redBans} 
              isWinner={winner === redTeamName}
              teamColor="teamRed.main"
            />
          </Grid>
        </Grid>
      </ResultPaper>
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={handleCapture} size="large">
          결과 이미지로 저장
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleReturnToLobby} size="large">
          로비로 돌아가기
        </Button>
      </Box>
    </Container>
  );
};

export default SeriesResultPage;
