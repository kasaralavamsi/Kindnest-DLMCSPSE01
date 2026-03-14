import { useState } from "react";
import { Card, CardContent, Typography, Stack, TextField, Button, Box, Divider, Alert } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import api from "../api/http";
import { setAuth } from "../auth/storage";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/api/auth/login", { identifier, password });
      setAuth(res.data.token, res.data.user);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
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
                Log in
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use your email or phone number and password.
              </Typography>
            </Stack>

            <Divider />

            {error && <Alert severity="error">{error}</Alert>}

            <Stack spacing={2}>
              <TextField
                label="Email or phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@email.com or +91XXXXXXXXXX"
                autoComplete="username"
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Stack>

            <Button variant="contained" size="large" fullWidth type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Continue"}
            </Button>

            <Typography variant="body2" color="text.secondary">
              New here?{" "}
              <Box
                component={RouterLink}
                to="/register"
                sx={{ color: "primary.main", fontWeight: 800, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Create an account
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