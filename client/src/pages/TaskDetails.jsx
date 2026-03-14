import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Stack,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  Button,
  Box
} from "@mui/material";
import api from "../api/http";
import { getCachedUser } from "../auth/storage";
import CloseTaskDialog from "../components/tasks/CloseTaskDialog";

function categoryLabel(category) {
  const map = {
    grocery: "Grocery",
    pharmacy: "Pharmacy",
    companionship: "Companionship",
    transport: "Transport",
    household: "Household",
    other: "Other"
  };
  return map[category] || "Other";
}

function statusLabel(status, role) {
  if (status === "DONE" && role === "requester") return "AWAITING CONFIRMATION";
  return status;
}

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString();
}

function minutesBetween(a, b) {
  if (!a || !b) return null;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.round(ms / 60000);
}

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getCachedUser();

  const [task, setTask] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [closeOpen, setCloseOpen] = useState(false);

  async function load() {
    setError("");
    setBusy(true);
    try {
      const res = await api.get(`/api/tasks/${id}`);
      setTask(res.data.task);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load task");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const metrics = useMemo(() => {
    if (!task) return {};
    return {
      acceptToDoneMin: minutesBetween(task.acceptedAt, task.doneAt),
      doneToCloseMin: minutesBetween(task.doneAt, task.closedAt),
      totalToCloseMin: minutesBetween(task.createdAt, task.closedAt)
    };
  }, [task]);

  async function accept() {
    setError("");
    try {
      const res = await api.post(`/api/tasks/${task._id}/accept`);
      setTask(res.data.task);
    } catch (e) {
      setError(e?.response?.data?.error || "Accept failed");
    }
  }

  async function reject() {
    setError("");
    try {
      const res = await api.post(`/api/tasks/${task._id}/reject`);
      setTask(res.data.task);
    } catch (e) {
      setError(e?.response?.data?.error || "Reject failed");
    }
  }

  async function markDone() {
    setError("");
    try {
      const res = await api.post(`/api/tasks/${task._id}/done`);
      setTask(res.data.task);
    } catch (e) {
      setError(e?.response?.data?.error || "Mark done failed");
    }
  }

  function onClosed(updated) {
    setTask(updated);
  }

  const canVolunteerAccept = user?.role === "volunteer" && task?.status === "OPEN";
  const canVolunteerActions = user?.role === "volunteer" && task?.status === "ACCEPTED";
  const canRequesterClose = user?.role === "requester" && task?.status === "DONE";

  return (
    <Stack spacing={2.25}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.25}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack spacing={0.5}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Task Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review the timeline and take the next action.
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" onClick={() => navigate(-1)} fullWidth>
            Back
          </Button>
          <Button variant="outlined" onClick={load} disabled={busy} fullWidth>
            {busy ? "Refreshing..." : "Refresh"}
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {!task ? (
        <Alert severity="info">Loading task...</Alert>
      ) : (
        <>
          {/* Summary */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5, md: 4 } }}>
              <Stack spacing={1.25}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: { xs: 18, sm: 20 } }}>
                    {task.title}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small" label={categoryLabel(task.category)} />
                    <Chip
                      size="small"
                      color={task.status === "CLOSED" ? "default" : "primary"}
                      label={statusLabel(task.status, user?.role)}
                      variant={task.status === "CLOSED" ? "outlined" : "filled"}
                    />
                  </Stack>
                </Stack>

                {task.description ? (
                  <Typography color="text.secondary">{task.description}</Typography>
                ) : null}

                <Divider />

                {/* Key details */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 1
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Requester: <b>{task.requesterId?.name || "Unknown"}</b>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Volunteer: <b>{task.volunteerId?.name || "-"}</b>
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Created: <b>{fmtDate(task.createdAt)}</b>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Needed by: <b>{fmtDate(task.neededBy)}</b>
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Accepted: <b>{fmtDate(task.acceptedAt)}</b>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Done: <b>{fmtDate(task.doneAt)}</b>
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Closed: <b>{fmtDate(task.closedAt)}</b>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rating: <b>{task.rating || "-"}</b>
                  </Typography>
                </Box>

                <Divider />

                {/* Metrics */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                    gap: 1
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Accept → Done: <b>{metrics.acceptToDoneMin ?? "-"} min</b>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Done → Close: <b>{metrics.doneToCloseMin ?? "-"} min</b>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total → Close: <b>{metrics.totalToCloseMin ?? "-"} min</b>
                  </Typography>
                </Box>

                {/* Actions */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                  {canVolunteerAccept ? (
                    <Button variant="contained" onClick={accept} fullWidth>
                      Accept
                    </Button>
                  ) : null}

                  {canVolunteerActions ? (
                    <>
                      <Button variant="contained" onClick={markDone} fullWidth>
                        Mark Done
                      </Button>
                      <Button variant="outlined" onClick={reject} fullWidth>
                        Reject
                      </Button>
                    </>
                  ) : null}

                  {canRequesterClose ? (
                    <Button variant="contained" color="secondary" onClick={() => setCloseOpen(true)} fullWidth>
                      Confirm + Close
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5, md: 4 } }}>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Timeline</Typography>

              {!task.history?.length ? (
                <Alert severity="info">No timeline events.</Alert>
              ) : (
                <Stack spacing={1}>
                  {task.history
                    .slice()
                    .reverse()
                    .map((h, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                          p: 1.5
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={0.5}
                          justifyContent="space-between"
                        >
                          <Typography sx={{ fontWeight: 800 }}>{h.action}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {fmtDate(h.at)}
                          </Typography>
                        </Stack>

                        <Typography variant="body2" color="text.secondary">
                          By: <b>{h.byUserId?.name || "Unknown"}</b>{" "}
                          {h.byUserId?.role ? `(${h.byUserId.role})` : ""}
                        </Typography>
                      </Box>
                    ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          <CloseTaskDialog
            open={closeOpen}
            onClose={() => setCloseOpen(false)}
            task={task}
            onClosed={onClosed}
          />
        </>
      )}
    </Stack>
  );
}