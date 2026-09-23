import { supabase } from '../lib/supabaseClient';
import type { IExercise } from '../types/Exercise';

interface ExerciseRow {
  id: string;
  name: string;
  muscle_groups: string[] | null;
  category: string[] | null;
  brand: string | null;
  base_exercise_id: string | null;
}

function mapExercise(row: ExerciseRow): IExercise {
  return {
    _id: row.id,
    name: row.name,
    muscleGroups: row.muscle_groups ?? [],
    category: row.category ?? [],
    brand: row.brand ?? undefined,
    baseExercise: row.base_exercise_id ?? null,
  };
}

export const getExercises = async (): Promise<IExercise[]> => {
  const { data, error } = await supabase.from('exercises').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(mapExercise);
};

export const getExercise = async (id: string): Promise<IExercise> => {
  const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single();
  if (error) throw error;
  return mapExercise(data);
};

export const createExercise = async (data: Partial<IExercise>): Promise<IExercise> => {
  const { data: row, error } = await supabase
    .from('exercises')
    .insert({
      name: data.name,
      muscle_groups: data.muscleGroups ?? [],
      category: data.category ?? [],
      brand: data.brand || null,
      base_exercise_id: data.baseExercise || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapExercise(row);
};

export const updateExercise = async (id: string, data: Partial<IExercise>): Promise<IExercise> => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.muscleGroups !== undefined) payload.muscle_groups = data.muscleGroups;
  if (data.category !== undefined) payload.category = data.category;
  if (data.brand !== undefined) payload.brand = data.brand || null;
  if (data.baseExercise !== undefined) payload.base_exercise_id = data.baseExercise || null;

  const { data: row, error } = await supabase
    .from('exercises')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapExercise(row);
};

export const deleteExercise = async (id: string) => {
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) throw error;
};
