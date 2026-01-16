import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  IconButton,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Keyboard as KeyboardIcon,
} from '@mui/icons-material';
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

const KeyCode = ({ children }) => {
  const theme = useTheme();
  return (
    <Box
      component="kbd"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 28,
        height: 28,
        px: 1,
        borderRadius: 1,
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        color: theme.palette.primary.main,
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    >
      {children}
    </Box>
  );
};

const ShortcutItem = ({ shortcut, description }) => {
  const theme = useTheme();

  const renderKeys = () => {
    const keys = [];
    if (shortcut.ctrl) keys.push('Ctrl');
    if (shortcut.shift) keys.push('Shift');
    if (shortcut.alt) keys.push('Alt');
    keys.push(shortcut.key === 'Escape' ? 'Esc' : shortcut.key.toUpperCase());

    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        {keys.map((key, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {i > 0 && <Typography color="text.secondary">+</Typography>}
            <KeyCode>{key}</KeyCode>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1.5,
        px: 2,
        borderRadius: 1,
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      <Typography variant="body2">{description}</Typography>
      {renderKeys()}
    </Box>
  );
};

export default function KeyboardShortcutsDialog({ open, onClose }) {
  const theme = useTheme();

  const navigationShortcuts = Object.entries(SHORTCUTS).filter(([key]) => key.startsWith('GO_'));
  const actionShortcuts = Object.entries(SHORTCUTS).filter(([key]) =>
    !key.startsWith('GO_') && key !== 'CLOSE_DIALOG' && key !== 'SHOW_SHORTCUTS'
  );
  const otherShortcuts = Object.entries(SHORTCUTS).filter(([key]) =>
    key === 'CLOSE_DIALOG' || key === 'SHOW_SHORTCUTS'
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <KeyboardIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Keyboard Shortcuts
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="Close dialog">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Navigation */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: 'block', mb: 1, fontWeight: 600 }}
            >
              Navigation
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              {navigationShortcuts.map(([key, shortcut], index) => (
                <Box key={key}>
                  {index > 0 && <Divider />}
                  <ShortcutItem shortcut={shortcut} description={shortcut.description} />
                </Box>
              ))}
            </Paper>
          </Box>

          {/* Actions */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: 'block', mb: 1, fontWeight: 600 }}
            >
              Actions
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              {actionShortcuts.map(([key, shortcut], index) => (
                <Box key={key}>
                  {index > 0 && <Divider />}
                  <ShortcutItem shortcut={shortcut} description={shortcut.description} />
                </Box>
              ))}
            </Paper>
          </Box>

          {/* Other */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: 'block', mb: 1, fontWeight: 600 }}
            >
              General
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              {otherShortcuts.map(([key, shortcut], index) => (
                <Box key={key}>
                  {index > 0 && <Divider />}
                  <ShortcutItem shortcut={shortcut} description={shortcut.description} />
                </Box>
              ))}
            </Paper>
          </Box>

          {/* Tip */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.info.main, 0.08),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              <strong>Tip:</strong> Press <KeyCode>?</KeyCode> at any time to show this dialog.
              Shortcuts are disabled when typing in input fields.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// Floating shortcut hint button
export function ShortcutHint({ onClick }) {
  const theme = useTheme();

  return (
    <Chip
      icon={<KeyboardIcon fontSize="small" />}
      label="Press ? for shortcuts"
      size="small"
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        bgcolor: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(8px)',
        border: `1px solid ${theme.palette.divider}`,
        cursor: 'pointer',
        '&:hover': {
          bgcolor: theme.palette.background.paper,
        },
      }}
    />
  );
}
