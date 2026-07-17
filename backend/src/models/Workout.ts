import { Schema, model, Types } from 'mongoose';

interface ISet {
  _id?: Types.ObjectId;
  reps: number;
  weight: number;
}

interface IWorkoutExercise {
  _id?: Types.ObjectId;
  exerciseId: string;
  exerciseName: string;
  sets: ISet[];
}

export interface IWorkout {
  name: string;
  gym: string;
  date: string;
  notes: string;
  exercises: IWorkoutExercise[];
  rating?: number;
  isTemplate?: boolean;
  durationSeconds?: number;
}

const setSchema = new Schema<ISet>({
  reps: { type: Number, required: true },
  weight: { type: Number, required: true },
});

const workoutExerciseSchema = new Schema<IWorkoutExercise>({
  exerciseId: { type: String, required: true },
  exerciseName: { type: String, required: true },
  sets: [setSchema],
});

const workoutSchema = new Schema<IWorkout>(
  {
    name: { type: String, required: true },
    gym: { type: String },
    date: { type: String, required: true },
    notes: { type: String },
    exercises: [workoutExerciseSchema],
    rating: { type: Number },
    isTemplate: { type: Boolean },
    durationSeconds: { type: Number },
  },
  { timestamps: true },
);

export const Workout = model<IWorkout>('Workout', workoutSchema);
