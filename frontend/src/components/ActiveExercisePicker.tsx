import type { IExercise } from "../types/Exercise";

interface Props {
  exercises: IExercise[];
  loading: boolean;
  open: boolean;
  exercisePbs: Map<string, { reps: number; weight: number }>;
  onToggle: () => void;
  onSelect: (exercise: IExercise) => void;
}

export function ActiveExercisePicker({
  exercises,
  loading,
  open,
  exercisePbs,
  onToggle,
  onSelect,
}: Props) {
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
            {loading ? (
              <p>Loading exercises...</p>
            ) : exercises.length === 0 ? (
              <p>No more exercises to add</p>
            ) : (
              <div className="exercise-picker">
                {exercises.map((exercise) => {
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
