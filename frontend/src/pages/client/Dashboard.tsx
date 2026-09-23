import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCoachDirectory, getMyCoaches, respondToInvite } from "../../api/coachClients";
import { getPrograms } from "../../api/programs";
import { useAuth } from "../../hooks/useAuth";
import type { ICoachListing, IMyCoach, IProgram } from "../../types/Platform";

const initials = (username: string) => username.slice(0, 2).toUpperCase();

export default function ClientDashboard() {
  const { user, profile } = useAuth();
  const [coaches, setCoaches] = useState<IMyCoach[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [directory, setDirectory] = useState<ICoachListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tag, setTag] = useState<string>("All");
  const [openCoach, setOpenCoach] = useState<string | null>(null);

  const [reload, setReload] = useState(0);

  useEffect(() => {
    Promise.all([getMyCoaches(), getPrograms(), getCoachDirectory()])
      .then(([mine, progs, dir]) => {
        setCoaches(mine);
        setPrograms(progs.filter((p) => p.clientId === user?.id && p.status === "sent"));
        setDirectory(dir);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load"))
      .finally(() => setLoading(false));
  }, [reload, user?.id]);

  async function respond(linkId: string, accept: boolean) {
    setError(null);
    try {
      await respondToInvite(linkId, accept);
      setReload((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const invites = coaches.filter((c) => c.status === "pending");
  const connected = coaches.filter((c) => c.status === "accepted");
  const tags = useMemo(() => ["All", ...new Set(directory.flatMap((c) => c.coachTags))], [directory]);
  const listed = directory.filter((c) => tag === "All" || c.coachTags.includes(tag));

  return (
    <div className="stack">
      <h1 className="display page-title">From your coach</h1>
      {error && <p className="form-error">{error}</p>}

      {profile?.username && (
        <div className="card stack stack--tight">
          <span className="eyebrow">Your username</span>
          <span className="display username-big">@{profile.username}</span>
          <span className="muted">Share this with your coach so they can invite you.</span>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {invites.length > 0 && (
            <section className="stack stack--tight">
              <div className="row row--between">
                <h2 className="eyebrow">Invites</h2>
                <span className="chip chip--accent">{invites.length} new</span>
              </div>
              {invites.map((c) => (
                <div key={c.linkId} className="card stack stack--tight">
                  <div className="row">
                    <span className="avatar-initials">{initials(c.username)}</span>
                    <div className="stack stack--tight">
                      <strong>@{c.username}</strong>
                      <span className="muted small">{c.name ? `${c.name} wants to coach you` : "wants to coach you"}</span>
                    </div>
                  </div>
                  <p className="muted">Accepting lets them see your workouts and send you programs and notes.</p>
                  <div className="row">
                    <button type="button" className="btn-primary grow" onClick={() => void respond(c.linkId, true)}>Accept</button>
                    <button type="button" className="grow" onClick={() => void respond(c.linkId, false)}>Decline</button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {connected.length > 0 && (
            <section className="stack stack--tight">
              <h2 className="eyebrow">Your coach</h2>
              {connected.map((c) => (
                <div key={c.linkId} className="card row">
                  <span className="avatar-initials">{initials(c.username)}</span>
                  <div className="stack stack--tight grow">
                    <strong>@{c.username}</strong>
                    {c.name && <span className="muted small">{c.name}</span>}
                  </div>
                  <span className="status status--accepted">Active</span>
                </div>
              ))}
            </section>
          )}

          {programs.length > 0 && (
            <section className="stack stack--tight">
              <h2 className="eyebrow">Programs</h2>
              {programs.map((p) => {
                const from = coaches.find((c) => c.coachId === p.coachId);
                return (
                  <Link key={p.id} to={`/client/programs/${p.id}`} className="card program-link">
                    <span className="display program-link__name">{p.name}</span>
                    <span className="muted small">
                      {p.days.length} {p.days.length === 1 ? "day" : "days"}{from ? ` · from @${from.username}` : ""}
                    </span>
                  </Link>
                );
              })}
            </section>
          )}

          {connected.length === 0 && (
            <section className="stack stack--tight">
              <div className="stack stack--tight">
                <h2 className="eyebrow">Coaches on Bro Split</h2>
                <span className="muted">Coaches who joined through the platform.</span>
              </div>
              {directory.length === 0 ? (
                <div className="card"><p className="muted">No coaches are listed yet.</p></div>
              ) : (
                <>
                  <div className="row row--wrap">
                    {tags.map((t) => (
                      <button key={t} type="button" className={`pill${t === tag ? " pill--active" : ""}`} onClick={() => setTag(t)}>{t}</button>
                    ))}
                  </div>
                  {listed.map((c) => (
                    <div key={c.id} className="card stack stack--tight">
                      <div className="row">
                        <span className="avatar-initials">{initials(c.username)}</span>
                        <div className="stack stack--tight">
                          <strong>@{c.username}</strong>
                          {c.name && <span className="muted small">{c.name}</span>}
                        </div>
                      </div>
                      {c.coachTags.length > 0 && (
                        <div className="row row--wrap">{c.coachTags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                      )}
                      {openCoach === c.id && <p>{c.bio || "This coach hasn't written a bio yet."}</p>}
                      <button type="button" onClick={() => setOpenCoach(openCoach === c.id ? null : c.id)}>
                        {openCoach === c.id ? "Hide profile" : "View profile"}
                      </button>
                    </div>
                  ))}
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
