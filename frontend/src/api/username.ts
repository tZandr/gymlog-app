import { supabase } from '../lib/supabaseClient';

const USERNAME_RE = /^[a-z0-9._]{3,20}$/;

/** What the user typed, without a leading '@', trimmed and lowercased. */
export const normalizeUsername = (input: string) => input.trim().replace(/^@+/, '').toLowerCase();

/** Returns an error message, or null when the username is acceptable. */
export function validateUsername(input: string): string | null {
  const u = normalizeUsername(input);
  if (!USERNAME_RE.test(u)) return 'Use 3–20 characters: letters, numbers, . or _';
  return null;
}

export const isUsernameAvailable = async (input: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('username_available', { p_username: normalizeUsername(input) });
  if (error) throw error;
  return data === true;
};

export const setUsername = async (input: string): Promise<void> => {
  const { error } = await supabase.rpc('set_username', { p_username: normalizeUsername(input) });
  if (error) throw new Error(error.message);
};
