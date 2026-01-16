import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

// Eco-friendly color palette
const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode - Fresh, natural colors
          primary: {
            main: '#2E7D32', // Forest green
            light: '#4CAF50',
            dark: '#1B5E20',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#00796B', // Teal
            light: '#26A69A',
            dark: '#004D40',
            contrastText: '#ffffff',
          },
          success: {
            main: '#43A047',
            light: '#76D275',
            dark: '#00701A',
          },
          warning: {
            main: '#FF8F00',
            light: '#FFC046',
            dark: '#C56000',
          },
          error: {
            main: '#D32F2F',
            light: '#EF5350',
            dark: '#C62828',
          },
          info: {
            main: '#0288D1',
            light: '#03A9F4',
            dark: '#01579B',
          },
          background: {
            default: '#F5F7F5',
            paper: '#FFFFFF',
          },
          text: {
            primary: '#1A2E1A',
            secondary: '#4A5D4A',
          },
          divider: 'rgba(46, 125, 50, 0.12)',
        }
      : {
          // Dark mode - Earthy, sustainable tones
          primary: {
            main: '#66BB6A', // Lighter green for dark mode
            light: '#98EE99',
            dark: '#338A3E',
            contrastText: '#000000',
          },
          secondary: {
            main: '#4DB6AC', // Lighter teal
            light: '#82E9DE',
            dark: '#00867D',
            contrastText: '#000000',
          },
          success: {
            main: '#81C784',
            light: '#B2F2B6',
            dark: '#519657',
          },
          warning: {
            main: '#FFB74D',
            light: '#FFE97D',
            dark: '#C88719',
          },
          error: {
            main: '#EF5350',
            light: '#FF867C',
            dark: '#B61827',
          },
          info: {
            main: '#4FC3F7',
            light: '#8BF6FF',
            dark: '#0093C4',
          },
          background: {
            default: '#121A12',
            paper: '#1E2A1E',
          },
          text: {
            primary: '#E8F5E9',
            secondary: '#A5D6A7',
          },
          divider: 'rgba(102, 187, 106, 0.12)',
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: mode === 'light'
            ? '0 2px 12px rgba(0, 0, 0, 0.08)'
            : '0 2px 12px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: mode === 'light' ? '#E8F5E9' : '#1E3A1E',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'light'
            ? '0 1px 3px rgba(0, 0, 0, 0.1)'
            : '0 1px 3px rgba(0, 0, 0, 0.3)',
        },
      },
    },
  },
});

export function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for saved preference - only on client
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('themeMode');
      if (savedMode) {
        setMode(savedMode);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setMode('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const contextValue = useMemo(() => ({ mode, toggleTheme }), [mode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
