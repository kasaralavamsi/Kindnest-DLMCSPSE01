import { Container, Box, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

export default function PublicLayout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.default",
          borderBottom: "1px solid",
          borderColor: "divider"
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            py: 1.5,
            px: { xs: 2, sm: 3 }
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography
              component={RouterLink}
              to="/"
              variant="body2"
              sx={{
                textDecoration: "none",
                letterSpacing: 2,
                fontWeight: 950,
                color: "primary.main",
                display: "inline-flex",
                alignItems: "center",
                gap: 1
              }}
            >
              KINDNEST
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "secondary.main"
                }}
              />
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {isHome ? "Welcome" : "KindNest"}
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* Page content */}
      <Container
        maxWidth="md"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          py: { xs: 3, sm: 4, md: 6 },
          px: { xs: 2, sm: 3 }
        }}
      >
        <Box sx={{ width: "100%" }}>{children}</Box>
      </Container>
    </Box>
  );
}