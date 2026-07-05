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
  onFinish: () => void;
  onWorkoutNameChange: (name: string) => void;
  onWorkoutNameCommit: (name: string) => void;
}

export function ActiveWorkoutHeader({
  workoutName,
  elapsedSeconds,
  onFinish,
  onWorkoutNameChange,
  onWorkoutNameCommit,
}: Props) {
  return (
    <div className="page-header active-workout__header">
      <button onClick={onFinish}>Finish</button>
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
      </div>
    </div>
  );
}
