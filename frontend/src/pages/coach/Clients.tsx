import { useEffect, useState } from "react";
import { getClients, inviteClient } from "../../api/coachClients";
import type { ICoachClientLink } from "../../types/CoachClientLink";

function inviteUrl(token: string) {
  return `${window.location.origin}/invite/${token}`;
}

export default function Clients() {
  const [clients, setClients] = useState<ICoachClientLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newInvite, setNewInvite] = useState<ICoachClientLink | null>(null);

  useEffect(() => {
    getClients()
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const link = await inviteClient(email.trim());
      setClients((prev) => [link, ...prev]);
      setNewInvite(link);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h5>Clients</h5>
      </div>

      <div className="section">
        <form onSubmit={handleAdd} className="coach-invite-form">
          <label>
            Add new client
            <input
              type="email"
              placeholder="client@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn-success" disabled={submitting}>
            {submitting ? "Creating invite..." : "Send invite"}
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}
        {newInvite && (
          <div className="coach-invite-link">
            <p>Invite created for {newInvite.clientEmail} — share this link with them:</p>
            <div className="coach-invite-link__row">
              <input type="text" readOnly value={inviteUrl(newInvite.inviteToken)} />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(inviteUrl(newInvite.inviteToken))}
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="section">
        {loading ? (
          <p>Loading clients...</p>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <p>No clients yet. Add one above to send their first invite.</p>
          </div>
        ) : (
          <div className="coach-client-list">
            {clients.map((client) => (
              <div key={client._id} className="coach-client-list__row">
                <span>{client.clientEmail}</span>
                <span className={`tag coach-client-list__status coach-client-list__status--${client.status}`}>
                  {client.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
