import { useState } from 'react';
import { createExercise } from '../api/Exercises';
import type { IExercise } from '../types/Exercise';

const MUSCLE_GROUPS = [
  'Quads', 'Hamstrings', 'Glutes', 'Chest', 'Lats',
  'Lower back', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Traps',
];

const CATEGORIES = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Duration'];

const BRANDS = [
  'HOIST', 'Hammer Strength', 'Arsenal', 'Life Fitness', 'Precor', 'Cybex', 'gymleco', 'gym80', 'Generic',
];

interface Props {
  onClose: () => void;
  onCreated: (exercise: IExercise) => void;
  exercises?: IExercise[];
}

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function ExerciseModal({ onClose, onCreated, exercises = [] }: Props) {
  const [name, setName] = useState('');
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [brandSelect, setBrandSelect] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [baseExercise, setBaseExercise] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const brand = brandSelect === 'Other' ? customBrand.trim() : brandSelect;
    const exercise = await createExercise({
      name,
      muscleGroups,
      category: category ? [category] : [],
      brand: brand || undefined,
      baseExercise: baseExercise || null,
    });
    onCreated(exercise);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h5>New Exercise</h5>
          <button type="button" className="modal__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>Muscle groups</label>
          <div className="tag-group">
            {MUSCLE_GROUPS.map((mg) => (
              <button
                key={mg}
                type="button"
                className={`tag${muscleGroups.includes(mg) ? ' tag--active' : ''}`}
                onClick={() => setMuscleGroups(toggle(muscleGroups, mg))}
              >
                {mg}
              </button>
            ))}
          </div>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
          <label>
            Brand
            <select value={brandSelect} onChange={(e) => setBrandSelect(e.target.value)}>
              <option value="">Select brand</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
              <option value="Other">Other…</option>
            </select>
          </label>
          {brandSelect === 'Other' && (
            <label>
              Custom brand
              <input
                type="text"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
              />
            </label>
          )}
          <label>
            Based on
            <select value={baseExercise} onChange={(e) => setBaseExercise(e.target.value)}>
              <option value="">None</option>
              {exercises.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.name}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-success">Save</button>
        </form>
      </div>
    </div>
  );
}
