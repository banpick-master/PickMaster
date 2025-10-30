// ChampionSelect.jsx

import React, { useState, useMemo } from 'react';
import { Box, TextField, Paper, Typography, CircularProgress, Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Components는 이전과 동일하게 유지...
const ChampionCardStyled = styled(Paper, { shouldForwardProp: (prop) => prop !== 'isDisabled', })(({ theme, isDisabled }) => ({ backgroundColor: theme.palette.background.default, border: '2px solid transparent', borderRadius: theme.shape.borderRadius, cursor: isDisabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease-in-out', textAlign: 'center', overflow: 'hidden', opacity: isDisabled ? 0.4 : 1, pointerEvents: isDisabled ? 'none' : 'auto', '&:hover': { borderColor: isDisabled ? 'transparent' : theme.palette.primary.main, transform: isDisabled ? 'none' : 'translateY(-4px)', }, }));
const ChampionImage = styled('img', { shouldForwardProp: (prop) => prop !== 'isDisabled', })(({ isDisabled }) => ({ width: '100%', height: 'auto', aspectRatio: '1 / 1', objectFit: 'cover', filter: isDisabled ? 'grayscale(100%)' : 'none', }));
const ChampionName = styled(Typography)({ fontSize: '0.8rem', fontWeight: 600, padding: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', });
const roles = [ { key: 'all', label: '전체' }, { key: 'Fighter', label: '전사' }, { key: 'Tank', label: '탱커' }, { key: 'Mage', label: '마법사' }, { key: 'Assassin', label: '암살자' }, { key: 'Marksman', label: '원딜' }, { key: 'Support', label: '서폿' }, ];
const ChampionCard = ({ champion, isDisabled, onSelect }) => { return ( <Tooltip title={champion.name} placement="top" arrow> <Box> <ChampionCardStyled elevation={2} isDisabled={isDisabled} onClick={() => onSelect(champion)} > <ChampionImage src={champion.image} alt={champion.name} isDisabled={isDisabled} /> <ChampionName>{champion.name}</ChampionName> </ChampionCardStyled> </Box> </Tooltip> ); };

export const ChampionSelect = ({ champions, onSelect, disabledChampions = new Set(), isLocked = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const filteredChampions = useMemo(() => {
    if (!champions) return [];
    return champions.filter(champ => {
      const nameMatch = champ.name.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = selectedRole === 'all' || (champ.tags && champ.tags.includes(selectedRole));
      return nameMatch && roleMatch;
    });
  }, [champions, searchTerm, selectedRole]);

  if (!champions || champions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setSelectedRole(newRole);
    }
  };

  return (
    <Paper sx={{
      width: '100%',
      height: '100%',
      padding: { xs: '0.5rem', sm: '1rem' },
      backgroundColor: 'background.paper',
      borderRadius: 3,
      display: 'flex',
      flexDirection: 'column',
    }} elevation={3}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="챔피언 검색..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: '1rem' }}
        disabled={isLocked}
      />
      <Box sx={{ overflowX: 'auto', mb: '1rem' }}>
        <ToggleButtonGroup
          value={selectedRole}
          exclusive
          onChange={handleRoleChange}
          aria-label="champion role"
          size="small"
          sx={{ 
            mb: '0.5rem', 
            justifyContent: 'center',
            minWidth: 'max-content'
          }}
          disabled={isLocked}
        >
          {roles.map((role) => (
            <ToggleButton key={role.key} value={role.key} aria-label={role.label}>
              {role.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      
      <Box sx={{
        flexGrow: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
        gap: '0.5rem',
        overflowY: 'auto',
        pr: '0.5rem',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
          }
        },
      }}>
        {filteredChampions.map((champ) => (
          <ChampionCard
            key={champ.id}
            champion={champ}
            isDisabled={isLocked || disabledChampions.has(champ.name)}
            onSelect={onSelect}
          />
        ))}
      </Box>
    </Paper>
  );
};