import { useCallback, useEffect, useState } from "react";
import { getClients, inviteClient, removeLink } from "../../api/coachClients";
import { normalizeUsername, validateUsername } from "../../api/username";
import type { ICoachClient } from "../../types/Platform";

const STATUS_LABEL: Record<ICoachClient["status"], string> = {
  accepted: "Connected",
  pending: "Invite pending",
  declined: "Declined",
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export default function Clients() {
  const [clients, setClients] = useState<ICoachClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setClients(await getClients());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const formatError = validateUsername(username);
    if (formatError) {
      setError(formatError);
      return;
    }
    setSubmitting(true);
    try {
      await inviteClient(username);
      setNotice(`Invite sent to @${normalizeUsername(username)}. They'll see it in their client dashboard.`);
      setUsername("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the invite");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(client: ICoachClient) {
    const message =
      client.status === "accepted"
        ? `Remove @${client.username} as a client? They keep any programs you already sent.`
        : `Cancel the invite to @${client.username}?`;
    if (!window.confirm(message)) return;
    try {
      await removeLink(client.linkId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove");
    }
  }

  return (
    <div className="stack">
      <h1 className="display page-title">Clients</h1>

      <form className="card stack stack--tight" onSubmit={handleInvite}>
        <div>
          <h2 className="card__title">Invite a client</h2>
          <p className="muted">Enter their @username. The invite appears in their client dashboard — no email or link needed.</p>
        </div>
        <div className="row row--end">
          <label className="grow">
            Client username
            <span className="at-input">
              <span className="at-input__at">@</span>
              <input
                type="text"
                value={username.replace(/^@+/, "")}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </span>
          </label>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Sending..." : "Send invite"}
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
        {notice && <p className="form-notice">{notice}</p>}
      </form>

      <div className="card">
        {loading ? (
          <p>Loading clients...</p>
        ) : clients.length === 0 ? (
          <p className="muted">No clients yet. Invite one above.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Status</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.linkId}>
                  <td>
                    <strong>@{client.username}</strong>
                    {client.name && <span className="muted block">{client.name}</span>}
                  </td>
                  <td>
                    <span className={`status status--${client.status}`}>{STATUS_LABEL[client.status]}</span>
                  </td>
                  <td className="muted">{formatDate(client.acceptedAt ?? client.createdAt)}</td>
                  <td className="table__actions">
                    <button type="button" className="btn-small" onClick={() => void handleRemove(client)}>
                      {client.status === "accepted" ? "Remove" : "Cancel invite"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
