import { Navigate } from "react-router-dom";
import { getCachedUser } from "./storage";

export default function RequireRole({ roles, children }) {
  const user = getCachedUser();

  // No user cached -> send to login
  if (!user?.role) return <Navigate to="/login" replace />;

  // If role is allowed, render children
  if (roles.includes(user.role)) return children;

  // Role mismatch -> redirect to the user's correct dashboard
  const fallback =
    user.role === "volunteer"
      ? "/app/volunteer"
      : user.role === "admin"
      ? "/app/admin"
      : "/app/requester";

  return <Navigate to={fallback} replace />;
}
