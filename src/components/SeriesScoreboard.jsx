import React from 'react';
import { useRoomStore } from '../store/roomStore';
import { Box, Typography } from '@mui/material';

const SeriesScoreboard = () => {
  const { gameMode, blueTeamName, redTeamName, gameSeries } = useRoomStore();

  if (gameMode === 'single') {
    return (
      <Box sx={{ my: 2, textAlign: 'center' }}>
        <Typography variant="h6">{gameMode.toUpperCase()}</Typography>
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
        ({gameMode})
      </Typography>
    </Box>
  );
};

export default SeriesScoreboard;