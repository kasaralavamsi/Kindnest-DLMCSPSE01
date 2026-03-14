import { useEffect, useState } from "react";
import { Stack, Typography, Button, Alert, Divider, Tabs, Tab } from "@mui/material";
import api from "../api/http";
import TaskCard from "../components/tasks/TaskCard";

export default function VolunteerDashboard() {
  const [tab, setTab] = useState(0); // 0=Available, 1=Assigned
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setError("");
    setBusy(true);
    try {
      const endpoint =
        tab === 0 ? "/api/tasks?scope=available" : "/api/tasks?scope=assigned";
      const res = await api.get(endpoint);
      setTasks(res.data.tasks || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load tasks");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, [tab]);

  async function accept(task) {
    try {
      await api.post(`/api/tasks/${task._id}/accept`);
      load();
    } catch (e) {
      setError(e?.response?.data?.error || "Accept failed");
    }
  }

  async function reject(task) {
    try {
      await api.post(`/api/tasks/${task._id}/reject`);
      load();
    } catch (e) {
      setError(e?.response?.data?.error || "Reject failed");
    }
  }

  async function done(task) {
    try {
      await api.post(`/api/tasks/${task._id}/done`);
      load();
    } catch (e) {
      setError(e?.response?.data?.error || "Mark done failed");
    }
  }

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
            Volunteer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accept open tasks, complete them, or reject if unavailable.
          </Typography>
        </Stack>

        <Button variant="outlined" onClick={load} disabled={busy} fullWidth sx={{ width: { xs: "100%", sm: "auto" } }}>
          {busy ? "Refreshing..." : "Refresh"}
        </Button>
      </Stack>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth">
        <Tab label="Available Tasks" />
        <Tab label="My Assigned" />
      </Tabs>

      <Divider />

      {error && <Alert severity="error">{error}</Alert>}

      {tasks.length === 0 ? (
        <Alert severity="info">
          {tab === 0 ? "No open tasks right now." : "No assigned tasks yet."}
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              mode="volunteer"
              onAccept={accept}
              onReject={reject}
              onDone={done}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}