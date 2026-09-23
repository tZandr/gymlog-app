import { useEffect, useState } from "react";
import { getMyCoach, type MyCoach } from "../../api/myCoach";

export default function ClientDashboard() {
  const [coach, setCoach] = useState<MyCoach | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCoach()
      .then(setCoach)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h5>From your coach</h5>
      </div>
      <div className="section">
        {loading ? (
          <p>Loading...</p>
        ) : !coach ? (
          <div className="empty-state">
            <p>You&apos;re not connected to a coach yet. When a coach invites you, what they send will show up here.</p>
          </div>
        ) : (
          <div className="empty-state">
            <p>Connected to {coach.name ?? "your coach"}. Training plans and notes they send you will show up here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
