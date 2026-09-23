import type { ReactNode } from "react";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <span className="display auth-card__name">Bro Split</span>
          <span className="auth-card__tagline">Coach–Client Platform</span>
        </div>
        <h1 className="display auth-card__title">{title}</h1>
        {children}
      </div>
    </div>
  );
}
