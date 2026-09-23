import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function RequireRole({ role }: { role: "coach" | "client" }) {
  const { profile, loading } = useAuth();

  if (loading) return null;
  if (profile?.role !== role) return <Navigate to="/" replace />;

  return <Outlet />;
}
