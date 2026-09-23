import { supabase } from '../lib/supabaseClient';
import type { IProfile } from '../types/Profile';

interface ProfileRow {
  id: string;
  username: string | null;
  name: string | null;
  age: number | null;
  avatar_url: string | null;
  bio: string | null;
  coach_tags: string[] | null;
  is_admin: boolean;
}

function mapProfile(row: ProfileRow): IProfile {
  return {
    _id: row.id,
    username: row.username,
    name: row.name ?? '',
    age: row.age ?? 0,
    avatarUrl: row.avatar_url ?? null,
    bio: row.bio ?? '',
    coachTags: row.coach_tags ?? [],
    isAdmin: row.is_admin,
  };
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const userId = data.session?.user.id;
  if (!userId) throw new Error('Not logged in');
  return userId;
}

export const getProfile = async (): Promise<IProfile> => {
  const userId = await currentUserId();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return mapProfile(data);
};

export const updateProfile = async (data: Partial<IProfile>): Promise<IProfile> => {
  const userId = await currentUserId();
  // Only these columns are writable by the app; the database refuses anything else.
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.age !== undefined) payload.age = data.age;
  if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;
  if (data.bio !== undefined) payload.bio = data.bio;
  if (data.coachTags !== undefined) payload.coach_tags = data.coachTags;

  const { data: row, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return mapProfile(row);
};

export const uploadAvatar = async (file: File): Promise<{ url: string }> => {
  const userId = await currentUserId();
  const path = `${userId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return { url: data.publicUrl };
};
