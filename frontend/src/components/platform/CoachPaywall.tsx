import { useState } from "react";
import { FaLock } from "react-icons/fa";
import { requestCoachAccess } from "../../api/access";
import { useAuth } from "../../hooks/useAuth";

// Coach tools need a coach plan. The database enforces this too; this screen is just
// what someone without a plan sees instead of an empty dashboard.
export function CoachPaywall() {
  const { access, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setBusy(true);
    setError(null);
    try {
      await requestCoachAccess();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="paywall">
      <span className="paywall__icon"><FaLock size={26} /></span>
      <h1 className="display">Coach tools are locked</h1>
      <p>
        Inviting clients and sending programs needs a coach plan. Plans and payments are on the way; until then
        the Bro Split team grants access by hand.
      </p>
      {access.requested ? (
        <p className="paywall__sent">Request sent. An admin will review it.</p>
      ) : (
        <button type="button" className="btn-primary" onClick={handleRequest} disabled={busy}>
          {busy ? "Sending..." : "Request access"}
        </button>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
