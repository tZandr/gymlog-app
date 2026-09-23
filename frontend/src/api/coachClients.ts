import { supabase } from '../lib/supabaseClient';
import type { ICoachClientLink } from '../types/CoachClientLink';

interface LinkRow {
  id: string;
  client_email: string;
  client_id: string | null;
  invite_token: string;
  status: 'pending' | 'accepted' | 'revoked';
  created_at: string;
  accepted_at: string | null;
}

function mapLink(row: LinkRow): ICoachClientLink {
  return {
    _id: row.id,
    clientEmail: row.client_email,
    clientId: row.client_id,
    inviteToken: row.invite_token,
    status: row.status,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
  };
}

export const getClients = async (): Promise<ICoachClientLink[]> => {
  const { data, error } = await supabase
    .from('coach_client_links')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapLink);
};

export const inviteClient = async (email: string): Promise<ICoachClientLink> => {
  const { data, error } = await supabase
    .from('coach_client_links')
    .insert({ client_email: email })
    .select('*')
    .single();
  if (error) throw error;
  return mapLink(data);
};
