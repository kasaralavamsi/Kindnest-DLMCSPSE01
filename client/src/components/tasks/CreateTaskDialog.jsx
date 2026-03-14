import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  MenuItem,
  Alert
} from "@mui/material";
import api from "../../api/http";

const categories = [
  { value: "grocery", label: "Grocery" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "companionship", label: "Companionship" },
  { value: "transport", label: "Transport" },
  { value: "household", label: "Household" },
  { value: "other", label: "Other" }
];

export default function CreateTaskDialog({ open, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [neededBy, setNeededBy] = useState(""); // datetime-local
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setCategory("other");
    setNeededBy("");
    setError("");
  }

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const payload = {
        title,
        description,
        category,
        neededBy: neededBy ? new Date(neededBy).toISOString() : null
      };
      const res = await api.post("/api/tasks", payload);
      onCreated?.(res.data.task);
      reset();
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to create task");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => (!busy ? onClose?.() : null)} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>Create a task request</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Pick up groceries"
            inputProps={{ maxLength: 120 }}
          />

          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            inputProps={{ maxLength: 2000 }}
            placeholder="Add helpful details (address, notes, preferred store, etc.)"
          />

          <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Needed by (optional)"
            type="datetime-local"
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => (!busy ? (reset(), onClose?.()) : null)} variant="outlined">
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy || title.trim().length < 3} variant="contained">
          {busy ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}