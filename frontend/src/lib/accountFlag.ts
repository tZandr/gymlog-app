// Remembers that this browser has had an account, so a logged-out visitor is sent to
// "Log in" instead of "Create account" the second time. First-time visitors are forced
// to create an account.
const KEY = "bro-split:has-account";

export function rememberAccount() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    // Storage can be blocked (private windows); the app works fine without it.
  }
}

export function hasAccount(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
