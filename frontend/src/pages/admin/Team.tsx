import { useEffect, useState } from "react";
import { cancelAdminInvite, inviteAdmin, listAdmins, removeAdmin } from "../../api/admin";
import { normalizeUsername, validateUsername } from "../../api/username";
import { useAuth } from "../../hooks/useAuth";
import type { IAdminMember } from "../../types/Platform";

export default function AdminTeam() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<IAdminMember[]>([]);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [reload, setReload] = useState(0);

  useEffect(() => {
    listAdmins()
      .then(setMembers)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load"));
  }, [reload]);

  async function act(action: () => Promise<void>) {
    setError(null);
    setNotice(null);
    try {
      await action();
      setReload((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const formatError = validateUsername(username);
    if (formatError) {
      setError(formatError);
      return;
    }
    setBusy(true);
    await act(async () => {
      await inviteAdmin(username);
      setNotice(`Invite sent to @${normalizeUsername(username)}. They accept it in their Settings.`);
      setUsername("");
    });
    setBusy(false);
  }

  return (
    <div className="stack">
      <div className="row row--between">
        <h1 className="display page-title">Admin team</h1>
        <span className="chip chip--accent">Restricted · admin role only</span>
      </div>
      {error && <p className="form-error">{error}</p>}
      {notice && <p className="form-notice">{notice}</p>}

      <section className="card stack stack--tight">
        <h2 className="card__title">Admins</h2>
        {members.map((m) => (
          <div key={`${m.id}-${m.status}`} className="row row--between member-row">
            <div className="stack stack--tight">
              <strong>@{m.username}</strong>
              <span className="muted small">{m.status === "pending" ? "Invite pending" : m.username === profile?.username ? "Admin · you" : "Admin"}</span>
            </div>
            {m.status === "pending" ? (
              <button type="button" className="btn-small" onClick={() => void act(() => cancelAdminInvite(m.username))}>Cancel invite</button>
            ) : m.username !== profile?.username ? (
              <button type="button" className="btn-small" onClick={() => { if (window.confirm(`Remove @${m.username} as an admin?`)) void act(() => removeAdmin(m.username)); }}>Remove</button>
            ) : null}
          </div>
        ))}
      </section>

      <form className="card stack stack--tight" onSubmit={handleInvite}>
        <div>
          <h2 className="card__title">Invite an admin</h2>
          <p className="muted">They need an account first. Admins can grant and revoke coach plans and invite other admins.</p>
        </div>
        <div className="row row--end">
          <label className="grow">
            Username
            <span className="at-input">
              <span className="at-input__at">@</span>
              <input type="text" value={username.replace(/^@+/, "")} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" spellCheck={false} required />
            </span>
          </label>
          <button type="submit" className="btn-primary" disabled={busy}>Send admin invite</button>
        </div>
      </form>
    </div>
  );
}
