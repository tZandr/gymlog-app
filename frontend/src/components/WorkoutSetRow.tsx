import { FaCheck } from "react-icons/fa";
import type { ISet } from "../types/Workout";
import type { SetDraft } from "./AddSetForm";

export type SetValueDraft = Partial<SetDraft>;
export type SetType = "normal" | "warmup" | "drop";

interface Props {
  set: ISet;
  index: number;
  exerciseName: string;
  draft?: SetValueDraft;
  isDeleting: boolean;
  isPersonalBest: boolean;
  previousBestReps?: number;
  setType: SetType;
  isComplete: boolean;
  onSwipeStart: (setId: string, x: number, y: number) => void;
  onSwipeEnd: (setId: string, x: number, y: number) => void;
  onSwipeCancel: () => void;
  onValueChange: (setId: string, field: "reps" | "weight", value: string) => void;
  onValueCommit: (setId: string, field: "reps" | "weight", value: string) => void;
  onCycleSetType: (setId: string) => void;
  onToggleComplete: (setId: string) => void;
}

export function WorkoutSetRow({
  set,
  index,
  exerciseName,
  draft,
  isDeleting,
  isPersonalBest,
  previousBestReps,
  setType,
  isComplete,
  onSwipeStart,
  onSwipeEnd,
  onSwipeCancel,
  onValueChange,
  onValueCommit,
  onCycleSetType,
  onToggleComplete,
}: Props) {
  const setNumber = index + 1;
  const repsValue = draft?.reps ?? set.reps.toString();
  const weightValue = draft?.weight ?? set.weight.toString();
  const typeLabel = setType === "warmup" ? "W" : setType === "drop" ? "D" : setNumber;

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
        <span
          className={`set-row__number set-row__number--${setType}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onCycleSetType(set._id)}
        >
          {typeLabel}
        </span>
        {isPersonalBest
          ? <span className="set-row__pb">PB!</span>
          : previousBestReps && <span className="set-row__prev-pb">PB: {previousBestReps}x{set.weight}kg</span>
        }
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
      <button
        type="button"
        className={`set-row__complete${isComplete ? " set-row__complete--done" : ""}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onToggleComplete(set._id)}
        aria-label={`Mark set ${setNumber} as ${isComplete ? "incomplete" : "complete"}`}
      >
        <FaCheck />
      </button>
    </div>
  );
}
