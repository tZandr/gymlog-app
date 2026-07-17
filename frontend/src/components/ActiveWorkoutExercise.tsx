import { useState } from "react";
import { FaEllipsisH } from "react-icons/fa";
import type { IExercise } from "../types/Exercise";
import type { IWorkoutExercise } from "../types/Workout";
import { AddSetForm } from "./AddSetForm";
import { EditExerciseModal } from "./EditExerciseModal";
import { WorkoutSetRow, type SetValueDraft, type SetType } from "./WorkoutSetRow";

interface Props {
  exercise: IWorkoutExercise;
  setValueDrafts: Record<string, SetValueDraft>;
  deletingSetId: string | null;
  personalBestSetIds: Set<string>;
  previousBestRepsPerSet: Map<string, number>;
  setTypes: Record<string, SetType>;
  completedSetIds: Set<string>;
  fullExercise: IExercise | undefined;
  changeExercises: IExercise[];
  onAddSet: () => void;
  onSetValueChange: (setId: string, field: "reps" | "weight", value: string) => void;
  onSetValueCommit: (setId: string, field: "reps" | "weight", value: string) => void;
  onSwipeStart: (setId: string, x: number, y: number) => void;
  onSwipeEnd: (setId: string, x: number, y: number) => void;
  onSwipeCancel: () => void;
  onCycleSetType: (setId: string) => void;
  onToggleComplete: (setId: string) => void;
  onRemoveExercise: () => void;
  onChangeExercise: (newExercise: IExercise) => void;
  onExerciseUpdated: (updated: IExercise) => void;
}

export function ActiveWorkoutExercise({
  exercise,
  setValueDrafts,
  deletingSetId,
  personalBestSetIds,
  previousBestRepsPerSet,
  setTypes,
  completedSetIds,
  fullExercise,
  changeExercises,
  onAddSet,
  onSetValueChange,
  onSetValueCommit,
  onSwipeStart,
  onSwipeEnd,
  onSwipeCancel,
  onCycleSetType,
  onToggleComplete,
  onRemoveExercise,
  onChangeExercise,
  onExerciseUpdated,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePicker, setShowChangePicker] = useState(false);

  return (
    <div className="active-exercise">
      <div className="active-exercise__header">
        <div className="active-exercise__title">
          <h4>{exercise.exerciseName}</h4>
          <div className="exercise-menu">
            <button
              className="exercise-menu__trigger"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <FaEllipsisH />
            </button>
            {menuOpen && (
              <>
                <div className="exercise-menu__backdrop" onClick={() => setMenuOpen(false)} />
                <div className="exercise-menu__dropdown">
                  <button onClick={() => { setMenuOpen(false); setShowEditModal(true); }}>
                    Edit exercise
                  </button>
                  <button onClick={() => { setMenuOpen(false); setShowChangePicker(true); }}>
                    Change exercise
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => { setMenuOpen(false); onRemoveExercise(); }}
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="active-exercise__col-labels">
          <span className="active-exercise__col-labels__lead">
            <span>set</span>
            <span>pb</span>
          </span>
          <span>reps</span>
          <span>kg</span>
          <span>done</span>
        </div>
      </div>

      <div className="set-list">
        {exercise.sets.length === 0 ? (
          <p>No sets yet</p>
        ) : (
          exercise.sets.map((set, index) => (
            <WorkoutSetRow
              key={set._id}
              set={set}
              index={index}
              exerciseName={exercise.exerciseName}
              draft={setValueDrafts[set._id]}
              isDeleting={deletingSetId === set._id}
              isPersonalBest={personalBestSetIds.has(set._id)}
              previousBestReps={previousBestRepsPerSet.get(set._id)}
              setType={setTypes[set._id] ?? "normal"}
              isComplete={completedSetIds.has(set._id)}
              onSwipeStart={onSwipeStart}
              onSwipeEnd={onSwipeEnd}
              onSwipeCancel={onSwipeCancel}
              onValueChange={onSetValueChange}
              onValueCommit={onSetValueCommit}
              onCycleSetType={onCycleSetType}
              onToggleComplete={onToggleComplete}
            />
          ))
        )}
      </div>

      <AddSetForm onAddSet={onAddSet} />

      {showEditModal && fullExercise && (
        <EditExerciseModal
          exercise={fullExercise}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => { onExerciseUpdated(updated); setShowEditModal(false); }}
          onDeleted={() => { onRemoveExercise(); setShowEditModal(false); }}
        />
      )}

      {showChangePicker && (
        <div className="modal-overlay" onClick={() => setShowChangePicker(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h5>Change exercise</h5>
              <button type="button" className="modal__close" onClick={() => setShowChangePicker(false)}>✕</button>
            </div>
            <div className="exercise-picker">
              {changeExercises.length === 0 ? (
                <p>No other exercises available</p>
              ) : (
                changeExercises.map((ex) => (
                  <button
                    key={ex._id}
                    type="button"
                    onClick={() => { onChangeExercise(ex); setShowChangePicker(false); }}
                  >
                    {ex.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
