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
  Chip,
  InputAdornment
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/http";
import { setAuth } from "../auth/storage";

/**
 * Register page – smart detection:
 *
 *   Email  →  Step 1: fill name / email / role
 *             Step 2: verify 6-digit OTP sent to inbox
 *             ✓ Account created, JWT issued
 *
 *   Phone  →  One step: name / phone / password / role
 *             ✓ Account created directly, JWT issued
 */
export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultRole = useMemo(() => searchParams.get("role") || "requester", [searchParams]);
  const [role, setRole] = useState(defaultRole);

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  // "form" | "otp-verify"
  const [step, setStep] = useState("form");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const isEmail = identifier.includes("@");

  // ── Step 1: Submit registration form ────────────────────────────────────────
  async function handleFormSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!name.trim() || !identifier.trim()) {
      setError("Please fill in your full name and email / phone number.");
      return;
    }

    if (isEmail) {
      // Email path: send OTP for verification
      setBusy(true);
      try {
        const res = await api.post("/api/auth/otp/register/send", {
          name: name.trim(),
          identifier: identifier.trim(),
          role
        });
        setInfo(res.data.message);
        setStep("otp-verify");
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to send verification code.");
      } finally {
        setBusy(false);
      }
    } else {
      // Phone path: direct registration with password
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
  }

  // ── Step 2: Verify OTP and create email account ──────────────────────────────
  async function handleOtpVerify(e) {
    e.preventDefault();
    if (code.length !== 6) return;
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/api/auth/otp/register/verify", {
        identifier: identifier.trim(),
        code: code.trim(),
        name: name.trim(),
        role
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
      const res = await api.post("/api/auth/otp/register/send", {
        name: name.trim(),
        identifier: identifier.trim(),
        role
      });
      setInfo("New code sent. " + res.data.message);
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
              {step === "otp-verify" ? "Verify your email" : "Create account"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step === "form" && (
                isEmail
                  ? "We'll send a one-time code to verify your email address."
                  : "Fill in your details and create a password."
              )}
              {step === "otp-verify" && (
                <>Enter the 6-digit code sent to <strong>{identifier}</strong>.</>
              )}
            </Typography>
          </Stack>

          <Divider />

          {/* Alerts */}
          {error && <Alert severity="error">{error}</Alert>}
          {info  && <Alert severity="success">{info}</Alert>}

          {/* ── STEP 1: Registration form ── */}
          {step === "form" && (
            <Box component="form" onSubmit={handleFormSubmit}>
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
                      ? "📧 Email — we'll send a one-time verification code"
                      : identifier
                        ? "📱 Phone — create a password below"
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

                {/* Password — only shown for phone users */}
                {!isEmail && (
                  <TextField
                    label="Password (min 8 characters)"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={busy || !name.trim() || !identifier.trim()}
                  startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {busy
                    ? (isEmail ? "Sending code…" : "Creating account…")
                    : (isEmail ? "Send Verification Code" : "Create Account")}
                </Button>
              </Stack>
            </Box>
          )}

          {/* ── STEP 2: OTP verification (email registration only) ── */}
          {step === "otp-verify" && (
            <Box component="form" onSubmit={handleOtpVerify}>
              <Stack spacing={2.5}>
                {/* Show target email */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <MailOutlineIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  <Chip label={identifier} size="small" variant="outlined" />
                </Stack>

                <TextField
                  label="6-digit verification code"
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
                  {busy ? "Creating account…" : "Verify & Create Account"}
                </Button>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Button
                    size="small"
                    onClick={() => { setStep("form"); setCode(""); setError(""); setInfo(""); }}
                    sx={{ textTransform: "none" }}
                  >
                    ← Edit details
                  </Button>
                  <Button
                    size="small"
                    onClick={handleResend}
                    disabled={busy}
                    sx={{ textTransform: "none" }}
                  >
                    Resend code
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

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
