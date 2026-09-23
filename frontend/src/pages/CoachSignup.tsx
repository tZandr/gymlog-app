import { useParams } from "react-router-dom";
import { getCoachInvitePreview, acceptCoachInvite } from "../api/coachSignup";
import { useInviteAcceptance } from "../hooks/useInviteAcceptance";

export default function CoachSignup() {
  const { token } = useParams<{ token: string }>();
  const { preview, password, setPassword, stage, error, handleSignup } = useInviteAcceptance(
    token,
    getCoachInvitePreview,
    acceptCoachInvite,
  );

  if (stage === "loading") return <p>Loading invite...</p>;

  if (stage === "error") {
    return (
      <div className="page-header">
        <h5>Coach signup</h5>
        <p className="form-error">{error}</p>
      </div>
    );
  }

  if (stage === "check-email") {
    return (
      <div className="page-header">
        <h5>Check your email</h5>
        <p>Confirm your account, then reopen this link to finish setting up your coach account.</p>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="page-header">
        <h5>You&apos;re set up</h5>
        <p>Your coach account is ready. Log in to start inviting clients.</p>
      </div>
    );
  }

  return (
    <div className="page-header">
      <h5>Set up your coach account</h5>
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
