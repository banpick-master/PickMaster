import { useParams, useNavigate } from "react-router-dom";
import { useRoomStore } from "../store/roomStore";
import { useState, useEffect } from "react";
import { Button, Box, Typography, Paper, Grid, Card, Chip, Container, Stack, TextField } from "@mui/material";
import { styled } from '@mui/material/styles';

// --- Styled Components ---
const CenteredBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(4),
}));

const InvitePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  marginTop: theme.spacing(2),
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
}));

const TeamPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'teamColor',
})(({ theme, teamColor }) => ({
  padding: theme.spacing(3),
  height: '100%',
  borderTop: `4px solid ${theme.palette[teamColor]?.main || theme.palette.grey[500]}`,
}));

const TeamTitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'teamColor',
})(({ theme, teamColor }) => ({
  color: theme.palette[teamColor]?.main || theme.palette.text.primary,
  marginBottom: theme.spacing(2),
}));

const StyledPlayerCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1.5),
}));

// --- PlayerCard Component ---
const PlayerStatus = ({ isReadyPhase, isReady, onReadyClick, isSelf }) => {
  if (isReadyPhase) {
    if (isSelf) {
      return (
        <Button
          variant="contained"
          size="small"
          color={isReady ? "success" : "primary"}
          onClick={onReadyClick}
        >
          {isReady ? "준비완료" : "준비"}
        </Button>
      );
    }
    return <Chip label={isReady ? "준비완료" : "대기중"} color={isReady ? "success" : "default"} size="small" />;
  }
  return null; // 준비 단계가 아닐 때는 아무것도 표시하지 않음
};

const PlayerCard = ({ player, onReady, isReadyPhase, isSelf }) => (
  <StyledPlayerCard>
    <Typography variant="body1">{player ? player.name : '참가자 대기 중...'}</Typography>
    {player && (
        <PlayerStatus
            isReadyPhase={isReadyPhase}
            isReady={player.isReady}
            onReadyClick={onReady}
            isSelf={isSelf}
        />
    )}
  </StyledPlayerCard>
);

// --- RoomPage Component ---
function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const {
    connectToRoom,
    gameName,
    blueTeamName,
    redTeamName,
    blueTeamPlayers,
    redTeamPlayers,
    readyCheckStatus,
    joinTeam,
    setReadyState,
    startDraft,
    draftStarted,
    hostId,
    resetReadyCheck,
    isConnected,
    getMyTeam,
    switchTeam,
  } = useRoomStore();

  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (roomId) {
      connectToRoom(roomId);
    }
    return () => {};
  }, [roomId, connectToRoom]);



  useEffect(() => {
    if (draftStarted) {
      navigate(`/game/${roomId}`);
    }
  }, [draftStarted, navigate, roomId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const myTeam = getMyTeam();
  const { myPlayerId } = useRoomStore();

  if (!isConnected) {
    return <Typography sx={{ p: 4 }}>방 정보를 불러오는 중...</Typography>;
  }

  const bluePlayer = blueTeamPlayers[0];
  const redPlayer = redTeamPlayers[0];

  const renderTeamJoinControls = () => {
    if (myTeam) { // If user is already in a team
      const canSwitch = (myTeam === 'blue' && redTeamPlayers.length === 0) || (myTeam === 'red' && blueTeamPlayers.length === 0);
      return (
        <Button variant="outlined" onClick={switchTeam} disabled={!canSwitch}>
          진영 바꾸기
        </Button>
      );
    }

    // If user is not in a team
    return (
      <>
        <Button variant="contained" onClick={() => joinTeam('blue', name)} disabled={!name}>
          블루팀 참가
        </Button>
        <Button variant="contained" color="error" onClick={() => joinTeam('red', name)} disabled={!name}>
          레드팀 참가
        </Button>
      </>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <CenteredBox>
        <Typography variant="h3" gutterBottom>{gameName}</Typography>
        <Typography variant="h6" color="text.secondary">참가자를 기다리고 있습니다...</Typography>
        <InvitePaper elevation={2}>
          <Typography variant="body1">초대 링크:</Typography>
          <Chip label={window.location.href} />
          <Button onClick={handleCopy} size="small">
            {copied ? "복사됨!" : "복사"}
          </Button>
        </InvitePaper>
      </CenteredBox>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField 
            label="이름"
            variant="outlined" 
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!myTeam} // Disable name input if already in a team
          />
          {renderTeamJoinControls()}
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Grid container spacing={4} alignItems="stretch" sx={{ maxWidth: '1200px', width: '100%' }}>
          <Grid item xs={12} md={6}>
            <TeamPaper teamColor="blue">
              <TeamTitle variant="h5" teamColor="blue">{blueTeamName || '블루팀'}</TeamTitle>
              <PlayerCard 
                player={bluePlayer} 
                onReady={() => bluePlayer && setReadyState(!bluePlayer.isReady)} 
                isReadyPhase={blueTeamPlayers.length > 0 && redTeamPlayers.length > 0}
                isSelf={bluePlayer && bluePlayer.id === myPlayerId}
              />
            </TeamPaper>
          </Grid>
          <Grid item xs={12} md={6}>
            <TeamPaper teamColor="red">
              <TeamTitle variant="h5" teamColor="red">{redTeamName || '레드팀'}</TeamTitle>
              <PlayerCard 
                player={redPlayer} 
                onReady={() => redPlayer && setReadyState(!redPlayer.isReady)} 
                isReadyPhase={blueTeamPlayers.length > 0 && redTeamPlayers.length > 0}
                isSelf={redPlayer && redPlayer.id === myPlayerId}
              />
            </TeamPaper>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        {myPlayerId === hostId && (
          <Button
            variant="contained"
            size="large"
            onClick={startDraft}
            disabled={readyCheckStatus !== 'all-ready'}
            sx={{ mb: 2 }}
          >
            드래프트 시작
          </Button>
        )}

        {readyCheckStatus === 'all-ready' ? (
          <Typography variant="h5" color="primary">모두 준비 완료! 호스트가 게임을 시작하기를 기다리고 있습니다...</Typography>
        ) : (
          <Typography variant="h6" color="text.secondary">
            {blueTeamPlayers.length > 0 && redTeamPlayers.length > 0 
              ? '모든 플레이어가 준비하면 게임이 시작됩니다...' 
              : '상대 팀 플레이어를 기다리고 있습니다...'}
          </Typography>
        )}
      </Box>
    </Container>
  );
}
export default RoomPage;