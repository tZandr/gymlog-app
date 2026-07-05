import type { IExercise } from "../types/Exercise";

interface Props {
  exercises: IExercise[];
  loading: boolean;
  open: boolean;
  onToggle: () => void;
  onSelect: (exercise: IExercise) => void;
}

export function ActiveExercisePicker({
  exercises,
  loading,
  open,
  onToggle,
  onSelect,
}: Props) {
  return (
    <div className="section">
      <button onClick={onToggle}>
        {open ? "Close exercises" : "Add exercise"}
      </button>

      {open && (
        <div className="exercise-picker">
          {loading ? (
            <p>Loading exercises...</p>
          ) : exercises.length === 0 ? (
            <p>No more exercises to add</p>
          ) : (
            exercises.map((exercise) => (
              <button
                key={exercise._id}
                type="button"
                onClick={() => onSelect(exercise)}
              >
                {exercise.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
