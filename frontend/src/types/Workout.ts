export interface ISet {
  _id: string;
  reps: number;
  weight: number;
}

export interface IWorkoutExercise {
  _id: string;
  exerciseId: string;
  exerciseName: string;
  sets: ISet[];
}

export interface IWorkout {
  _id: string;
  name: string;
  gym: string;
  date: string;
  notes: string;
  exercises: IWorkoutExercise[];
  rating?: number;
  isTemplate?: boolean;
  durationSeconds?: number;
}
