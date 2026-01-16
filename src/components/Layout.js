import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
  Divider,
  Avatar,
  Chip,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Warehouse as WarehouseIcon,
  Assessment as AssessmentIcon,
  SwapHoriz as TransferIcon,
  NotificationsActive as AlertsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  EnergySavingsLeaf as EcoIcon,
  Keyboard as KeyboardIcon,
} from '@mui/icons-material';
import { useThemeMode } from '@/context/ThemeContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import KeyboardShortcutsDialog, { ShortcutHint } from '@/components/KeyboardShortcuts';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', shortcut: 'Ctrl+H' },
  { text: 'Products', icon: <InventoryIcon />, path: '/products', shortcut: 'Ctrl+P' },
  { text: 'Warehouses', icon: <WarehouseIcon />, path: '/warehouses', shortcut: 'Ctrl+W' },
  { text: 'Stock Levels', icon: <AssessmentIcon />, path: '/stock', shortcut: 'Ctrl+S' },
  { divider: true },
  { text: 'Transfers', icon: <TransferIcon />, path: '/transfers', shortcut: 'Ctrl+T' },
  { text: 'Alerts', icon: <AlertsIcon />, path: '/alerts', shortcut: 'Ctrl+A' },
];

export default function Layout({ children, title }) {
  const theme = useTheme();
  const router = useRouter();
  const { mode, toggleTheme } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleShowShortcuts = useCallback(() => {
    setShortcutsOpen(true);
  }, []);

  const handleCloseShortcuts = useCallback(() => {
    setShortcutsOpen(false);
  }, []);

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    onShowShortcuts: handleShowShortcuts,
    onCloseDialog: handleCloseShortcuts,
    enabled: true,
  });

  const isCurrentPath = (path) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            width: 44,
            height: 44,
          }}
          aria-hidden="true"
        >
          <EcoIcon />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            GreenSupply
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Inventory Management
          </Typography>
        </Box>
      </Box>

      <List sx={{ flex: 1, py: 2 }} role="navigation" aria-label="Main navigation">
        {menuItems.map((item, index) =>
          item.divider ? (
            <Divider key={index} sx={{ my: 1.5, mx: 2 }} role="separator" />
          ) : (
            <ListItem key={item.text} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
              <Tooltip
                title={item.shortcut ? `Shortcut: ${item.shortcut}` : ''}
                placement="right"
                arrow
              >
                <ListItemButton
                  component={Link}
                  href={item.path}
                  onClick={isMobile ? handleDrawerToggle : undefined}
                  selected={isCurrentPath(item.path)}
                  aria-current={isCurrentPath(item.path) ? 'page' : undefined}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.main + '15',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.main + '25',
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                      '& .MuiListItemText-primary': {
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                      },
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isCurrentPath(item.path)
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                    }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isCurrentPath(item.path) ? 600 : 400,
                    }}
                  />
                  {item.shortcut && !isMobile && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.disabled',
                        fontSize: '0.7rem',
                        fontFamily: 'monospace',
                        bgcolor: alpha(theme.palette.text.disabled, 0.08),
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 0.5,
                      }}
                    >
                      {item.shortcut.replace('Ctrl+', '^')}
                    </Typography>
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )
        )}
      </List>

      {/* Keyboard shortcuts button */}
      <Box sx={{ px: 2, pb: 1 }}>
        <Chip
          icon={<KeyboardIcon fontSize="small" />}
          label="Keyboard Shortcuts"
          variant="outlined"
          size="small"
          onClick={handleShowShortcuts}
          sx={{
            width: '100%',
            justifyContent: 'flex-start',
            borderStyle: 'dashed',
            '&:hover': {
              borderStyle: 'solid',
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        />
      </Box>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
          GreenSupply Co.
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
          Sustainable Distribution
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
        elevation={0}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h5" noWrap component="h1" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              {title || 'Dashboard'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Keyboard shortcuts (?)">
              <IconButton
                onClick={handleShowShortcuts}
                color="inherit"
                aria-label="Show keyboard shortcuts"
                sx={{ display: { xs: 'none', sm: 'flex' } }}
                size="medium"
              >
                <KeyboardIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              <IconButton
                onClick={toggleTheme}
                color="inherit"
                aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                size="medium"
              >
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: theme.palette.background.default,
          minHeight: '100vh',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        <Toolbar sx={{ mb: { xs: 1, sm: 2 } }} />
        <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
          {children}
        </Box>
      </Box>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog open={shortcutsOpen} onClose={handleCloseShortcuts} />
    </Box>
  );
}
