import { supabase } from '../lib/supabaseClient';
import type { IProgram, IProgramDay, IProgramExercise } from '../types/Platform';

const PROGRAM_SELECT =
  '*, program_days(id, name, position, program_exercises(id, position, name, sets, reps, rest, feeder, comment, link))';

interface ExerciseRow {
  id: string;
  position: number;
  name: string;
  sets: number | null;
  reps: string | null;
  rest: string | null;
  feeder: string | null;
  comment: string | null;
  link: string | null;
}
interface DayRow {
  id: string;
  name: string;
  position: number;
  program_exercises: ExerciseRow[] | null;
}
interface ProgramRow {
  id: string;
  coach_id: string;
  name: string;
  status: 'draft' | 'sent';
  client_id: string | null;
  message: string | null;
  sent_at: string | null;
  updated_at: string;
  program_days: DayRow[] | null;
}

function mapExercise(r: ExerciseRow): IProgramExercise {
  return {
    id: r.id,
    name: r.name,
    sets: r.sets,
    reps: r.reps ?? '',
    rest: r.rest ?? '',
    feeder: r.feeder ?? '',
    comment: r.comment ?? '',
    link: r.link ?? '',
  };
}

function mapDay(r: DayRow): IProgramDay {
  return {
    id: r.id,
    name: r.name,
    exercises: [...(r.program_exercises ?? [])].sort((a, b) => a.position - b.position).map(mapExercise),
  };
}

function mapProgram(r: ProgramRow): IProgram {
  return {
    id: r.id,
    coachId: r.coach_id,
    name: r.name,
    status: r.status,
    clientId: r.client_id,
    message: r.message ?? '',
    sentAt: r.sent_at,
    updatedAt: r.updated_at,
    days: [...(r.program_days ?? [])].sort((a, b) => a.position - b.position).map(mapDay),
  };
}

/** Programs the signed-in user can see: their own drafts/sent programs (coach) or ones sent to them (client). */
export const getPrograms = async (): Promise<IProgram[]> => {
  const { data, error } = await supabase
    .from('programs')
    .select(PROGRAM_SELECT)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ProgramRow[]).map(mapProgram);
};

export const getProgram = async (id: string): Promise<IProgram> => {
  const { data, error } = await supabase.from('programs').select(PROGRAM_SELECT).eq('id', id).single();
  if (error) throw new Error(error.message);
  return mapProgram(data as ProgramRow);
};

export interface ProgramDraft {
  id?: string;
  name: string;
  days: { name: string; exercises: Omit<IProgramExercise, 'id'>[] }[];
}

export const saveProgram = async (draft: ProgramDraft): Promise<string> => {
  const payload = {
    id: draft.id ?? null,
    name: draft.name,
    days: draft.days.map((d) => ({
      name: d.name,
      exercises: d.exercises.map((e) => ({
        name: e.name,
        sets: e.sets === null ? '' : String(e.sets),
        reps: e.reps,
        rest: e.rest,
        feeder: e.feeder,
        comment: e.comment,
        link: e.link,
      })),
    })),
  };
  const { data, error } = await supabase.rpc('save_program', { p: payload });
  if (error) throw new Error(error.message);
  return data as string;
};

export const sendProgram = async (programId: string, clientId: string, message: string): Promise<void> => {
  const { error } = await supabase.rpc('send_program', {
    p_program: programId,
    p_client_id: clientId,
    p_message: message,
  });
  if (error) throw new Error(error.message);
};

export const duplicateProgram = async (programId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('duplicate_program', { p_program: programId });
  if (error) throw new Error(error.message);
  return data as string;
};

export const deleteProgram = async (programId: string): Promise<void> => {
  const { error } = await supabase.from('programs').delete().eq('id', programId);
  if (error) throw new Error(error.message);
};
