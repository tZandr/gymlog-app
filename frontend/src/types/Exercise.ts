export interface IExercise {
  _id: string;
  name: string;
  muscleGroups: string[];
  category: string[];
  brand?: string;
  baseExercise?: string | null;
}
