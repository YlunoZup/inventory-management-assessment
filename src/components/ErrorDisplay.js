import { Box, Button, Paper, Typography, useTheme, alpha } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

export default function ErrorDisplay({
  title = 'Something went wrong',
  message = 'An error occurred while loading the data.',
  onRetry,
}) {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 4,
        textAlign: 'center',
        bgcolor: alpha(theme.palette.error.main, 0.05),
        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          p: 2,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.error.main, 0.1),
          mb: 2,
        }}
      >
        <ErrorIcon sx={{ fontSize: 48, color: theme.palette.error.main }} />
      </Box>

      <Typography variant="h6" gutterBottom fontWeight={600}>
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {message}
      </Typography>

      {onRetry && (
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          color="error"
        >
          Try Again
        </Button>
      )}
    </Paper>
  );
}
