import React from 'react';
import { useRoomStore } from '../store/roomStore';
import { Box, Typography } from '@mui/material';

const SeriesScoreboard = () => {
  const { gameMode, blueTeamName, redTeamName, gameSeries } = useRoomStore();

  const totalGames = gameMode === 'BO3' ? 3 : gameMode === 'BO5' ? 5 : 1;
  const currentRound = gameSeries.currentGame;

  let gameModeText = '';
  if (gameMode === 'single') {
    gameModeText = '단판';
  } else if (gameMode === 'BO3') {
    gameModeText = '3전 2선승제';
  } else if (gameMode === 'BO5') {
    gameModeText = '5전 3선승제';
  }

  if (gameMode === 'single') {
    return (
      <Box sx={{ my: 2, textAlign: 'center' }}>
        <Typography variant="h6">{gameModeText}</Typography>
      </Box>
    );
  }

  const requiredWins = gameMode === 'BO3' ? 2 : 3;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
      <Typography variant="h4" sx={{ color: 'teamBlue.light', fontWeight: 'bold' }}>
        {blueTeamName}
      </Typography>
      <Typography variant="h2" sx={{ mx: 4, letterSpacing: '0.1em' }}>
        {gameSeries.blueWins} - {gameSeries.redWins}
      </Typography>
      <Typography variant="h4" sx={{ color: 'teamRed.light', fontWeight: 'bold' }}>
        {redTeamName}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ ml: 2 }}>
        {gameModeText} ({currentRound}/{totalGames} 게임)
      </Typography>
    </Box>
  );
};

export default SeriesScoreboard;