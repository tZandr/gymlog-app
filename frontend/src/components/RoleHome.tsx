import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Home from "../pages/Home";

export function RoleHome() {
  const { profile } = useAuth();

  if (profile?.role === "coach") {
    return <Navigate to="/coach/clients" replace />;
  }

  return <Home />;
}
