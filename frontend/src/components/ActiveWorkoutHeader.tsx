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
}

export function ActiveWorkoutHeader({
  workoutName,
  elapsedSeconds,
  onFinish,
}: Props) {
  return (
    <div className="page-header active-workout__header">
      <button onClick={onFinish}>Finish</button>
      <div>
        <h5>{workoutName}</h5>
        <span>{formatDuration(elapsedSeconds)}</span>
      </div>
    </div>
  );
}
