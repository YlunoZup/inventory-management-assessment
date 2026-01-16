import { Box, Button, Paper, Typography, useTheme, alpha } from '@mui/material';
import { Add as AddIcon, Inbox as InboxIcon } from '@mui/icons-material';

export default function EmptyState({
  icon: Icon = InboxIcon,
  title = 'No data found',
  message = 'There are no items to display.',
  actionLabel,
  onAction,
}) {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 6,
        textAlign: 'center',
        bgcolor: alpha(theme.palette.primary.main, 0.02),
        border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          p: 2,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          mb: 3,
        }}
      >
        <Icon sx={{ fontSize: 56, color: theme.palette.primary.main, opacity: 0.7 }} />
      </Box>

      <Typography variant="h6" gutterBottom fontWeight={600}>
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
        {message}
      </Typography>

      {actionLabel && onAction && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
}
