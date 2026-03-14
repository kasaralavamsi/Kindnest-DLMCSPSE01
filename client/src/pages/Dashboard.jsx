import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCachedUser } from "../auth/storage";
import { Alert } from "@mui/material";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCachedUser();

  useEffect(() => {
    if (!user?.role) return;
    if (user.role === "volunteer") navigate("/app/volunteer", { replace: true });
    else if (user.role === "requester") navigate("/app/requester", { replace: true });
    else if (user.role === "admin") navigate("/app/admin", { replace: true });
    else navigate("/app/requester", { replace: true });
  }, [navigate, user?.role]);

  return <Alert severity="info">Loading dashboard...</Alert>;
}
