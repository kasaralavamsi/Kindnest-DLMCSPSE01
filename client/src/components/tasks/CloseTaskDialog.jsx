import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  Alert,
  Typography
} from "@mui/material";
import Rating from "@mui/material/Rating";
import api from "../../api/http";

export default function CloseTaskDialog({ open, onClose, task, onClosed }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [tipAmount, setTipAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!task?._id) return;
    setError("");
    setBusy(true);
    try {
      const res = await api.post(`/api/tasks/${task._id}/close`, {
        rating,
        review,
        tipAmount: Number(tipAmount) || 0
      });
      onClosed?.(res.data.task);
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to close task");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => (!busy ? onClose?.() : null)} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>Close task + review</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Typography sx={{ fontWeight: 800 }}>{task?.title}</Typography>

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Rating
            </Typography>
            <Rating
              value={rating}
              onChange={(e, v) => setRating(v || 1)}
              size="large"
            />
          </Stack>

          <TextField
            label="Review (optional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            multiline
            minRows={3}
            inputProps={{ maxLength: 1000 }}
          />

          <TextField
            label="Tip amount (optional)"
            type="number"
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
            inputProps={{ min: 0, max: 500, step: 1 }}
            helperText="Optional thank-you tip. (For MVP this is just stored, not paid.)"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => (!busy ? onClose?.() : null)} variant="outlined">
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy} variant="contained" color="secondary">
          {busy ? "Closing..." : "Close task"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}