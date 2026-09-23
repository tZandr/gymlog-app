import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// UI convenience only: the admin_* database functions re-check the admin flag themselves.
export function RequireAdmin() {
  const { profile, loading } = useAuth();

  if (loading) return null;
  if (!profile?.isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
