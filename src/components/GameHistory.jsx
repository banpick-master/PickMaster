import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const GameHistory = ({ games, teamNames }) => {
    return (
        <Paper sx={{ width: '100%', maxWidth: 1600, mt: '1rem', p: '1rem', backgroundColor: 'background.paper', borderRadius: 2 }} elevation={2}>
            {games.map((game, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: '0.75rem', borderBottom: (theme) => index === games.length - 1 ? 'none' : `1px solid ${theme.palette.divider}` }}>
                    <Typography sx={{ flexBasis: 80, fontWeight: 'bold', color: 'text.secondary' }}>게임 {index + 1}</Typography>
                    
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Typography sx={{ color: 'teamBlue.main', fontWeight: 'bold' }}>{teamNames.blue}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {game.bluePicks.map(p => <img key={p.id} src={p.image} alt={p.name} style={{ width: 28, height: 28, borderRadius: 4 }} />)}
                            <Box sx={{ width: 2, height: 20, backgroundColor: 'divider', mx: '0.5rem' }} />
                            {game.blueBans.map(b => <img key={b.id} src={b.image} alt={b.name} style={{ width: 28, height: 28, borderRadius: 4 }} />)}
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' }}>
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {game.redBans.map(b => <img key={b.id} src={b.image} alt={b.name} style={{ width: 28, height: 28, borderRadius: 4 }} />)}
                            <Box sx={{ width: 2, height: 20, backgroundColor: 'divider', mx: '0.5rem' }} />
                            {game.redPicks.map(p => <img key={p.id} src={p.image} alt={p.name} style={{ width: 28, height: 28, borderRadius: 4 }} />)}
                        </Box>
                        <Typography sx={{ color: 'teamRed.main', fontWeight: 'bold' }}>{teamNames.red}</Typography>
                    </Box>
                </Box>
            ))}
        </Paper>
    );
};

export default GameHistory;
