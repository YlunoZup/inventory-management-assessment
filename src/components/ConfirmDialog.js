import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';

/**
 * Reusable confirmation dialog component
 * @param {boolean} open - Whether the dialog is open
 * @param {function} onClose - Function to call when dialog should close
 * @param {function} onConfirm - Function to call when user confirms
 * @param {string} title - Dialog title
 * @param {string|React.ReactNode} message - Dialog message/content
 * @param {string} confirmText - Text for confirm button (default: 'Confirm')
 * @param {string} cancelText - Text for cancel button (default: 'Cancel')
 * @param {string} confirmColor - Color for confirm button (default: 'primary')
 * @param {boolean} loading - Whether the action is in progress
 * @param {boolean} destructive - Whether this is a destructive action (styles confirm button as error)
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  loading = false,
  destructive = false,
}) {
  const handleConfirm = () => {
    onConfirm();
  };

  const buttonColor = destructive ? 'error' : confirmColor;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        {typeof message === 'string' ? (
          <DialogContentText id="confirm-dialog-description">
            {message}
          </DialogContentText>
        ) : (
          message
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
          aria-label={cancelText}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          color={buttonColor}
          variant={destructive ? 'contained' : 'text'}
          autoFocus
          aria-label={confirmText}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
