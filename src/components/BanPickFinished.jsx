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
                    <Typography variant="h4">게임 {gameSeries.currentGame - 1} 종료</Typography>
                    <Typography>다음 게임을 준비하세요.</Typography>
                </>
            ) : (
                <>
                    <Typography variant="h5" gutterBottom>밴픽 완료!</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>승리 팀을 선택하세요.</Typography>
                    <Typography variant="h6" sx={{ mb: 2 }}>현재 스코어: {gameSeries.blueWins} - {gameSeries.redWins}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <BlueTeamButton variant="contained" onClick={() => handleFinishGameWrapper('blue')}>{blueTeamName} 승리</BlueTeamButton>
                        <RedTeamButton variant="contained" onClick={() => handleFinishGameWrapper('red')}>{redTeamName} 승리</RedTeamButton>
                    </Box>
                </>
            )}
        </BanPickCompletePaper>
    );
};

export default BanPickFinished;
