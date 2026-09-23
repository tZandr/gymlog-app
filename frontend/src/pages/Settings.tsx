import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { enablePushNotifications } from "../lib/push";

export default function Settings() {
  const { logout } = useAuth();
  const [pushStatus, setPushStatus] = useState<"idle" | "enabling" | "enabled" | "error">("idle");
  const [pushError, setPushError] = useState<string | null>(null);

  async function handleEnablePush() {
    setPushStatus("enabling");
    setPushError(null);
    try {
      await enablePushNotifications();
      setPushStatus("enabled");
    } catch (err) {
      setPushStatus("error");
      setPushError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h5>Settings</h5>
      </div>
      <div>
        <p>dark mode, language</p>
      </div>
      <div className="section">
        <button type="button" onClick={handleEnablePush} disabled={pushStatus === "enabling" || pushStatus === "enabled"}>
          {pushStatus === "enabled" ? "Notifications enabled" : pushStatus === "enabling" ? "Enabling..." : "Enable notifications"}
        </button>
        {pushStatus === "error" && <p className="form-error">{pushError}</p>}
      </div>
      <div className="section">
        <button type="button" className="btn-danger" onClick={() => logout()}>
          Log out
        </button>
      </div>
    </div>
  );
}
