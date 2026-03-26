/**
 * App.jsx
 *
 * CHANGED FROM ORIGINAL:
 *  - Removed OtpLogin import and the /otp-login route (OTP flow dropped entirely).
 *
 * Path: client/src/App.jsx
 */

import { Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";
import AppLayout from "./layouts/AppLayout";
import RequireAuth from "./auth/RequireAuth";
import RequireRole from "./auth/RequireRole";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import RequesterDashboard from "./pages/RequesterDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TaskDetails from "./pages/TaskDetails";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
      {/* /otp-login removed — redirect anyone who bookmarked it */}
      <Route path="/otp-login" element={<Navigate to="/login" replace />} />

      {/* Protected (navbar lives in AppLayout) */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        {/* Smart redirect by role */}
        <Route path="/app" element={<Dashboard />} />

        {/* Task details – accessible to any authenticated user */}
        <Route path="/app/tasks/:id" element={<TaskDetails />} />

        {/* Role dashboards */}
        <Route
          path="/app/requester"
          element={
            <RequireRole roles={["requester", "admin"]}>
              <RequesterDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/app/volunteer"
          element={
            <RequireRole roles={["volunteer", "admin"]}>
              <VolunteerDashboard />
            </RequireRole>
          }
        />

        {/* Admin panel */}
        <Route
          path="/app/admin"
          element={
            <RequireRole roles={["admin"]}>
              <AdminDashboard />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
