/**
 * Login.jsx
 *
 * CHANGED FROM ORIGINAL:
 *  - Both email and phone now use password login — OTP flow removed entirely.
 *  - Single-step form: enter email/phone + password → submit → JWT.
 *  - Auto-detects email vs phone to show the right icon/placeholder,
 *    but both go through the same /api/auth/login endpoint.
 *
 * Path: client/src/pages/Login.jsx
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  InputAdornment,
  CircularProgress
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import api from "../api/http";
import { setAuth } from "../auth/storage";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [busy, setBusy]             = useState(false);
  const [error, setError]           = useState("");

  const isEmail = identifier.includes("@");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/api/auth/login", {
        identifier: identifier.trim(),
        password
      });
      setAuth(res.data.token, res.data.user);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5, md: 5 } }}>
        <Stack spacing={{ xs: 2, sm: 2.5 }}>

          {/* Header */}
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontSize: { xs: 22, sm: 24 } }}>
              Log in
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your email or phone number and password to continue.
            </Typography>
          </Stack>

          <Divider />

          {error && <Alert severity="error">{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>

              {/* Email or phone */}
              <TextField
                label="Email or phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@email.com  or  +91XXXXXXXXXX"
                autoComplete="username"
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {isEmail
                        ? <MailOutlineIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        : <PhoneAndroidIcon fontSize="small" sx={{ color: "text.secondary" }} />}
                    </InputAdornment>
                  )
                }}
              />

              {/* Password */}
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  )
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={busy || !identifier.trim() || !password}
                startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {busy ? "Signing in…" : "Log in"}
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* Footer links */}
          <Stack spacing={1}>
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

        </Stack>
      </CardContent>
    </Card>
  );
}
