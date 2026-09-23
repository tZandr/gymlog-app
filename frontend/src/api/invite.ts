import { supabase } from '../lib/supabaseClient';

export interface InvitePreview {
  email: string;
  coachName: string | null;
  status: 'pending' | 'accepted' | 'revoked';
}

interface InvitePreviewRow {
  client_email: string;
  coach_name: string | null;
  status: 'pending' | 'accepted' | 'revoked';
}

export const getInvitePreview = async (token: string): Promise<InvitePreview | null> => {
  const { data, error } = await supabase.rpc('get_pending_invite', { p_token: token });
  if (error) throw error;
  const row = (data as InvitePreviewRow[] | null)?.[0];
  if (!row) return null;
  return { email: row.client_email, coachName: row.coach_name, status: row.status };
};

export const acceptInvite = async (token: string): Promise<void> => {
  const { error } = await supabase.rpc('accept_coach_invite', { p_token: token });
  if (error) throw error;
};
