import { createTheme } from "@mui/material/styles";

const COLORS = {
  citrus: "#FFA62B",
  sea: "#86C5FF",
  amalfi: "#2E5AA7",
  cream: "#F8E6A0" // corrected hex (A0 not AO)
};

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: COLORS.amalfi },
    secondary: { main: COLORS.citrus },
    info: { main: COLORS.sea },
    background: {
      default: "#f6f7fb", // slightly richer than pure gray for modern feel
      paper: "#ffffff"
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569"
    }
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    h4: { fontWeight: 850 },
    h5: { fontWeight: 850 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 12,
          paddingLeft: 16,
          paddingRight: 16
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true
      }
    }
  }
});