import { useEffect, useMemo, useRef, useState } from "react";
import { Stack, Typography, Button, Alert, Divider, Tabs, Tab } from "@mui/material";
import api from "../api/http";
import TaskCard from "../components/tasks/TaskCard";
import CreateTaskDialog from "../components/tasks/CreateTaskDialog";
import CloseTaskDialog from "../components/tasks/CloseTaskDialog";

export default function RequesterDashboard() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState(0); // 0=Active, 1=Awaiting, 2=Closed, 3=All

  const [createOpen, setCreateOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const inFlight = useRef(false);

  async function load({ silent = false } = {}) {
    if (inFlight.current) return;
    inFlight.current = true;

    if (!silent) {
      setError("");
      setBusy(true);
    }

    try {
      const res = await api.get("/api/tasks?scope=mine");
      setTasks(res.data.tasks || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load tasks");
    } finally {
      inFlight.current = false;
      if (!silent) setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Auto-refresh every 10s so volunteer updates appear without manual refresh
  useEffect(() => {
    const id = setInterval(() => load({ silent: true }), 10000);
    return () => clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    const active = tasks.filter((t) => t.status !== "CLOSED").length;
    const awaiting = tasks.filter((t) => t.status === "DONE").length;
    const closed = tasks.filter((t) => t.status === "CLOSED").length;
    return { active, awaiting, closed, all: tasks.length };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (tab === 0) return tasks.filter((t) => t.status !== "CLOSED"); // Active includes OPEN/ACCEPTED/DONE
    if (tab === 1) return tasks.filter((t) => t.status === "DONE"); // Awaiting confirmation
    if (tab === 2) return tasks.filter((t) => t.status === "CLOSED");
    return tasks; // All
  }, [tasks, tab]);

  function onCreated(newTask) {
    setTasks((prev) => [newTask, ...prev]);
  }

  function onClosed(updated) {
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
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
            My Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            DONE = awaiting your confirmation. CLOSED = completed.
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button variant="outlined" onClick={() => load()} disabled={busy} fullWidth>
            {busy ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="contained" onClick={() => setCreateOpen(true)} fullWidth>
            Create Task
          </Button>
        </Stack>
      </Stack>

      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        <Tab label={`Active (${counts.active})`} />
        <Tab label={`Awaiting confirmation (${counts.awaiting})`} />
        <Tab label={`Closed (${counts.closed})`} />
        <Tab label={`All (${counts.all})`} />
      </Tabs>

      <Divider />

      {error && <Alert severity="error">{error}</Alert>}

      {filteredTasks.length === 0 ? (
        <Alert severity="info">
          {tab === 1
            ? "No tasks awaiting confirmation."
            : tab === 2
            ? "No closed tasks yet."
            : "No tasks yet. Create your first request."}
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              mode="requester"
              onClose={(t) => {
                setSelectedTask(t);
                setCloseOpen(true);
              }}
            />
          ))}
        </Stack>
      )}

      <CreateTaskDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={onCreated} />

      <CloseTaskDialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        task={selectedTask}
        onClosed={onClosed}
      />
    </Stack>
  );
}