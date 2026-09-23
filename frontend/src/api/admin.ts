import { supabase } from '../lib/supabaseClient';
import { normalizeUsername } from './username';
import type { IAdminMember, IAdminOverview, IAdminUser } from '../types/Platform';

interface UserRow {
  id: string;
  username: string | null;
  name: string | null;
  is_admin: boolean;
  coach_active: boolean;
  coach_source: 'granted' | 'paid' | null;
  requested: boolean;
  is_client: boolean;
}
interface MemberRow {
  id: string;
  username: string | null;
  name: string | null;
  status: 'admin' | 'pending';
}

export const getOverview = async (): Promise<IAdminOverview> => {
  const { data, error } = await supabase.rpc('admin_overview');
  if (error) throw new Error(error.message);
  const r = data as Record<string, number>;
  return { total: r.total, coaches: r.coaches, granted: r.granted, paid: r.paid, clients: r.clients };
};

export const listUsers = async (search: string): Promise<IAdminUser[]> => {
  const { data, error } = await supabase.rpc('admin_list_users', { p_search: search });
  if (error) throw new Error(error.message);
  return ((data ?? []) as UserRow[]).map((r) => ({
    id: r.id,
    username: r.username ?? '',
    name: r.name ?? '',
    isAdmin: r.is_admin,
    coachActive: r.coach_active,
    coachSource: r.coach_source,
    requested: r.requested,
    isClient: r.is_client,
  }));
};

export const grantCoach = async (username: string): Promise<void> => {
  const { error } = await supabase.rpc('admin_grant_coach', { p_username: normalizeUsername(username) });
  if (error) throw new Error(error.message);
};

export const revokeCoach = async (username: string): Promise<void> => {
  const { error } = await supabase.rpc('admin_revoke_coach', { p_username: normalizeUsername(username) });
  if (error) throw new Error(error.message);
};

export const listAdmins = async (): Promise<IAdminMember[]> => {
  const { data, error } = await supabase.rpc('admin_list_admins');
  if (error) throw new Error(error.message);
  return ((data ?? []) as MemberRow[]).map((r) => ({
    id: r.id,
    username: r.username ?? '',
    name: r.name ?? '',
    status: r.status,
  }));
};

export const inviteAdmin = async (username: string): Promise<void> => {
  const { error } = await supabase.rpc('admin_invite_admin', { p_username: normalizeUsername(username) });
  if (error) throw new Error(error.message);
};

export const cancelAdminInvite = async (username: string): Promise<void> => {
  const { error } = await supabase.rpc('admin_cancel_admin_invite', { p_username: normalizeUsername(username) });
  if (error) throw new Error(error.message);
};

export const removeAdmin = async (username: string): Promise<void> => {
  const { error } = await supabase.rpc('admin_remove_admin', { p_username: normalizeUsername(username) });
  if (error) throw new Error(error.message);
};
