// src/components/BanPickInProgress.jsx
import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import { ChampionSelect } from './ChampionSelect';
import TurnTimer from './TurnTimer';
import { useRoomStore } from '../store/roomStore';

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

const BanPickInProgress = () => {
    const {
        roomId, timerMode, turnIndex, selectChampion, confirmSelection,
        currentSelection, isMyTurn, champions, bluePicks, redPicks, blueBans, redBans, fearlessPicks
    } = useRoomStore();

    const getUnselectableChampionNames = () => {
        const unselectable = new Set([
            ...bluePicks, ...redPicks, ...blueBans, ...redBans
        ].filter(Boolean).map(c => c.name));

        fearlessPicks.forEach(champ => unselectable.add(champ.name));

        return unselectable;
    };

    return (
        <Stack spacing={2} sx={{ height: '100%' }}>
            {timerMode !== 'infinite' && <TurnTimer key={turnIndex} />}
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <ChampionSelect
                    champions={champions}
                    onSelect={selectChampion}
                    disabledChampions={getUnselectableChampionNames()}
                />
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
    );
};

export default BanPickInProgress;
