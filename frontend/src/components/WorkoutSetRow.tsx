import type { ISet } from "../types/Workout";
import type { SetDraft } from "./AddSetForm";

export type SetValueDraft = Partial<SetDraft>;

interface Props {
  set: ISet;
  index: number;
  exerciseName: string;
  draft?: SetValueDraft;
  isDeleting: boolean;
  isPersonalBest: boolean;
  onSwipeStart: (setId: string, x: number, y: number) => void;
  onSwipeEnd: (setId: string, x: number, y: number) => void;
  onSwipeCancel: () => void;
  onValueChange: (setId: string, field: "reps" | "weight", value: string) => void;
  onValueCommit: (setId: string, field: "reps" | "weight", value: string) => void;
}

export function WorkoutSetRow({
  set,
  index,
  exerciseName,
  draft,
  isDeleting,
  isPersonalBest,
  onSwipeStart,
  onSwipeEnd,
  onSwipeCancel,
  onValueChange,
  onValueCommit,
}: Props) {
  const setNumber = index + 1;
  const repsValue = draft?.reps ?? set.reps.toString();
  const weightValue = draft?.weight ?? set.weight.toString();

  return (
    <div
      className={`set-row${isDeleting ? " set-row--deleting" : ""}`}
      onPointerDown={(event) =>
        onSwipeStart(set._id, event.clientX, event.clientY)
      }
      onPointerUp={(event) => onSwipeEnd(set._id, event.clientX, event.clientY)}
      onPointerCancel={onSwipeCancel}
    >
      <span className="set-row__lead">
        <span className="set-row__number">{setNumber}</span>
        {isPersonalBest && <span className="set-row__pb">PB!</span>}
      </span>
      <input
        aria-label={`${exerciseName} set ${setNumber} reps`}
        type="number"
        min="1"
        value={repsValue}
        onPointerDown={(event) => event.stopPropagation()}
        onChange={(event) => onValueChange(set._id, "reps", event.target.value)}
        onBlur={() => onValueCommit(set._id, "reps", repsValue)}
      />
      <input
        aria-label={`${exerciseName} set ${setNumber} weight`}
        type="number"
        min="0"
        step="0.5"
        value={weightValue}
        onPointerDown={(event) => event.stopPropagation()}
        onChange={(event) =>
          onValueChange(set._id, "weight", event.target.value)
        }
        onBlur={() => onValueCommit(set._id, "weight", weightValue)}
      />
    </div>
  );
}
