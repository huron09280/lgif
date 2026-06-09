import type { PaletteMode, ThemeOptions } from '@mui/material';

export const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // palette values for light mode
          primary: {
            main: '#9061F9',
            light: '#A77DFA',
            dark: '#7A4CE0',
          },
          background: {
            default: '#F3F4F6', // 极简灰白背景
            paper: '#FFFFFF', // 纯白卡片
          },
          text: {
            primary: '#111827', // 深灰文字
            secondary: '#6B7280', // 辅助文字
          },
          divider: 'rgba(0, 0, 0, 0.08)',
        }
      : {
          // palette values for dark mode
          primary: {
            main: '#9061F9',
            light: '#A77DFA',
            dark: '#7A4CE0',
          },
          background: {
            default: '#141419',
            paper: '#1E1E24',
          },
          text: {
            primary: '#EDEDED',
            secondary: '#8F8F99',
          },
          divider: 'rgba(255, 255, 255, 0.08)',
        }),
  },
  typography: {
    fontFamily: '"Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          padding: '10px 24px',
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #9061F9 0%, #7A4CE0 100%)',
            boxShadow: mode === 'light' ? '0 4px 14px 0 rgba(144, 97, 249, 0.25)' : '0 4px 14px 0 rgba(144, 97, 249, 0.39)',
            '&:hover': {
              background: 'linear-gradient(135deg, #A77DFA 0%, #9061F9 100%)',
              boxShadow: mode === 'light' ? '0 6px 20px rgba(144, 97, 249, 0.15)' : '0 6px 20px rgba(144, 97, 249, 0.23)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
          border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255, 255, 255, 0.05)'}`,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: '#9061F9',
        },
        thumb: {
          backgroundColor: '#fff',
          boxShadow: mode === 'light' ? '0 1px 4px rgba(0,0,0,0.1)' : '0 0 10px rgba(144, 97, 249, 0.5)',
          '&:focus, &:hover, &.Mui-active': {
            boxShadow: mode === 'light' ? '0 2px 8px rgba(0,0,0,0.15)' : '0 0 15px rgba(144, 97, 249, 0.8)',
          },
        },
        track: {
          background: mode === 'light' ? '#9061F9' : 'linear-gradient(90deg, rgba(144,97,249,0.5) 0%, #9061F9 100%)',
          border: 'none',
        },
        rail: {
          backgroundColor: mode === 'light' ? '#E5E7EB' : '#303038',
        },
      },
    },
  },
});
