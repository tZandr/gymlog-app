import { useEffect, useState } from "react";
import { isUsernameAvailable, normalizeUsername, validateUsername } from "../../api/username";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

// A username input with a fixed "@" and a live "available / taken" hint.
// The database is still the judge (unique index); this is just fast feedback.
export function UsernameField({ value, onChange, label = "Username" }: Props) {
  const [result, setResult] = useState<{ name: string; available: boolean } | null>(null);
  const name = normalizeUsername(value);
  const formatError = name ? validateUsername(name) : null;

  useEffect(() => {
    if (!name || formatError) return;
    const timer = setTimeout(async () => {
      try {
        setResult({ name, available: await isUsernameAvailable(name) });
      } catch {
        setResult(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [name, formatError]);

  let hint: { text: string; tone: "ok" | "bad" | "muted" } = { text: "3–20 characters: letters, numbers, . or _", tone: "muted" };
  if (formatError) hint = { text: formatError, tone: "bad" };
  else if (name && result?.name === name) {
    hint = result.available ? { text: `@${name} is available`, tone: "ok" } : { text: `@${name} is taken`, tone: "bad" };
  } else if (name) hint = { text: "Checking...", tone: "muted" };

  return (
    <label>
      {label}
      <span className="at-input">
        <span className="at-input__at">@</span>
        <input
          type="text"
          value={value.replace(/^@+/, "")}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </span>
      <span className={`field-hint field-hint--${hint.tone}`}>{hint.text}</span>
    </label>
  );
}
