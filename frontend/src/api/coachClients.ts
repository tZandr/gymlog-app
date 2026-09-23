import { supabase } from '../lib/supabaseClient';
import { normalizeUsername } from './username';
import type { ICoachClient, ICoachListing, IMyCoach, LinkStatus } from '../types/Platform';

interface ClientRow {
  id: string;
  client_id: string;
  username: string;
  name: string | null;
  status: LinkStatus;
  created_at: string;
  accepted_at: string | null;
}

interface MyCoachRow {
  id: string;
  coach_id: string;
  username: string;
  name: string | null;
  bio: string | null;
  coach_tags: string[] | null;
  status: LinkStatus;
}

interface ListingRow {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  coach_tags: string[] | null;
  avatar_url: string | null;
}

/* ---- coach side ---- */

export const getClients = async (): Promise<ICoachClient[]> => {
  const { data, error } = await supabase.rpc('my_clients');
  if (error) throw new Error(error.message);
  return ((data ?? []) as ClientRow[]).map((r) => ({
    linkId: r.id,
    clientId: r.client_id,
    username: r.username,
    name: r.name ?? '',
    status: r.status,
    createdAt: r.created_at,
    acceptedAt: r.accepted_at,
  }));
};

export const inviteClient = async (username: string): Promise<void> => {
  const { error } = await supabase.rpc('invite_client', { p_username: normalizeUsername(username) });
  if (error) throw new Error(error.message);
};

/** Cancels a pending invite or removes a client (either side may delete a link). */
export const removeLink = async (linkId: string): Promise<void> => {
  const { error } = await supabase.from('coach_client_links').delete().eq('id', linkId);
  if (error) throw new Error(error.message);
};

/* ---- client side ---- */

export const getMyCoaches = async (): Promise<IMyCoach[]> => {
  const { data, error } = await supabase.rpc('my_coaches');
  if (error) throw new Error(error.message);
  return ((data ?? []) as MyCoachRow[]).map((r) => ({
    linkId: r.id,
    coachId: r.coach_id,
    username: r.username,
    name: r.name ?? '',
    bio: r.bio ?? '',
    coachTags: r.coach_tags ?? [],
    status: r.status,
  }));
};

export const respondToInvite = async (linkId: string, accept: boolean): Promise<void> => {
  const { error } = await supabase.rpc('respond_to_invite', { p_link_id: linkId, p_accept: accept });
  if (error) throw new Error(error.message);
};

export const getCoachDirectory = async (): Promise<ICoachListing[]> => {
  const { data, error } = await supabase.rpc('list_coaches');
  if (error) throw new Error(error.message);
  return ((data ?? []) as ListingRow[]).map((r) => ({
    id: r.id,
    username: r.username,
    name: r.name ?? '',
    bio: r.bio ?? '',
    coachTags: r.coach_tags ?? [],
    avatarUrl: r.avatar_url,
  }));
};
