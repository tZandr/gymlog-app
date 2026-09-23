import { supabase } from '../lib/supabaseClient';

export interface MyCoach {
  name: string | null;
}

export const getMyCoach = async (): Promise<MyCoach | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return null;

  // Filter on client_id explicitly: a coach also has RLS access to links where
  // they're the coach, and those aren't "my coach".
  const { data: links, error } = await supabase
    .from('coach_client_links')
    .select('coach_id')
    .eq('client_id', userId)
    .eq('status', 'accepted')
    .limit(1);
  if (error) throw error;

  const coachId = (links as { coach_id: string }[] | null)?.[0]?.coach_id;
  if (!coachId) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', coachId)
    .maybeSingle();
  if (profileError) throw profileError;

  return { name: (profile as { name: string | null } | null)?.name ?? null };
};
