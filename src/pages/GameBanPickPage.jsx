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
        selectChampion, handleSwapRequest, handleSwapAccept, handleSwapCancel, finishGame
    } = useRoomStore();

    const [champions, setChampions] = useState([]);
    const [gameWinnerSelected, setGameWinnerSelected] = useState(false);

    useEffect(() => {
        // ▼▼▼ [수정됨] '함께하기' 모드일 때만 서버에 연결하도록 변경
        if (roomId !== 'local') {
            connectToRoom(roomId);
        }
    }, [roomId, connectToRoom]);

    useEffect(() => {
        const fetchChampions = async () => {
            try {
                const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
                const versions = await res.json();
                const latest = versions[0];
                const champRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latest}/data/ko_KR/champion.json`);
                const champData = await champRes.json();
                const champArray = Object.values(champData.data).map((c) => ({ id: c.id, name: c.name, image: `https://ddragon.leagueoflegends.com/cdn/${latest}/img/champion/${c.image.full}`, tags: c.tags }));
                champArray.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
                setChampions(champArray);
            } catch (err) { console.error("챔피언 데이터 로딩 실패:", err); }
        };
        fetchChampions();
    }, []);
    
    useEffect(() => {
        if (gameMode === 'single') return;
        let winner = null;
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

    // ▼▼▼ [수정됨] 피어리스 밴픽 로직을 확실하게 적용합니다.
    const getUnselectableChampionNames = () => {
        console.log("getUnselectableChampionNames called.");
        console.log("Current banMode:", banMode);
        console.log("Current fearlessPicks:", fearlessPicks);

        const unselectable = new Set([
            ...bluePicks, ...redPicks, ...blueBans, ...redBans
        ].filter(Boolean).map(c => c.name));

        if (banMode === 'fearless') {
            console.log("banMode is fearless. Adding fearlessPicks.");
            fearlessPicks.forEach(champ => unselectable.add(champ.name));
        } else {
            console.log("banMode is not fearless. Not adding fearlessPicks.");
        }
        
        console.log("Final unselectable champions:", Array.from(unselectable));
        return unselectable;
    };
    
    const renderSwapDialog = () => {
        // ... (수정 없음)
    };

    return (
        <PageContainer maxWidth="xl">
            {renderSwapDialog()}
            <Box><SeriesScoreboard /></Box>
            <MainGrid container spacing={2}>
                <Grid item xs={12} md={2}><TeamSlot team="blue" bans={blueBans} picks={bluePicks} currentTurn={BANPICK_ORDER[turnIndex]} isBanpickFinished={isBanpickFinished} onSwap={handleSwapRequest} swapRequest={swapRequest} /></Grid>
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
                        </Stack>
                    )}
                </Grid>
                <Grid item xs={12} md={2}><TeamSlot team="red" bans={redBans} picks={redPicks} currentTurn={BANPICK_ORDER[turnIndex]} isBanpickFinished={isBanpickFinished} onSwap={handleSwapRequest} swapRequest={swapRequest} /></Grid>
            </MainGrid>
        </PageContainer>
    );
};

export default GameBanPickPage;