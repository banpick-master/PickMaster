import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeamSlot from "../components/TeamSlot";
import SeriesScoreboard from "../components/SeriesScoreboard";
import { useRoomStore } from "../store/roomStore";
import { Box, Container, Grid } from "@mui/material";
import { styled } from '@mui/material/styles';
import BanPickInProgress from "../components/BanPickInProgress";
import BanPickFinished from "../components/BanPickFinished";

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

const GameBanPickPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    const {
        connectToRoom, gameMode, gameSeries, blueTeamName, redTeamName,
        turnIndex, blueBans, redBans, bluePicks, redPicks, swapRequest,
        handleSwapRequest, finishGame, currentSelection
    } = useRoomStore();

    const [gameWinnerSelected, setGameWinnerSelected] = useState(false);

    useEffect(() => {
        connectToRoom(roomId);
    }, [roomId, connectToRoom]);
    


    useEffect(() => {
        if (gameSeries.currentGame > 1 && gameWinnerSelected) {
            setGameWinnerSelected(false);
        }
    }, [gameSeries.currentGame, gameWinnerSelected]);

    const isBanpickFinished = turnIndex >= BANPICK_ORDER.length;

    const handleFinishGameWrapper = (winner) => {
        finishGame({ winner, navigate });
        setGameWinnerSelected(true);
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
                            <BanPickFinished gameWinnerSelected={gameWinnerSelected} handleFinishGameWrapper={handleFinishGameWrapper} />
                        ) : (
                            <BanPickInProgress />
                        )}
                    </Grid>
                    <Grid item xs={12} md={2}><TeamSlot team="red" bans={augmentedRedBans} picks={augmentedRedPicks} currentTurn={BANPICK_ORDER[turnIndex]} isBanpickFinished={isBanpickFinished} onSwap={handleSwapRequest} swapRequest={swapRequest} /></Grid>
                </MainGrid>
            </Box>
        </PageContainer>
    );
};

export default GameBanPickPage;