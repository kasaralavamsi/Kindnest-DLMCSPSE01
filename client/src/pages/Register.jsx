/**
 * Register.jsx
 *
 * CHANGED FROM ORIGINAL:
 *  - Both email and phone now register with name + password — OTP flow removed.
 *  - Single-step form. Password field is always shown.
 *  - Auto-detects email vs phone for the correct icon/hint, but both go through
 *    the same /api/auth/register endpoint.
 *
 * Path: client/src/pages/Register.jsx
 */

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
  Alert,
  CircularProgress,
  InputAdornment
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/http";
import { setAuth } from "../auth/storage";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultRole = useMemo(() => searchParams.get("role") || "requester", [searchParams]);
  const [role, setRole] = useState(defaultRole);

  const [name, setName]           = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]   = useState("");
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState("");

  const isEmail = identifier.includes("@");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!identifier.trim()) {
      setError("Please enter your email address or phone number.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const res = await api.post("/api/auth/register", {
        name: name.trim(),
        identifier: identifier.trim(),
        password,
        role
      });
      setAuth(res.data.token, res.data.user);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed. Please try again.");
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
              Create account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fill in your details below to get started.
            </Typography>
          </Stack>

          <Divider />

          {error && <Alert severity="error">{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>

              {/* Role selector */}
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  I want to join as a
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

              {/* Full name */}
              <TextField
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoFocus
                inputProps={{ maxLength: 80 }}
              />

              {/* Email or phone */}
              <TextField
                label="Email or phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@email.com  or  +91XXXXXXXXXX"
                autoComplete="username"
                helperText={
                  isEmail
                    ? "📧 Email address"
                    : identifier
                      ? "📱 Phone number"
                      : " "
                }
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
                label="Password (min 8 characters)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
                disabled={busy || !name.trim() || !identifier.trim() || !password}
                startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {busy ? "Creating account…" : "Create Account"}
              </Button>

            </Stack>
          </Box>

          <Divider />

          {/* Footer links */}
          <Stack spacing={1}>
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

        </Stack>
      </CardContent>
    </Card>
  );
}
