import { supabase } from '../lib/supabaseClient';
import type { IWorkout, IWorkoutExercise, ISet } from '../types/Workout';

const WORKOUT_SELECT = '*, exercises:workout_exercises(*, sets(*))';

interface SetRow {
  id: string;
  reps: number;
  weight: number;
}

interface WorkoutExerciseRow {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: SetRow[] | null;
}

interface WorkoutRow {
  id: string;
  name: string;
  gym: string | null;
  date: string;
  notes: string | null;
  exercises: WorkoutExerciseRow[] | null;
  rating: number | null;
  is_template: boolean | null;
  duration_seconds: number | null;
}

function mapSet(row: SetRow): ISet {
  return { _id: row.id, reps: row.reps, weight: row.weight };
}

function mapWorkoutExercise(row: WorkoutExerciseRow): IWorkoutExercise {
  return {
    _id: row.id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    sets: (row.sets ?? []).map(mapSet),
  };
}

function mapWorkout(row: WorkoutRow): IWorkout {
  return {
    _id: row.id,
    name: row.name,
    gym: row.gym ?? '',
    date: row.date,
    notes: row.notes ?? '',
    exercises: (row.exercises ?? []).map(mapWorkoutExercise),
    rating: row.rating ?? undefined,
    isTemplate: row.is_template ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
  };
}

export const getWorkouts = async (): Promise<IWorkout[]> => {
  const { data, error } = await supabase
    .from('workouts')
    .select(WORKOUT_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapWorkout);
};

export const getWorkout = async (id: string): Promise<IWorkout> => {
  const { data, error } = await supabase
    .from('workouts')
    .select(WORKOUT_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;
  return mapWorkout(data);
};

export const createWorkout = async (data: Partial<IWorkout>): Promise<IWorkout> => {
  const { data: row, error } = await supabase
    .from('workouts')
    .insert({
      name: data.name,
      gym: data.gym || null,
      date: data.date,
      notes: data.notes || null,
    })
    .select(WORKOUT_SELECT)
    .single();
  if (error) throw error;
  return mapWorkout(row);
};

export const updateWorkout = async (id: string, data: Partial<IWorkout>): Promise<IWorkout> => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.gym !== undefined) payload.gym = data.gym;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.rating !== undefined) payload.rating = data.rating;
  if (data.isTemplate !== undefined) payload.is_template = data.isTemplate;
  if (data.durationSeconds !== undefined) payload.duration_seconds = data.durationSeconds;

  const { data: row, error } = await supabase
    .from('workouts')
    .update(payload)
    .eq('id', id)
    .select(WORKOUT_SELECT)
    .single();
  if (error) throw error;
  return mapWorkout(row);
};

export const deleteWorkout = async (id: string) => {
  const { error } = await supabase.from('workouts').delete().eq('id', id);
  if (error) throw error;
};

export const addExercise = async (
  workoutId: string,
  data: { exerciseId: string; exerciseName: string },
): Promise<IWorkout> => {
  const { error } = await supabase
    .from('workout_exercises')
    .insert({ workout_id: workoutId, exercise_id: data.exerciseId, exercise_name: data.exerciseName });
  if (error) throw error;
  return getWorkout(workoutId);
};

export const deleteExercise = async (_workoutId: string, exerciseId: string) => {
  const { error } = await supabase.from('workout_exercises').delete().eq('id', exerciseId);
  if (error) throw error;
};

export const addSet = async (
  workoutId: string,
  exerciseId: string,
  data: { reps: number; weight: number },
): Promise<IWorkout> => {
  const { error } = await supabase
    .from('sets')
    .insert({ workout_exercise_id: exerciseId, reps: data.reps, weight: data.weight });
  if (error) throw error;
  return getWorkout(workoutId);
};

export const updateSet = async (
  workoutId: string,
  _exerciseId: string,
  setId: string,
  data: { reps?: number; weight?: number },
): Promise<IWorkout> => {
  const { error } = await supabase.from('sets').update(data).eq('id', setId);
  if (error) throw error;
  return getWorkout(workoutId);
};

export const deleteSet = async (_workoutId: string, _exerciseId: string, setId: string) => {
  const { error } = await supabase.from('sets').delete().eq('id', setId);
  if (error) throw error;
};

export interface ProgramDayItem {
  name: string;
  sets: number | null;
  reps: string;
}

/**
 * Turns a coach's program day into a workout ready to log: one workout, its exercises
 * (matched to the shared exercise catalog by name, created if missing) and empty sets.
 */
export const startWorkoutFromDay = async (dayName: string, items: ProgramDayItem[]): Promise<string> => {
  const { data: catalog, error: catalogError } = await supabase.from('exercises').select('id, name');
  if (catalogError) throw catalogError;
  const byName = new Map((catalog ?? []).map((e: { id: string; name: string }) => [e.name.toLowerCase(), e.id]));

  const missing = [...new Set(items.map((i) => i.name).filter((n) => !byName.has(n.toLowerCase())))];
  if (missing.length > 0) {
    const { data: created, error: createError } = await supabase
      .from('exercises')
      .insert(missing.map((name) => ({ name, muscle_groups: [], category: [] })))
      .select('id, name');
    if (createError) throw createError;
    (created ?? []).forEach((e: { id: string; name: string }) => byName.set(e.name.toLowerCase(), e.id));
  }

  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({ name: dayName, date: new Date().toISOString() })
    .select('id')
    .single();
  if (workoutError) throw workoutError;

  const { data: rows, error: rowsError } = await supabase
    .from('workout_exercises')
    .insert(
      items.map((i) => ({
        workout_id: workout.id,
        exercise_id: byName.get(i.name.toLowerCase()),
        exercise_name: i.name,
      })),
    )
    .select('id');
  if (rowsError) throw rowsError;

  const sets = (rows ?? []).flatMap((row: { id: string }, index: number) => {
    const item = items[index];
    const reps = Number(item.reps.match(/\d+/)?.[0] ?? 0);
    return Array.from({ length: Math.max(1, item.sets ?? 1) }, () => ({
      workout_exercise_id: row.id,
      reps,
      weight: 0,
    }));
  });
  if (sets.length > 0) {
    const { error: setsError } = await supabase.from('sets').insert(sets);
    if (setsError) throw setsError;
  }

  return workout.id as string;
};
