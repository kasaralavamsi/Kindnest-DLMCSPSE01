import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Divider,
  Alert
} from "@mui/material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/http";
import { setAuth } from "../auth/storage";

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const defaultRole = useMemo(() => params.get("role") || "requester", [params]);
  const [role, setRole] = useState(defaultRole);

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/api/auth/register", { name, identifier, password, role });
      setAuth(res.data.token, res.data.user);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5, md: 5 } }}>
        <form onSubmit={onSubmit}>
          <Stack spacing={{ xs: 2, sm: 2.5 }}>
            <Stack spacing={0.5}>
              <Typography variant="h5" sx={{ fontSize: { xs: 22, sm: 24 } }}>
                Create account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pick your role, then create your profile.
              </Typography>
            </Stack>

            <Divider />

            {error && <Alert severity="error">{error}</Alert>}

            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Role
              </Typography>
              <ToggleButtonGroup
                value={role}
                exclusive
                onChange={(e, v) => v && setRole(v)}
                fullWidth
                sx={{ "& .MuiToggleButton-root": { py: 1.1 } }}
              >
                <ToggleButton value="requester">Requester</ToggleButton>
                <ToggleButton value="volunteer">Volunteer</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Stack spacing={2}>
              <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <TextField
                label="Email or phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@email.com or +91XXXXXXXXXX"
                autoComplete="username"
              />
              <TextField
                label="Password (min 8 chars)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Stack>

            <Button variant="contained" size="large" fullWidth type="submit" disabled={busy}>
              {busy ? "Creating..." : "Create account"}
            </Button>

            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Box
                component={RouterLink}
                to="/login"
                sx={{ color: "primary.main", fontWeight: 800, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Log in
              </Box>
            </Typography>

            <Typography variant="body2" color="text.secondary">
              <Box
                component={RouterLink}
                to="/"
                sx={{ color: "text.secondary", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                ← Back to home
              </Box>
            </Typography>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}