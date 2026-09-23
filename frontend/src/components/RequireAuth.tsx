import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { hasAccount } from "../lib/accountFlag";

export function RequireAuth() {
  const { user, profile, loading, refresh } = useAuth();
  const { pathname } = useLocation();

  if (loading) return null;

  // First-time visitors have to create an account; returning ones go to log in.
  if (!user) return <Navigate to={hasAccount() ? "/login" : "/signup"} replace />;

  if (!profile) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="display">Something went wrong</h1>
          <p>We couldn&apos;t load your profile.</p>
          <button type="button" onClick={() => void refresh()}>Try again</button>
        </div>
      </div>
    );
  }

  // Everyone needs a unique @username (existing accounts pick one on their next visit).
  if (!profile.username && pathname !== "/username") return <Navigate to="/username" replace />;

  return <Outlet />;
}
