import { Outlet, useNavigate } from "react-router-dom";
import { Container, Box, Stack, Typography, Button } from "@mui/material";
import { clearAuth, getCachedUser } from "../auth/storage";

export default function AppLayout() {
  const navigate = useNavigate();
  const user = getCachedUser();

  function logout() {
    clearAuth();
    navigate("/", { replace: true });
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
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
        <Container maxWidth="md" sx={{ py: 1.5, px: { xs: 2, sm: 3 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 950, letterSpacing: 2, color: "primary.main" }}>
              KINDNEST
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                {user?.name ? `${user.name} (${user.role})` : "Signed in"}
              </Typography>
              <Button variant="outlined" onClick={logout}>
                Logout
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}