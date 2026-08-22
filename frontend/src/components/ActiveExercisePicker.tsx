import { useState } from "react";
import type { IExercise } from "../types/Exercise";

interface Props {
  exercises: IExercise[];
  loading: boolean;
  open: boolean;
  exercisePbs: Map<string, { reps: number; weight: number }>;
  onToggle: () => void;
  onSelect: (exercise: IExercise) => void;
  gym?: string;
  gymExerciseIds?: Set<string>;
}

export function ActiveExercisePicker({
  exercises,
  loading,
  open,
  exercisePbs,
  onToggle,
  onSelect,
  gym,
  gymExerciseIds,
}: Props) {
  const hasGymMatches = !!gym && (gymExerciseIds?.size ?? 0) > 0;
  const [priorGym, setPriorGym] = useState(gym);
  const [manualFilter, setManualFilter] = useState<boolean | null>(null);

  if (gym !== priorGym) {
    setPriorGym(gym);
    setManualFilter(null);
  }

  const filterToGym = manualFilter ?? hasGymMatches;

  const visibleExercises = filterToGym
    ? exercises.filter((exercise) => gymExerciseIds?.has(exercise._id))
    : exercises;

  return (
    <>
      <button className="exercise-picker-trigger" onClick={onToggle}>+ Add exercise</button>

      {open && (
        <div className="modal-overlay" onClick={onToggle}>
          <div className="modal exercise-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h5>Add exercise</h5>
              <button type="button" className="modal__close" onClick={onToggle}>✕</button>
            </div>
            {gym && (
              <div className="tag-group">
                <button
                  type="button"
                  className={`tag${filterToGym ? ' tag--active' : ''}`}
                  onClick={() => setManualFilter(!filterToGym)}
                >
                  At {gym}
                </button>
              </div>
            )}
            {loading ? (
              <p>Loading exercises...</p>
            ) : visibleExercises.length === 0 ? (
              <p>{filterToGym ? `No exercises logged at ${gym} yet` : 'No more exercises to add'}</p>
            ) : (
              <div className="exercise-picker">
                {visibleExercises.map((exercise) => {
                  const pb = exercisePbs.get(exercise._id);
                  return (
                    <button
                      key={exercise._id}
                      type="button"
                      className="exercise-picker__item"
                      onClick={() => { onSelect(exercise); onToggle(); }}
                    >
                      <span className="exercise-picker__name">{exercise.name}</span>
                      {pb && (
                        <span className="exercise-picker__pb">{pb.reps} x {pb.weight}kg</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
