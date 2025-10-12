import React from 'react';
import { List, ListItem, ListItemText, Paper, Typography, Box } from '@mui/material';

const BanPickHistory = ({ history }) => {
  return (
    <Paper sx={{ p: 2, backgroundColor: 'background.paper' }} elevation={3}>
      <Typography variant="h6" gutterBottom>
        밴픽 기록
      </Typography>
      <List dense sx={{ maxHeight: '300px', overflow: 'auto' }}>
        {history && history.map((item, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText
              primary={`${index + 1}. ${item.type === 'ban' ? '[금지]' : '[선택]'} ${item.champion.name}`}
              secondary={item.team === 'blue' ? '블루팀' : '레드팀'}
              primaryTypographyProps={{ color: item.team === 'blue' ? 'primary.main' : 'error.main' }}
            />
          </ListItem>
        ))}
        {(!history || history.length === 0) && (
            <Box sx={{textAlign: 'center', color: 'text.secondary'}}>
                <Typography variant="body2">밴픽이 시작되면 기록이 표시됩니다.</Typography>
            </Box>
        )}
      </List>
    </Paper>
  );
};

export default BanPickHistory;
