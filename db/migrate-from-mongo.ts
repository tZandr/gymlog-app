import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { createClient } from '@supabase/supabase-js';

const { MONGO_URI, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OWNER_USER_ID } = process.env;

for (const [key, value] of Object.entries({ MONGO_URI, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OWNER_USER_ID })) {
  if (!value) throw new Error(`Missing ${key} in db/.env`);
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const mongo = new MongoClient(MONGO_URI!);
await mongo.connect();
const mongoDb = mongo.db();

// --- profile ---
const mongoProfile = await mongoDb.collection('profiles').findOne({});
if (mongoProfile) {
  if (mongoProfile.avatarUrl) {
    console.warn(`Note: existing avatarUrl "${mongoProfile.avatarUrl}" points at the old local upload server and will not resolve. Re-upload the avatar via Supabase Storage after migrating.`);
  }
  const { error } = await supabase
    .from('profiles')
    .update({ name: mongoProfile.name ?? null, age: mongoProfile.age ?? null, avatar_url: mongoProfile.avatarUrl ?? null })
    .eq('id', OWNER_USER_ID);
  if (error) throw error;
  console.log('Migrated profile fields onto owner account.');
}

// --- exercises ---
const mongoExercises = await mongoDb.collection('exercises').find({}).toArray();
const exerciseIdMap = new Map<string, string>();

// Insert exercises with no baseExercise first, then ones that reference another exercise,
// so base_exercise_id can always resolve to an already-inserted row.
const withoutBase = mongoExercises.filter((e) => !e.baseExercise);
const withBase = mongoExercises.filter((e) => e.baseExercise);

for (const batch of [withoutBase, withBase]) {
  for (const ex of batch) {
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        name: ex.name,
        muscle_groups: ex.muscleGroups ?? [],
        category: ex.category ?? [],
        brand: ex.brand ?? null,
        base_exercise_id: ex.baseExercise ? exerciseIdMap.get(ex.baseExercise.toString()) ?? null : null,
      })
      .select('id')
      .single();
    if (error) throw error;
    exerciseIdMap.set(ex._id.toString(), data.id);
  }
}
console.log(`Migrated ${mongoExercises.length} exercises.`);

// --- workouts, workout_exercises, sets ---
const mongoWorkouts = await mongoDb.collection('workouts').find({}).toArray();
let workoutCount = 0;
let exerciseRowCount = 0;
let setCount = 0;

for (const w of mongoWorkouts) {
  const { data: workoutRow, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      user_id: OWNER_USER_ID,
      name: w.name,
      gym: w.gym || null,
      date: w.date,
      notes: w.notes || null,
      rating: w.rating ?? null,
      is_template: w.isTemplate ?? false,
      duration_seconds: w.durationSeconds ?? null,
    })
    .select('id')
    .single();
  if (workoutError) throw workoutError;
  workoutCount += 1;

  for (const we of w.exercises ?? []) {
    const exerciseId = exerciseIdMap.get(we.exerciseId?.toString());
    if (!exerciseId) {
      console.warn(`Skipping workout_exercise "${we.exerciseName}" in workout "${w.name}" -- its exercise no longer exists.`);
      continue;
    }

    const { data: weRow, error: weError } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: workoutRow.id,
        exercise_id: exerciseId,
        exercise_name: we.exerciseName,
      })
      .select('id')
      .single();
    if (weError) throw weError;
    exerciseRowCount += 1;

    const setsPayload = (we.sets ?? []).map((s: { reps: number; weight: number }) => ({
      workout_exercise_id: weRow.id,
      reps: s.reps,
      weight: s.weight,
    }));
    if (setsPayload.length > 0) {
      const { error: setsError } = await supabase.from('sets').insert(setsPayload);
      if (setsError) throw setsError;
      setCount += setsPayload.length;
    }
  }
}

console.log(`Migrated ${workoutCount} workouts, ${exerciseRowCount} workout_exercises, ${setCount} sets.`);

await mongo.close();
