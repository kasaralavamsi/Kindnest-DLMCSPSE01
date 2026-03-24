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
import { Link as RouterLink, useNavigate } from "react-router-dom";
import api from "../api/http";
import { setAuth } from "../auth/storage";

/**
 * OtpLogin – standalone email-only passwordless login page at /otp-login.
 *
 * Note: The main /login page also handles the email OTP flow inline.
 * This page is kept as a direct entry-point for users who bookmark it.
 *
 * Step 1 – "send":    user enters email → POST /api/auth/otp/send
 * Step 2 – "verify":  user enters 6-digit OTP → POST /api/auth/otp/verify → JWT
 */
export default function OtpLogin() {
  const navigate = useNavigate();

  const [step, setStep] = useState("send"); // "send" | "verify"

  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  async function handleSend(e) {
    e.preventDefault();
    if (!identifier.trim()) return;
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const res = await api.post("/api/auth/otp/send", { identifier: identifier.trim() });
      setInfo(res.data.message);
      setStep("verify");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  async function handleVerify(e) {
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

  // ── Resend OTP ──────────────────────────────────────────────────────────────
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

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5, md: 5 } }}>
        <Stack spacing={{ xs: 2, sm: 2.5 }}>

          {/* Header */}
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontSize: { xs: 22, sm: 24 } }}>
              {step === "send" ? "Log in with OTP" : "Enter your code"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step === "send"
                ? "Enter your email address and we'll send you a one-time login code."
                : <>We sent a 6-digit code to <strong>{identifier}</strong>. Check your inbox.</>}
            </Typography>
          </Stack>

          <Divider />

          {/* Alerts */}
          {error && <Alert severity="error">{error}</Alert>}
          {info  && <Alert severity="success">{info}</Alert>}

          {/* ── Step 1: Email input ── */}
          {step === "send" && (
            <Box component="form" onSubmit={handleSend}>
              <Stack spacing={2.5}>
                <TextField
                  label="Email address"
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@email.com"
                  autoComplete="email"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlineIcon fontSize="small" sx={{ color: "text.secondary" }} />
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
                  {busy ? "Sending…" : "Send OTP"}
                </Button>
              </Stack>
            </Box>
          )}

          {/* ── Step 2: OTP verification ── */}
          {step === "verify" && (
            <Box component="form" onSubmit={handleVerify}>
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
                    onClick={() => { setStep("send"); setCode(""); setError(""); setInfo(""); }}
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

          <Divider />

          {/* Footer links */}
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Using a phone number?{" "}
              <Box
                component={RouterLink}
                to="/login"
                sx={{ color: "primary.main", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Log in with password
              </Box>
            </Typography>

            <Typography variant="body2" color="text.secondary">
              New here?{" "}
              <Box
                component={RouterLink}
                to="/register"
                sx={{ color: "primary.main", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
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
