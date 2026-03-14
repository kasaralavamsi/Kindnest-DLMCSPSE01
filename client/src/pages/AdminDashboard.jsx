import { useEffect, useState } from "react";
import {
  Stack,
  Typography,
  Tabs,
  Tab,
  Divider,
  Alert,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import api from "../api/http";

export default function AdminDashboard() {
  const [tab, setTab] = useState(0); // 0=Overview, 1=Users, 2=Tasks
  const [error, setError] = useState("");

  const [stats, setStats] = useState(null);

  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const [tasks, setTasks] = useState([]);
  const [taskStatus, setTaskStatus] = useState("");
  const [taskCategory, setTaskCategory] = useState("");
  const [archived, setArchived] = useState("active"); // active | archived | all

  async function loadStats() {
    setError("");
    try {
      const res = await api.get("/api/admin/stats");
      setStats(res.data.stats);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load stats");
    }
  }

  async function loadUsers() {
    setError("");
    try {
      const params = new URLSearchParams();
      if (userRole) params.set("role", userRole);
      if (userSearch.trim()) params.set("search", userSearch.trim());
      const res = await api.get(`/api/admin/users?${params.toString()}`);
      setUsers(res.data.users || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load users");
    }
  }

  async function loadTasks() {
    setError("");
    try {
      const params = new URLSearchParams();
      if (taskStatus) params.set("status", taskStatus);
      if (taskCategory) params.set("category", taskCategory);
      params.set("archived", archived);

      const res = await api.get(`/api/admin/tasks?${params.toString()}`);
      setTasks(res.data.tasks || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load tasks");
    }
  }

  async function changeRole(userId, role) {
    setError("");
    try {
      const res = await api.patch(`/api/admin/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u._id === res.data.user._id ? res.data.user : u)));
    } catch (e) {
      setError(e?.response?.data?.error || "Role update failed");
    }
  }

  async function archiveTask(taskId) {
    setError("");
    try {
      await api.post(`/api/admin/tasks/${taskId}/archive`);
      loadStats();
      loadTasks();
    } catch (e) {
      setError(e?.response?.data?.error || "Archive failed");
    }
  }

  async function unarchiveTask(taskId) {
    setError("");
    try {
      await api.post(`/api/admin/tasks/${taskId}/unarchive`);
      loadStats();
      loadTasks();
    } catch (e) {
      setError(e?.response?.data?.error || "Unarchive failed");
    }
  }

  async function reopenTask(taskId) {
    setError("");
    try {
      await api.post(`/api/admin/tasks/${taskId}/reopen`);
      loadStats();
      loadTasks();
    } catch (e) {
      setError(e?.response?.data?.error || "Reopen failed");
    }
  }

  useEffect(() => {
    loadStats();
    loadUsers();
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack spacing={2.25}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <Stack spacing={0.25}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Admin Panel
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage users, moderate tasks, and monitor platform activity.
          </Typography>
        </Stack>

        <Button variant="outlined" onClick={() => (loadStats(), loadUsers(), loadTasks())} sx={{ width: { xs: "100%", sm: "auto" } }}>
          Refresh
        </Button>
      </Stack>

      <Tabs value={tab} onChange={(e, v) => setTab(v)}>
        <Tab label="OVERVIEW" />
        <Tab label="USERS" />
        <Tab label="TASKS" />
      </Tabs>

      <Divider />

      {error && <Alert severity="error">{error}</Alert>}

      {/* OVERVIEW */}
      {tab === 0 ? (
        !stats ? (
          <Alert severity="info">Loading overview…</Alert>
        ) : (
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Platform Overview</Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Total Users</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 24 }}>{stats.totalUsers}</Typography>
                </CardContent>
              </Card>
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Requesters</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 24 }}>{stats.roleCounts.requester}</Typography>
                </CardContent>
              </Card>
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Volunteers</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 24 }}>{stats.roleCounts.volunteer}</Typography>
                </CardContent>
              </Card>
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Admins</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 24 }}>{stats.roleCounts.admin}</Typography>
                </CardContent>
              </Card>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Total Tasks</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 24 }}>{stats.totalTasks}</Typography>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Archived Tasks</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 24 }}>{stats.archivedTasks}</Typography>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Closed</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 24 }}>{stats.statusCounts.CLOSED}</Typography>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Avg Rating</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 24 }}>
                    {stats.avgRating ? `${stats.avgRating} / 5` : "-"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    from {stats.ratedTasks} reviews
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Stack>
        )
      ) : null}

      {/* USERS */}
      {tab === 1 ? (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
            <TextField select label="Role" value={userRole} onChange={(e) => setUserRole(e.target.value)} sx={{ minWidth: { sm: 180 } }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="requester">requester</MenuItem>
              <MenuItem value="volunteer">volunteer</MenuItem>
              <MenuItem value="admin">admin</MenuItem>
            </TextField>

            <TextField label="Search" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} sx={{ flex: 1 }} />

            <Button variant="contained" onClick={loadUsers} sx={{ width: { xs: "100%", sm: "auto" } }}>
              Apply
            </Button>
          </Stack>

          <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><b>Name</b></TableCell>
                  <TableCell><b>Email</b></TableCell>
                  <TableCell><b>Phone</b></TableCell>
                  <TableCell><b>Role</b></TableCell>
                  <TableCell align="right"><b>Set Role</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id} hover>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email || "-"}</TableCell>
                    <TableCell>{u.phone || "-"}</TableCell>
                    <TableCell><Chip size="small" label={u.role} /></TableCell>
                    <TableCell align="right">
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => changeRole(u._id, "requester")}>requester</Button>
                        <Button size="small" variant="outlined" onClick={() => changeRole(u._id, "volunteer")}>volunteer</Button>
                        <Button size="small" variant="contained" color="secondary" onClick={() => changeRole(u._id, "admin")}>admin</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 ? (
                  <TableRow><TableCell colSpan={5}><Alert severity="info">No users found.</Alert></TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      ) : null}

      {/* TASKS */}
      {tab === 2 ? (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
            <TextField select label="Status" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} sx={{ minWidth: { sm: 160 } }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="OPEN">OPEN</MenuItem>
              <MenuItem value="ACCEPTED">ACCEPTED</MenuItem>
              <MenuItem value="DONE">DONE</MenuItem>
              <MenuItem value="CLOSED">CLOSED</MenuItem>
            </TextField>

            <TextField select label="Category" value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} sx={{ minWidth: { sm: 160 } }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="grocery">grocery</MenuItem>
              <MenuItem value="pharmacy">pharmacy</MenuItem>
              <MenuItem value="companionship">companionship</MenuItem>
              <MenuItem value="transport">transport</MenuItem>
              <MenuItem value="household">household</MenuItem>
              <MenuItem value="other">other</MenuItem>
            </TextField>

            <TextField select label="Archived" value={archived} onChange={(e) => setArchived(e.target.value)} sx={{ minWidth: { sm: 160 } }}>
              <MenuItem value="active">Active only</MenuItem>
              <MenuItem value="archived">Archived only</MenuItem>
              <MenuItem value="all">All</MenuItem>
            </TextField>

            <Button variant="contained" onClick={loadTasks} sx={{ width: { xs: "100%", sm: "auto" } }}>
              Apply
            </Button>
          </Stack>

          <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><b>Title</b></TableCell>
                  <TableCell><b>Status</b></TableCell>
                  <TableCell><b>Requester</b></TableCell>
                  <TableCell><b>Volunteer</b></TableCell>
                  <TableCell><b>Archived</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t._id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 900, fontSize: 13.5 }}>{t.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{new Date(t.createdAt).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell><Chip size="small" label={t.status} /></TableCell>
                    <TableCell>{t.requesterId?.name || "-"}</TableCell>
                    <TableCell>{t.volunteerId?.name || "-"}</TableCell>
                    <TableCell>{t.isArchived ? "Yes" : "No"}</TableCell>
                    <TableCell align="right">
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
                        <Button component={RouterLink} to={`/app/tasks/${t._id}`} size="small" variant="outlined">
                          View
                        </Button>

                        {!t.isArchived ? (
                          <Button size="small" variant="contained" color="secondary" onClick={() => archiveTask(t._id)}>
                            Archive
                          </Button>
                        ) : (
                          <Button size="small" variant="outlined" onClick={() => unarchiveTask(t._id)}>
                            Unarchive
                          </Button>
                        )}

                        {["ACCEPTED", "DONE"].includes(t.status) && !t.isArchived ? (
                          <Button size="small" variant="outlined" onClick={() => reopenTask(t._id)}>
                            Reopen
                          </Button>
                        ) : null}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {tasks.length === 0 ? (
                  <TableRow><TableCell colSpan={6}><Alert severity="info">No tasks match filters.</Alert></TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      ) : null}
    </Stack>
  );
}