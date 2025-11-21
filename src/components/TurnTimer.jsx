import React, { useState, useEffect } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import { styled } from "@mui/material/styles";

const TimerContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 500,
  margin: '0 auto',
  padding: theme.spacing(1.5, 2),
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: `0 2px 10px rgba(0, 0, 0, 0.3)`,
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
}));

const TurnTimer = ({ initialTime = 30, endTime, onTimeout }) => {
  const [seconds, setSeconds] = useState(initialTime);

  useEffect(() => {
    const calculateRemainingTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setSeconds(remaining);
      if (remaining <= 0 && onTimeout) {
        onTimeout();
      }
    };

    if (endTime) {
      calculateRemainingTime();
      const timer = setInterval(calculateRemainingTime, 1000);
      return () => clearInterval(timer);
    } else {
      // Fallback for when endTime is not provided (e.g., during initial render or specific game states)
      setSeconds(initialTime);
      const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [initialTime, endTime, onTimeout]);

  useEffect(() => {
    if (seconds <= 0) {
      if (onTimeout) onTimeout();
      return;
    }
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds, onTimeout]);

  const progress = (seconds / initialTime) * 100;
  const progressColor = progress > 50 ? "primary" : progress > 25 ? "warning" : "error";

  return (
    <TimerContainer>
      <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold', letterSpacing: '0.1em' }}>
        {seconds}초 남음
      </Typography>
      <StyledLinearProgress variant="determinate" value={progress} color={progressColor} />
    </TimerContainer>
  );
};

export default TurnTimer;
