// src/components/BanPickFinished.jsx
import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../store/roomStore';

const BanPickCompletePaper = styled(Paper)(({ theme }) => ({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(3)
}));

const BlueTeamButton = styled(Button)(({ theme }) => ({
    backgroundColor: theme.palette.teamBlue.main,
    '&:hover': { backgroundColor: theme.palette.teamBlue.dark }
}));

const RedTeamButton = styled(Button)(({ theme }) => ({
    backgroundColor: theme.palette.teamRed.main,
    '&:hover': { backgroundColor: theme.palette.teamRed.dark }
}));

const BanPickFinished = ({ gameWinnerSelected, handleFinishGameWrapper }) => {
    const navigate = useNavigate();
    const { gameSeries, blueTeamName, redTeamName } = useRoomStore();

    return (
        <BanPickCompletePaper elevation={3}>
            {gameWinnerSelected ? (
                <>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>게임 {gameSeries.currentGame - 1} 종료</Typography>
                    <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>다음 게임을 준비하세요.</Typography>
                </>
            ) : (
                <>
                    <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>밴픽 완료!</Typography>
                    <Typography variant="body1" sx={{ mb: 2, fontSize: { xs: '0.9rem', sm: '1rem' } }}>승리 팀을 선택하세요.</Typography>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 1, width: { xs: '100%', sm: 'auto' } }}>
                        <BlueTeamButton variant="contained" onClick={() => handleFinishGameWrapper('blue')} fullWidth>{blueTeamName} 승리</BlueTeamButton>
                        <RedTeamButton variant="contained" onClick={() => handleFinishGameWrapper('red')} fullWidth>{redTeamName} 승리</RedTeamButton>
                    </Box>
                </>
            )}
        </BanPickCompletePaper>
    );
};

export default BanPickFinished;
