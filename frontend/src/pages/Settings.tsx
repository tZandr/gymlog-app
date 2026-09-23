import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { respondToAdminInvite } from "../api/access";
import { enablePushNotifications } from "../lib/push";

export default function Settings() {
  const { profile, access, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [pushStatus, setPushStatus] = useState<"idle" | "enabling" | "enabled" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleEnablePush() {
    setPushStatus("enabling");
    setError(null);
    try {
      await enablePushNotifications();
      setPushStatus("enabled");
    } catch (err) {
      setPushStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleAdminInvite(accept: boolean) {
    setError(null);
    try {
      await respondToAdminInvite(accept);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h5>Settings</h5>
      </div>
      {profile?.username && <p className="settings-handle">@{profile.username}</p>}

      {access.adminInvite && (
        <div className="section">
          <p><strong>You&apos;ve been invited to be an admin.</strong></p>
          <div className="btn-group">
            <button type="button" className="btn-success" onClick={() => void handleAdminInvite(true)}>Accept</button>
            <button type="button" onClick={() => void handleAdminInvite(false)}>Decline</button>
          </div>
        </div>
      )}

      <div className="section">
        <button type="button" onClick={() => navigate("/client")}>From your coach</button>
      </div>
      <div className="section">
        <button type="button" onClick={() => navigate("/coach/clients")}>Coach dashboard</button>
      </div>
      {profile?.isAdmin && (
        <div className="section">
          <button type="button" onClick={() => navigate("/admin")}>Admin dashboard</button>
        </div>
      )}
      <div className="section">
        <button type="button" onClick={handleEnablePush} disabled={pushStatus === "enabling" || pushStatus === "enabled"}>
          {pushStatus === "enabled" ? "Notifications enabled" : pushStatus === "enabling" ? "Enabling..." : "Enable notifications"}
        </button>
        {error && <p className="form-error">{error}</p>}
      </div>
      <div className="section">
        <button type="button" className="btn-danger" onClick={() => logout()}>
          Log out
        </button>
      </div>
    </div>
  );
}
