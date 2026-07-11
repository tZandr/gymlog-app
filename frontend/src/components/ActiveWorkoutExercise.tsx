import type { IWorkoutExercise } from "../types/Workout";
import { AddSetForm } from "./AddSetForm";
import { WorkoutSetRow, type SetValueDraft, type SetType } from "./WorkoutSetRow";

interface Props {
  exercise: IWorkoutExercise;
  setValueDrafts: Record<string, SetValueDraft>;
  deletingSetId: string | null;
  personalBestSetIds: Set<string>;
  previousBestRepsPerSet: Map<string, number>;
  setTypes: Record<string, SetType>;
  completedSetIds: Set<string>;
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
  onCycleSetType: (setId: string) => void;
  onToggleComplete: (setId: string) => void;
}

export function ActiveWorkoutExercise({
  exercise,
  setValueDrafts,
  deletingSetId,
  personalBestSetIds,
  previousBestRepsPerSet,
  setTypes,
  completedSetIds,
  onAddSet,
  onSetValueChange,
  onSetValueCommit,
  onSwipeStart,
  onSwipeEnd,
  onSwipeCancel,
  onCycleSetType,
  onToggleComplete,
}: Props) {
  return (
    <div className="active-exercise">
      <div className="active-exercise__header">
        <h4>{exercise.exerciseName}</h4>
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
    </div>
  );
}
