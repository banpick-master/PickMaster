import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

const PageContainer = styled(Container)(({ theme }) => ({ display: 'flex', flexDirection: 'column', height: '100vh', padding: theme.spacing(1, 2), gap: theme.spacing(1) }));
const MainGrid = styled(Grid)({ flexGrow: 1 });
const BanPickCompletePaper = styled(Paper)(({ theme }) => ({ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: theme.spacing(2), padding: theme.spacing(3) }));
const BlueTeamButton = styled(Button)(({ theme }) => ({ backgroundColor: theme.palette.teamBlue.main, '&:hover': { backgroundColor: theme.palette.teamBlue.dark } }));
const RedTeamButton = styled(Button)(({ theme }) => ({ backgroundColor: theme.palette.teamRed.main, '&:hover': { backgroundColor: theme.palette.teamRed.dark } }));

const GameBanPickPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    const {
        connectToRoom, gameMode, gameSeries, blueTeamName, redTeamName, timerMode, banMode,
        turnIndex, blueBans, redBans, bluePicks, redPicks, swapRequest, fearlessPicks,
        selectChampion, handleSwapRequest, handleSwapAccept, handleSwapCancel, finishGame,
        confirmSelection, currentSelection, isMyTurn,
        champions
    } = useRoomStore();

    const [gameWinnerSelected, setGameWinnerSelected] = useState(false);

    useEffect(() => {
        if (roomId !== 'local') {
            connectToRoom(roomId);
        }
    }, [roomId, connectToRoom]);
    
    useEffect(() => {
        if (gameMode === 'single') return;
        const requiredWins = gameMode === 'BO3' ? 2 : (gameMode === 'BO5' ? 3 : 1);
        if (gameSeries.blueWins === requiredWins || gameSeries.redWins === requiredWins) {
            navigate('/series-result', { state: { gameSeries, blueTeamName, redTeamName } });
        }
    }, [gameSeries, blueTeamName, redTeamName, gameMode, navigate]);

    useEffect(() => {
        if (gameSeries.currentGame > 1 && gameWinnerSelected) {
            setGameWinnerSelected(false);
        }
    }, [gameSeries.currentGame, gameWinnerSelected]);

    const isBanpickFinished = turnIndex >= BANPICK_ORDER.length;

    const handleFinishGameWrapper = (winner) => {
        finishGame({ winner });
        setGameWinnerSelected(true);
    };

    const getUnselectableChampionNames = () => {
        const unselectable = new Set([
            ...bluePicks, ...redPicks, ...blueBans, ...redBans
        ].filter(Boolean).map(c => c.name));

        fearlessPicks.forEach(champ => unselectable.add(champ.name));
        
        return unselectable;
    };

    const getAugmentedSlots = (team, action) => {
        const originalSlots = action === 'pick' ? (team === 'blue' ? bluePicks : redPicks) : (team === 'blue' ? blueBans : redBans);
        const slots = [...originalSlots];

        const currentTurn = BANPICK_ORDER[turnIndex];
        if (
            currentSelection &&
            !isBanpickFinished &&
            currentTurn &&
            currentTurn.team === team &&
            currentTurn.action === action
        ) {
            const activeIndex = slots.findIndex(s => s === null);
            if (activeIndex !== -1) {
                slots[activeIndex] = { ...currentSelection, isTemporary: true };
            }
        }
        return slots;
    };

    const augmentedBluePicks = getAugmentedSlots('blue', 'pick');
    const augmentedRedPicks = getAugmentedSlots('red', 'pick');
    const augmentedBlueBans = getAugmentedSlots('blue', 'ban');
    const augmentedRedBans = getAugmentedSlots('red', 'ban');
    
    const renderSwapDialog = () => {
        // ... (수정 없음)
    };

    return (
        <PageContainer maxWidth="xl">
            {renderSwapDialog()}
            <Box><SeriesScoreboard /></Box>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                <MainGrid container spacing={2} sx={{ maxWidth: '1600px', width: '100%' }}>
                    <Grid item xs={12} md={2}><TeamSlot team="blue" bans={augmentedBlueBans} picks={augmentedBluePicks} currentTurn={BANPICK_ORDER[turnIndex]} isBanpickFinished={isBanpickFinished} onSwap={handleSwapRequest} swapRequest={swapRequest} /></Grid>
                    <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {isBanpickFinished ? (
                            <BanPickCompletePaper elevation={3}>
                                {gameWinnerSelected && gameMode !== 'single' ? (
                                    <>
                                        <Typography variant="h4">게임 {gameSeries.currentGame - 1} 종료</Typography>
                                        <Typography>다음 게임을 준비하세요.</Typography>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="h5" gutterBottom>밴픽 완료!</Typography>
                                        <Typography variant="body1" sx={{ mb: 2 }}>승리 팀을 선택하세요.</Typography>
                                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                            <BlueTeamButton variant="contained" onClick={() => handleFinishGameWrapper('blue')}>{blueTeamName} 승리</BlueTeamButton>
                                            <RedTeamButton variant="contained" onClick={() => handleFinishGameWrapper('red')}>{redTeamName} 승리</RedTeamButton>
                                        </Box>
                                        {gameMode === 'single' && (
                                            <Button variant="outlined" onClick={() => navigate('/')} sx={{ mt: 2 }}>로비로 돌아가기</Button>
                                        )}
                                    </>
                                )}
                            </BanPickCompletePaper>
                        ) : (
                            <Stack spacing={2} sx={{ height: '100%' }}>
                                {roomId !== 'local' && timerMode !== 'infinite' && <TurnTimer key={turnIndex} />}
                                <Box sx={{ flex: 1, minHeight: 0 }}>
                                    <ChampionSelect champions={champions} onSelect={selectChampion} disabledChampions={getUnselectableChampionNames()} />
                                </Box>

                                {isMyTurn() && currentSelection && (
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        onClick={confirmSelection}
                                        sx={{ mt: 1 }}
                                    >
                                        {BANPICK_ORDER[turnIndex]?.action === 'ban' ? '챔피언 금지' : '챔피언 선택'}
                                    </Button>
                                )}
                            </Stack>
                        )}
                    </Grid>
                    <Grid item xs={12} md={2}><TeamSlot team="red" bans={augmentedRedBans} picks={augmentedRedPicks} currentTurn={BANPICK_ORDER[turnIndex]} isBanpickFinished={isBanpickFinished} onSwap={handleSwapRequest} swapRequest={swapRequest} /></Grid>
                </MainGrid>
            </Box>
        </PageContainer>
    );
};

export default GameBanPickPage;