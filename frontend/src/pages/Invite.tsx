import { useParams } from "react-router-dom";
import { getInvitePreview, acceptInvite } from "../api/invite";
import { useInviteAcceptance } from "../hooks/useInviteAcceptance";

export default function Invite() {
  const { token } = useParams<{ token: string }>();
  const { preview, password, setPassword, stage, error, handleSignup } = useInviteAcceptance(
    token,
    getInvitePreview,
    acceptInvite,
  );

  if (stage === "loading") return <p>Loading invite...</p>;

  if (stage === "error") {
    return (
      <div className="page-header">
        <h5>Invite</h5>
        <p className="form-error">{error}</p>
      </div>
    );
  }

  if (stage === "check-email") {
    return (
      <div className="page-header">
        <h5>Check your email</h5>
        <p>Confirm your account, then reopen this invite link to finish joining.</p>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="page-header">
        <h5>You&apos;re in</h5>
        <p>Your account is linked to {preview?.coachName ?? "your coach"}. Head to the app to get started.</p>
      </div>
    );
  }

  return (
    <div className="page-header">
      <h5>Join {preview?.coachName ?? "your coach"} on GymLog</h5>
      <form onSubmit={handleSignup}>
        <label>
          Email
          <input type="email" value={preview?.email ?? ""} disabled />
        </label>
        <label>
          Choose a password
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
        <button type="submit" className="btn-success" disabled={stage === "submitting"}>
          {stage === "submitting" ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
