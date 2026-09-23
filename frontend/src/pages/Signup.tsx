import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { isUsernameAvailable, normalizeUsername, validateUsername } from "../api/username";
import { AuthShell } from "../components/platform/AuthShell";
import { UsernameField } from "../components/platform/UsernameField";

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const formatError = validateUsername(username);
    if (formatError) {
      setError(formatError);
      return;
    }

    setSubmitting(true);
    try {
      const name = normalizeUsername(username);
      if (!(await isUsernameAvailable(name))) {
        setError(`@${name} is taken`);
        return;
      }
      // The username rides along as signup metadata; a database trigger stores it on the profile.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: name } },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) navigate("/", { replace: true });
      else setCheckEmail(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkEmail) {
    return (
      <AuthShell title="Check your email">
        <p>Confirm your account, then log in.</p>
        <Link to="/login">Go to log in</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account">
      <form onSubmit={handleSubmit}>
        <UsernameField value={username} onChange={setUsername} />
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>
        <p className="auth-card__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
