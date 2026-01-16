import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { EnergySavingsLeaf as EcoIcon } from '@mui/icons-material';

export default function LoadingScreen({ message = 'Loading...' }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: 3,
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CircularProgress
          size={80}
          thickness={3}
          sx={{
            color: theme.palette.primary.main,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <EcoIcon
            sx={{
              fontSize: 32,
              color: theme.palette.primary.main,
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
        </Box>
      </Box>
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
