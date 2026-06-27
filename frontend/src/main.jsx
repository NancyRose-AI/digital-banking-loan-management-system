import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AuthProvider } from './context/AuthContext.jsx'

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#fcfcfd',
      paper: '#ffffff',
    },
    primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8b5cf6',
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    info: {
      main: '#38bdf8',
      light: '#7dd3fc',
      dark: '#0284c7',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#f43f5e',
      light: '#fb7185',
      dark: '#e11d48',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    divider: '#f1f5f9',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-1px' },
    h2: { fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.75px' },
    h3: { fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.5px' },
    h4: { fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.5px' },
    h5: { fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.25px' },
    h6: { fontWeight: 700, fontSize: '1.125rem', letterSpacing: '0px' },
    subtitle1: { fontWeight: 600, fontSize: '1rem', letterSpacing: '0.1px' },
    subtitle2: { fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.1px' },
    button: { fontWeight: 600, letterSpacing: '0.3px', textTransform: 'none' },
    body1: { fontSize: '0.95rem', letterSpacing: '0.2px' },
    body2: { fontSize: '0.85rem', letterSpacing: '0.2px' },
    caption: { fontSize: '0.75rem', letterSpacing: '0.05em' }
  },
  shape: {
    borderRadius: 8, // Standard rectangular border radius for soft modern cards
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          textTransform: 'none',
          fontWeight: 700,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation0: {
          border: '1px solid #f1f5f9',
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0 12px 32px -8px rgba(148, 163, 184, 0.1)',
          border: '1px solid #ffffff',
        },
        elevation2: {
          boxShadow: '0 20px 40px -10px rgba(148, 163, 184, 0.15)',
          border: '1px solid #ffffff',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#f8fafc',
          '& fieldset': {
            borderColor: '#e2e8f0',
            transition: 'border-color 0.2s ease',
          },
          '&:hover fieldset': {
            borderColor: '#cbd5e1',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#3b82f6',
            borderWidth: '2px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f1f5f9',
          padding: '16px 20px',
        },
        head: {
          fontWeight: 700,
          color: '#64748b',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
        }
      }
    }
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
