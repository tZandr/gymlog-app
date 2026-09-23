import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { setUsername as saveUsername, validateUsername } from "../api/username";
import { useAuth } from "../hooks/useAuth";
import { AuthShell } from "../components/platform/AuthShell";
import { UsernameField } from "../components/platform/UsernameField";

// Shown to accounts that don't have a @username yet (created before usernames existed,
// or whose chosen name was taken at the last moment).
export default function ChooseUsername() {
  const { profile, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (profile?.username) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formatError = validateUsername(username);
    if (formatError) {
      setError(formatError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await saveUsername(username);
      await refresh();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your username");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Pick your @username">
      <form onSubmit={handleSubmit}>
        <p>Your username is how coaches and clients find you. It has to be unique.</p>
        <UsernameField value={username} onChange={setUsername} />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Continue"}
        </button>
        <button type="button" onClick={() => void logout()}>Log out</button>
      </form>
    </AuthShell>
  );
}
