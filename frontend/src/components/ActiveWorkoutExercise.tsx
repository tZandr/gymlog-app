import type { IWorkoutExercise } from "../types/Workout";
import { AddSetForm, type SetDraft } from "./AddSetForm";
import { WorkoutSetRow, type SetValueDraft } from "./WorkoutSetRow";

interface Props {
  exercise: IWorkoutExercise;
  setDraft: SetDraft;
  setValueDrafts: Record<string, SetValueDraft>;
  deletingSetId: string | null;
  personalBestSetIds: Set<string>;
  previousBestRepsPerSet: Map<string, number>;
  onSetDraftChange: (field: keyof SetDraft, value: string) => void;
  onAddSet: () => void;
  onSetValueChange: (
    setId: string,
    field: "reps" | "weight",
    value: string,
  ) => void;
  onSetValueCommit: (
    setId: string,
    field: "reps" | "weight",
    value: string,
  ) => void;
  onSwipeStart: (setId: string, x: number, y: number) => void;
  onSwipeEnd: (setId: string, x: number, y: number) => void;
  onSwipeCancel: () => void;
}

export function ActiveWorkoutExercise({
  exercise,
  setDraft,
  setValueDrafts,
  deletingSetId,
  personalBestSetIds,
  previousBestRepsPerSet,
  onSetDraftChange,
  onAddSet,
  onSetValueChange,
  onSetValueCommit,
  onSwipeStart,
  onSwipeEnd,
  onSwipeCancel,
}: Props) {
  return (
    <div className="active-exercise">
      <div className="active-exercise__header">
        <h4>{exercise.exerciseName}</h4>
        <span>reps</span>
        <span>kg</span>
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
              onSwipeStart={onSwipeStart}
              onSwipeEnd={onSwipeEnd}
              onSwipeCancel={onSwipeCancel}
              onValueChange={onSetValueChange}
              onValueCommit={onSetValueCommit}
            />
          ))
        )}
      </div>

      <AddSetForm
        draft={setDraft}
        onChange={onSetDraftChange}
        onAddSet={onAddSet}
      />
    </div>
  );
}
