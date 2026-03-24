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
  CircularProgress,
  Chip
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import api from "../api/http";
import { setAuth } from "../auth/storage";

/**
 * Login page – smart identifier detection:
 *
 *   Email  →  OTP flow (send → verify → JWT)
 *   Phone  →  Password flow (phone + password → JWT)
 *
 * Step machine:  "identifier" → "otp-verify"  (email)
 *                            → "password"      (phone)
 */
export default function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState("identifier"); // "identifier" | "otp-verify" | "password"

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const isEmail = identifier.includes("@");

  // ── Step 1: Submit identifier ────────────────────────────────────────────────
  async function handleIdentifierSubmit(e) {
    e.preventDefault();
    if (!identifier.trim()) return;
    setError("");
    setInfo("");

    if (isEmail) {
      // Email → send OTP to inbox
      setBusy(true);
      try {
        const res = await api.post("/api/auth/otp/send", { identifier: identifier.trim() });
        setInfo(res.data.message);
        setStep("otp-verify");
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to send OTP. Please try again.");
      } finally {
        setBusy(false);
      }
    } else {
      // Phone → show password field
      setStep("password");
    }
  }

  // ── Step 2a: Verify OTP (email login) ───────────────────────────────────────
  async function handleOtpVerify(e) {
    e.preventDefault();
    if (code.length !== 6) return;
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/api/auth/otp/verify", {
        identifier: identifier.trim(),
        code: code.trim()
      });
      setAuth(res.data.token, res.data.user);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ── Resend OTP ───────────────────────────────────────────────────────────────
  async function handleResend() {
    setError("");
    setInfo("");
    setCode("");
    setBusy(true);
    try {
      const res = await api.post("/api/auth/otp/send", { identifier: identifier.trim() });
      setInfo("New OTP sent. " + res.data.message);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not resend OTP.");
    } finally {
      setBusy(false);
    }
  }

  // ── Step 2b: Password login (phone) ─────────────────────────────────────────
  async function handlePasswordLogin(e) {
    e.preventDefault();
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

  // ── Reset to step 1 ──────────────────────────────────────────────────────────
  function goBack() {
    setStep("identifier");
    setCode("");
    setPassword("");
    setError("");
    setInfo("");
  }

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5, md: 5 } }}>
        <Stack spacing={{ xs: 2, sm: 2.5 }}>

          {/* Header */}
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontSize: { xs: 22, sm: 24 } }}>
              {step === "otp-verify" ? "Enter your code" : step === "password" ? "Enter your password" : "Log in"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step === "identifier" && "Enter your email address or phone number to continue."}
              {step === "otp-verify" && `We sent a 6-digit code to ${identifier}. Check your inbox.`}
              {step === "password" && `Welcome back! Enter the password for ${identifier}.`}
            </Typography>
          </Stack>

          <Divider />

          {/* Alerts */}
          {error && <Alert severity="error">{error}</Alert>}
          {info  && <Alert severity="success">{info}</Alert>}

          {/* ── STEP 1: Identifier input ── */}
          {step === "identifier" && (
            <Box component="form" onSubmit={handleIdentifierSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Email or phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@email.com  or  +91XXXXXXXXXX"
                  autoComplete="username"
                  autoFocus
                  helperText={
                    isEmail
                      ? "📧 Email detected — you'll receive a one-time code"
                      : identifier
                        ? "📱 Phone detected — you'll enter your password next"
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

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={busy || !identifier.trim()}
                  startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {busy ? "Please wait…" : "Continue"}
                </Button>
              </Stack>
            </Box>
          )}

          {/* ── STEP 2a: OTP verification (email) ── */}
          {step === "otp-verify" && (
            <Box component="form" onSubmit={handleOtpVerify}>
              <Stack spacing={2.5}>
                {/* Show which email we sent to */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <MailOutlineIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  <Chip label={identifier} size="small" variant="outlined" />
                </Stack>

                <TextField
                  label="6-digit OTP"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="_ _ _ _ _ _"
                  inputProps={{
                    inputMode: "numeric",
                    maxLength: 6,
                    style: { letterSpacing: "0.35em", fontSize: 24, textAlign: "center" }
                  }}
                  autoFocus
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={busy || code.length !== 6}
                  startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {busy ? "Verifying…" : "Verify & Log in"}
                </Button>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Button
                    size="small"
                    onClick={goBack}
                    sx={{ textTransform: "none" }}
                  >
                    ← Change email
                  </Button>
                  <Button
                    size="small"
                    onClick={handleResend}
                    disabled={busy}
                    sx={{ textTransform: "none" }}
                  >
                    Resend OTP
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {/* ── STEP 2b: Password (phone) ── */}
          {step === "password" && (
            <Box component="form" onSubmit={handlePasswordLogin}>
              <Stack spacing={2.5}>
                {/* Show which phone we are logging in */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <PhoneAndroidIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  <Chip label={identifier} size="small" variant="outlined" />
                </Stack>

                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  autoFocus
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
                  disabled={busy || !password}
                  startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {busy ? "Signing in…" : "Log in"}
                </Button>

                <Button
                  size="small"
                  onClick={goBack}
                  sx={{ textTransform: "none", alignSelf: "flex-start" }}
                >
                  ← Change phone number
                </Button>
              </Stack>
            </Box>
          )}

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
