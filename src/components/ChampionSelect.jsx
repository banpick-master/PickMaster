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
    // ▼▼▼ [수정] Paper의 sx prop에서 height: '100%' 제거 ▼▼▼
    <Paper sx={{
      width: '100%',
      padding: '1rem',
      backgroundColor: 'background.paper',
      borderRadius: 3,
      // height: '100%', // 이 줄을 제거합니다.
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
        disabled={isLocked} // Lock search bar
      />
      <ToggleButtonGroup
        value={selectedRole}
        exclusive
        onChange={handleRoleChange}
        aria-label="champion role"
        fullWidth
        size="small"
        sx={{ mb: '1rem' }}
        disabled={isLocked} // Lock role filter
      >
        {roles.map((role) => (
          <ToggleButton key={role.key} value={role.key} aria-label={role.label}>
            {role.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      
      {/* ▼▼▼ [수정] 챔피언 목록 Box에서 flexGrow와 overflowY 제거 ▼▼▼ */}
      <Box sx={{
        flexGrow: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
        gap: '0.5rem',
        overflowY: 'auto',
        paddingRight: '0.5rem',
        maxHeight: 'calc(100vh - 450px)', // Set a calculated max height
        // 🔽 [개선 3] 스크롤바 스타일링 추가
        '&::-webkit-scrollbar': {
          width: '12px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          borderRadius: '6px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
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