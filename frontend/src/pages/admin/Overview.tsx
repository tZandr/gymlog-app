import { useCallback, useEffect, useState } from "react";
import { getOverview, grantCoach, listUsers, revokeCoach } from "../../api/admin";
import type { IAdminOverview, IAdminUser } from "../../types/Platform";

const pct = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);

function roleOf(u: IAdminUser): string {
  if (u.coachActive) return "Coach";
  if (u.isClient) return "Client";
  return "Neither";
}

export default function AdminOverview() {
  const [overview, setOverview] = useState<IAdminOverview | null>(null);
  const [users, setUsers] = useState<IAdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    try {
      const [o, u] = await Promise.all([getOverview(), listUsers(query)]);
      setOverview(o);
      setUsers(u);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(search), 250);
    return () => clearTimeout(timer);
  }, [load, search]);

  async function act(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
      await load(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const neither = overview ? Math.max(0, overview.total - overview.coaches - overview.clients) : 0;

  return (
    <div className="stack">
      <div className="row row--between">
        <h1 className="display page-title">Admin dashboard</h1>
        <span className="chip chip--accent">Restricted · admin role only</span>
      </div>
      {error && <p className="form-error">{error}</p>}

      <section className="card stack">
        <div className="row row--between row--baseline">
          <h2 className="card__title">Registered users</h2>
          <span className="muted small">Someone who is both a coach and a client is counted as a coach.</span>
        </div>
        {overview ? (
          <div className="overview">
            <div className="overview__total">
              <span className="display overview__number">{overview.total}</span>
              <span className="muted">registered in total</span>
            </div>
            <div className="overview__breakdown">
              <div className="split-bar" role="img" aria-label={`${overview.coaches} coaches, ${overview.clients} clients, ${neither} neither`}>
                <span className="split-bar__seg split-bar__seg--coach" style={{ flexGrow: pct(overview.coaches, overview.total) }} />
                <span className="split-bar__seg split-bar__seg--client" style={{ flexGrow: pct(overview.clients, overview.total) }} />
                <span className="split-bar__seg split-bar__seg--neither" style={{ flexGrow: pct(neither, overview.total) }} />
              </div>
              <div className="row overview__legend">
                <div><span className="legend-dot legend-dot--coach" /> Coaches<span className="display legend-number">{overview.coaches}</span><span className="muted small">With a coach plan</span></div>
                <div><span className="legend-dot legend-dot--client" /> Clients<span className="display legend-number">{overview.clients}</span><span className="muted small">Connected to a coach</span></div>
                <div><span className="legend-dot legend-dot--neither" /> Neither<span className="display legend-number">{neither}</span><span className="muted small">Standalone training log</span></div>
              </div>
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </section>

      {overview && (
        <div className="row stat-row">
          <div className="card grow"><span className="eyebrow">Active coach plans</span><span className="display stat-number">{overview.coaches}</span><span className="muted small">{overview.paid} paid · {overview.granted} granted</span></div>
          <div className="card grow"><span className="eyebrow">Granted by admin</span><span className="display stat-number">{overview.granted}</span><span className="muted small">You can revoke these</span></div>
        </div>
      )}

      <section className="card stack">
        <div className="row row--between">
          <h2 className="card__title">Users</h2>
          <input type="search" className="search-input" placeholder="Search @username" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
        </div>
        <table className="table">
          <thead>
            <tr><th>User</th><th>Role</th><th>Coach plan</th><th /></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.username ? `@${u.username}` : "(no username yet)"}</strong>
                  {u.name && <span className="muted block">{u.name}</span>}
                </td>
                <td className="muted">{roleOf(u)}{u.isAdmin ? " · Admin" : ""}</td>
                <td>
                  {u.coachActive ? (
                    <span className={`status ${u.coachSource === "paid" ? "status--accepted" : "status--pending"}`}>{u.coachSource === "paid" ? "Paid" : "Granted"}</span>
                  ) : u.requested ? (
                    <span className="status status--pending">Requested</span>
                  ) : (
                    <span className="muted">None</span>
                  )}
                </td>
                <td className="table__actions">
                  {u.username && !u.coachActive && (
                    <button type="button" className="btn-small" onClick={() => void act(() => grantCoach(u.username))}>Grant</button>
                  )}
                  {u.coachActive && u.coachSource === "granted" && (
                    <button type="button" className="btn-small" onClick={() => void act(() => revokeCoach(u.username))}>Revoke</button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="muted">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
