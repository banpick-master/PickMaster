import React from 'react';
import { useRoomStore } from '../store/roomStore';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// --- Styled Components ---

const TeamSlotContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const TeamHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'team',
})(({ theme, team }) => ({
  backgroundColor: theme.palette[team === 'blue' ? 'teamBlue' : 'teamRed'].main,
  textAlign: 'center',
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
}));

const PickCardStyled = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isCurrentTurn' && prop !== 'isSwapFrom' && prop !== 'champion' && prop !== 'isTemporary',
})(({ theme, isCurrentTurn, isSwapFrom, champion, isTemporary }) => ({
  position: 'relative',
  height: 'auto',
  aspectRatio: '16 / 9',
  backgroundColor: 'rgba(0,0,0,0.3)',
  border: `2px solid ${isCurrentTurn || isSwapFrom ? theme.palette.primary.main : 'transparent'}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: isCurrentTurn || isSwapFrom ? `0 0 15px ${theme.palette.primary.main}90` : 'none',
  transition: 'all 0.2s ease-in-out',
  marginBottom: theme.spacing(1),
  cursor: champion ? 'pointer' : 'default',
  overflow: 'hidden',
  opacity: isTemporary ? 0.7 : 1,
  '&:hover': {
    borderColor: champion ? theme.palette.primary.light : 'transparent',
  }
}));

const BanCardStyled = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isCurrentTurn' && prop !== 'isTemporary',
})(({ theme, isCurrentTurn, isTemporary }) => ({
  height: 'auto',
  width: '100%',
  aspectRatio: '1 / 1',
  overflow: 'hidden',
  backgroundColor: isCurrentTurn ? 'rgba(0,0,0,0.2)' : 'transparent',
  border: `2px solid ${isCurrentTurn ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: isCurrentTurn ? `0 0 10px ${theme.palette.primary.main}70` : 'none',
  transition: 'all 0.2s ease-in-out',
  opacity: isTemporary ? 0.7 : 1,
}));


// --- Child Components ---
const PickCard = ({ champion, isCurrentTurn, team, index, onSwap, isSwapFrom }) => {
  const positionOrder = ['TOP', 'JGL', 'MID', 'ADC', 'SUP'];
  const handleClick = () => { if (champion) onSwap(team, index); };

  return (
    <PickCardStyled onClick={handleClick} isCurrentTurn={isCurrentTurn} isSwapFrom={isSwapFrom} champion={champion} isTemporary={champion?.isTemporary}>
      {champion ? (
        <img src={champion.image} alt={champion.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Box sx={{ width: '100%', height: '100%', backgroundColor: 'rgba(10,10,20,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
           <Typography variant="overline" color="text.secondary">{positionOrder[index]}</Typography>
        </Box>
      )}
      {champion && (
        <Typography sx={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          textAlign: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: { xs: '0.7rem', sm: '0.9rem' },
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: '2px 0',
          textShadow: '1px 1px 3px black',
        }}>
          {champion.name}
        </Typography>
      )}
    </PickCardStyled>
  );
};

const BanCard = ({ champion, isCurrentTurn }) => (
  <BanCardStyled isCurrentTurn={isCurrentTurn} isTemporary={champion?.isTemporary}>
    {champion && (<img src={champion.image} alt={champion.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(80%)' }} />)}
  </BanCardStyled>
);


// --- 메인 팀 슬롯 컴포넌트 ---
const TeamSlot = ({ team, bans, picks, currentTurn, isBanpickFinished, onSwap, swapRequest }) => {
  const { blueTeamName, redTeamName } = useRoomStore();
  const teamName = team === 'blue' ? blueTeamName : redTeamName;

  const pickSlots = Array(5).fill(null).map((_, i) => picks[i] || null);
  const banSlots = Array(5).fill(null).map((_, i) => bans[i] || null);

  let activePickIndex = -1;
  let activeBanIndex = -1;
  if (!isBanpickFinished && currentTurn?.team === team) {
    if (currentTurn.action === 'pick') activePickIndex = pickSlots.findIndex(p => p === null);
    else if (currentTurn.action === 'ban') activeBanIndex = banSlots.findIndex(b => b === null);
  }

  return (
    <TeamSlotContainer>
      <TeamHeader team={team}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', fontSize: { xs: '1rem', sm: '1.5rem' } }}>
          {teamName}
        </Typography>
      </TeamHeader>

      <Box sx={(theme) => ({ 
        mt: 2, 
        flexGrow: 1, 
        minHeight: 0,
        overflowY: 'auto',
        pr: 1,
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.primary.dark,
          borderRadius: '4px',
          '&:hover': { backgroundColor: theme.palette.primary.main }
        }
      })}>
        {pickSlots.map((champion, index) => {
          const isCurrentPickTurn = index === activePickIndex;
          const isSwapFrom = swapRequest?.from.team === team && swapRequest.from.index === index;
          return <PickCard key={`pick-${index}`} champion={champion} isCurrentTurn={isCurrentPickTurn} team={team} index={index} onSwap={onSwap} isSwapFrom={isSwapFrom} />;
        })}
      </Box>

      <Box sx={{ pt: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mb: 1 }}>BANS</Typography>
        <Grid container spacing={1} justifyContent="center">
          {banSlots.map((champion, index) => {
            const isCurrentBanTurn = index === activeBanIndex;
            return (
              <Grid item xs={2.4} key={`ban-${index}`}>
                <BanCard champion={champion} isCurrentTurn={isCurrentBanTurn} />
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </TeamSlotContainer>
  );
};

export default TeamSlot;