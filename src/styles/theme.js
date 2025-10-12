import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#c89b3c", // Gold color for highlights
    },
    background: {
      default: "#111827", // Dark blue-gray
      paper: "#1f2937", // Slightly lighter dark blue-gray
    },
    text: {
      primary: "#f0e6d2", // Light beige for text
      secondary: "#a3a3a3",
    },
    teamBlue: {
      main: '#2a3a6b',
      light: '#3e4e8c',
      dark: '#1e2a4a',
    },
    teamRed: {
      main: '#6b2a2a',
      light: '#8c3e3e',
      dark: '#4a1e1e',
    },
  },
  typography: {
    fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      letterSpacing: "0.05em",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
    },
    h3: {
        fontSize: "1.75rem",
        fontWeight: 700,
    },
    body1: {
      fontSize: "1rem",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        containedPrimary: {
          color: "#111827",
        }
      },
    },
    MuiTextField: {
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                        borderColor: '#374151',
                    },
                    '&:hover fieldset': {
                        borderColor: '#c89b3c',
                    },
                },
            },
        },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // 기본 Paper에는 배경 이미지 제거
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: (theme) => `
        @font-face {
          font-family: 'Pretendard';
          font-style: normal;
          font-weight: 400;
          src: url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/web/static/woff2/Pretendard-Regular.woff2') format('woff2');
        }
        @font-face {
          font-family: 'Pretendard';
          font-style: normal;
          font-weight: 700;
          src: url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/web/static/woff2/Pretendard-Bold.woff2') format('woff2');
        }
        html {
          box-sizing: border-box;
        }
        *,
        *::before,
        *::after {
          box-sizing: inherit;
        }
        body {
          margin: 0;
          background-color: ${theme.palette.background.default};
          background-image: url('https://www.transparenttextures.com/patterns/dark-matter.png');
        }
        #root {
          min-height: 100vh;
        }
      `,
    },
  },
});

export default theme;