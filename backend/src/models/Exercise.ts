import { Schema, model, Types } from 'mongoose';

export interface IExercise {
  name: string;
  muscleGroups: string[];
  category: string[];
  brand?: string;
  baseExercise?: Types.ObjectId | null;
}

const exerciseSchema = new Schema<IExercise>(
  {
    name: { type: String, required: true },
    muscleGroups: { type: [String], default: [] },
    category: { type: [String], default: [] },
    brand: { type: String },
    baseExercise: { type: Schema.Types.ObjectId, ref: 'Exercise', default: null },
  },
  { timestamps: true },
);

export const Exercise = model<IExercise>('Exercise', exerciseSchema);
