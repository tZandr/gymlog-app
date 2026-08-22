import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { GymPickerModal } from "./GymPickerModal";

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
};

interface Props {
  workoutName: string;
  elapsedSeconds: number;
  gym?: string;
  knownGyms: string[];
  onMinimize: () => void;
  onWorkoutNameChange: (name: string) => void;
  onWorkoutNameCommit: (name: string) => void;
  onGymChange: (gym: string) => void;
}

export function ActiveWorkoutHeader({
  workoutName,
  elapsedSeconds,
  gym,
  knownGyms,
  onMinimize,
  onWorkoutNameChange,
  onWorkoutNameCommit,
  onGymChange,
}: Props) {
  const [gymPickerOpen, setGymPickerOpen] = useState(false);

  return (
    <div className="page-header active-workout__header">
      <button className="active-workout__minimize-btn" onClick={onMinimize}>
        <FaChevronDown />
      </button>
      <div>
        <input
          aria-label="Workout name"
          className="active-workout__name-input"
          type="text"
          value={workoutName}
          onChange={(event) => onWorkoutNameChange(event.target.value)}
          onBlur={() => onWorkoutNameCommit(workoutName)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
        <span>{formatDuration(elapsedSeconds)}</span>
        <div className="tag-group">
          <button type="button" className="tag" onClick={() => setGymPickerOpen(true)}>
            {gym || "Set gym"}
          </button>
        </div>
      </div>

      {gymPickerOpen && (
        <GymPickerModal
          gyms={knownGyms}
          currentGym={gym}
          onSelect={(newGym) => { onGymChange(newGym); setGymPickerOpen(false); }}
          onClose={() => setGymPickerOpen(false)}
        />
      )}
    </div>
  );
}
