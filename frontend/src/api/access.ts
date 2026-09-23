import { supabase } from '../lib/supabaseClient';

export interface MyAccess {
  /** Has an active coach plan (paid or granted by an admin). */
  coach: boolean;
  /** Has asked an admin for coach access and is waiting. */
  requested: boolean;
  /** Has a pending invite to become an admin. */
  adminInvite: boolean;
}

export const NO_ACCESS: MyAccess = { coach: false, requested: false, adminInvite: false };

export const getMyAccess = async (): Promise<MyAccess> => {
  const { data, error } = await supabase.rpc('my_access');
  if (error) throw error;
  const row = data as { coach: boolean; requested: boolean; admin_invite: boolean };
  return { coach: row.coach, requested: row.requested, adminInvite: row.admin_invite };
};

export const requestCoachAccess = async (): Promise<void> => {
  const { error } = await supabase.rpc('request_coach_access');
  if (error) throw new Error(error.message);
};

export const respondToAdminInvite = async (accept: boolean): Promise<void> => {
  const { error } = await supabase.rpc('respond_admin_invite', { p_accept: accept });
  if (error) throw new Error(error.message);
};
