import { supabase } from '../lib/supabaseClient';

export interface CoachInvitePreview {
  email: string;
  status: 'pending' | 'accepted' | 'revoked';
}

interface CoachInvitePreviewRow {
  email: string;
  status: 'pending' | 'accepted' | 'revoked';
}

export const getCoachInvitePreview = async (token: string): Promise<CoachInvitePreview | null> => {
  const { data, error } = await supabase.rpc('get_pending_coach_invite', { p_token: token });
  if (error) throw error;
  const row = (data as CoachInvitePreviewRow[] | null)?.[0];
  if (!row) return null;
  return { email: row.email, status: row.status };
};

export const acceptCoachInvite = async (token: string): Promise<void> => {
  const { error } = await supabase.rpc('accept_coach_invite_signup', { p_token: token });
  if (error) throw error;
};
