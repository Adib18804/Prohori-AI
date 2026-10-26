import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Landing from "./Landing";

export default function LandingOrDashboard() {
  const { isAuthenticated, isAdmin, isSuperAdmin } = useAuth();

  if (isAuthenticated) {
    // Super‑admin or any admin → admin UI
    if (isSuperAdmin || isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    // Regular user → normal dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Not logged in → public landing page
  return <Landing />;
}
