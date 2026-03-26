import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4aa',
      light: '#33ddbb',
      dark: '#00a87a',
      contrastText: '#0a0c10',
    },
    secondary: {
      main: '#ff6b35',
      light: '#ff8a5c',
      dark: '#cc5522',
    },
    error: { main: '#ff4757' },
    warning: { main: '#ffa502' },
    success: { main: '#2ed573' },
    info: { main: '#1e90ff' },
    background: {
      default: '#0a0c10',
      paper: '#111318',
    },
    text: {
      primary: '#e8eaf0',
      secondary: '#8b92a5',
    },
    divider: 'rgba(255,255,255,0.07)',
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    h1: { fontFamily: '"Syne", sans-serif', fontWeight: 800 },
    h2: { fontFamily: '"Syne", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Syne", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Syne", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Syne", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Syne", sans-serif', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.07)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00d4aa, #00a87a)',
          '&:hover': { background: 'linear-gradient(135deg, #33ddbb, #00d4aa)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600, fontSize: '0.72rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid rgba(255,255,255,0.06)' },
        head: { fontWeight: 600, color: '#8b92a5', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
      },
    },
  },
});

export default theme;
