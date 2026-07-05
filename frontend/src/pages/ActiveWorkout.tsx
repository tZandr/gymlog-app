import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addExercise,
  addSet,
  deleteSet,
  getWorkout,
  getWorkouts,
  updateSet,
} from "../api/workouts";
import { useExercises } from "../hooks/useExercises";
import type { IWorkout } from "../types/Workout";

type SetDraft = {
  reps: string;
  weight: string;
};

type SetValueDraft = Partial<SetDraft>;

type SwipeStart = {
  setId: string;
  x: number;
  y: number;
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
};

export default function ActiveWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { exercises, loading: exercisesLoading } = useExercises();
  const [workout, setWorkout] = useState<IWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [setDrafts, setSetDrafts] = useState<Record<string, SetDraft>>({});
  const [setValueDrafts, setSetValueDrafts] = useState<
    Record<string, SetValueDraft>
  >({});
  const [workoutHistory, setWorkoutHistory] = useState<IWorkout[]>([]);
  const [swipeStart, setSwipeStart] = useState<SwipeStart | null>(null);
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    Promise.all([getWorkout(id), getWorkouts()])
      .then(([selectedWorkout, workouts]) => {
        setWorkout(selectedWorkout);
        setWorkoutHistory(workouts);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!workout?.date) return;

    const startedAt = new Date(workout.date).getTime();
    const updateElapsed = () => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      );
    };

    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [workout?.date]);

  const addedExerciseIds = useMemo(
    () =>
      new Set(workout?.exercises.map((exercise) => exercise.exerciseId) ?? []),
    [workout?.exercises],
  );

  const availableExercises = exercises.filter(
    (exercise) => !addedExerciseIds.has(exercise._id),
  );

  const personalBestSetIds = useMemo(() => {
    if (!workout) return new Set<string>();

    const bestRepsByExerciseAndWeight = new Map<string, number>();
    const personalBests = new Set<string>();
    const previousWorkouts = workoutHistory
      .filter((historyWorkout) => historyWorkout._id !== workout._id)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

    const trackSet = (
      exerciseId: string,
      weight: number,
      reps: number,
      setId?: string,
    ) => {
      const key = `${exerciseId}:${weight}`;
      const previousBest = bestRepsByExerciseAndWeight.get(key) ?? 0;

      if (setId && reps > previousBest) {
        personalBests.add(setId);
      }

      if (reps > previousBest) {
        bestRepsByExerciseAndWeight.set(key, reps);
      }
    };

    previousWorkouts.forEach((historyWorkout) => {
      historyWorkout.exercises.forEach((exercise) => {
        exercise.sets.forEach((set) => {
          trackSet(exercise.exerciseId, set.weight, set.reps);
        });
      });
    });

    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        trackSet(exercise.exerciseId, set.weight, set.reps, set._id);
      });
    });

    return personalBests;
  }, [workout, workoutHistory]);

  const handleAddExercise = async (
    exerciseId: string,
    exerciseName: string,
  ) => {
    if (!id) return;

    const updated = await addExercise(id, { exerciseId, exerciseName });
    setWorkout(updated);
    setExercisePickerOpen(false);
  };

  const handleDraftChange = (
    exerciseId: string,
    field: keyof SetDraft,
    value: string,
  ) => {
    setSetDrafts((drafts) => ({
      ...drafts,
      [exerciseId]: {
        reps: drafts[exerciseId]?.reps ?? "",
        weight: drafts[exerciseId]?.weight ?? "",
        [field]: value,
      },
    }));
  };

  const handleAddSet = async (exerciseId: string) => {
    if (!id) return;

    const draft = setDrafts[exerciseId];
    const reps = Number(draft?.reps);
    const weight = Number(draft?.weight);

    if (
      !Number.isFinite(reps) ||
      !Number.isFinite(weight) ||
      reps <= 0 ||
      weight < 0
    ) {
      return;
    }

    const updated = await addSet(id, exerciseId, { reps, weight });
    setWorkout(updated);
    setSetDrafts((drafts) => ({
      ...drafts,
      [exerciseId]: { reps: "", weight: "" },
    }));
  };

  const handleSetValueChange = (
    setId: string,
    field: "reps" | "weight",
    value: string,
  ) => {
    setSetValueDrafts((drafts) => ({
      ...drafts,
      [setId]: {
        ...drafts[setId],
        [field]: value,
      },
    }));
  };

  const handleSetValueCommit = async (
    exerciseId: string,
    setId: string,
    field: "reps" | "weight",
    value: string,
  ) => {
    if (!id) return;

    const numericValue = Number(value);
    const isInvalid = field === "reps" ? numericValue <= 0 : numericValue < 0;
    if (!Number.isFinite(numericValue) || isInvalid) {
      const updated = await getWorkout(id);
      setWorkout(updated);
      setSetValueDrafts((drafts) => {
        const { [setId]: _removed, ...rest } = drafts;
        return rest;
      });
      return;
    }

    const updated = await updateSet(id, exerciseId, setId, {
      [field]: numericValue,
    });
    setWorkout(updated);
    setSetValueDrafts((drafts) => {
      const { [setId]: _removed, ...rest } = drafts;
      return rest;
    });
  };

  const handleDeleteSet = async (exerciseId: string, setId: string) => {
    if (!id) return;

    setDeletingSetId(setId);
    try {
      await deleteSet(id, exerciseId, setId);
      setWorkout((current) => {
        if (!current) return current;

        return {
          ...current,
          exercises: current.exercises.map((exercise) =>
            exercise._id === exerciseId
              ? {
                  ...exercise,
                  sets: exercise.sets.filter((set) => set._id !== setId),
                }
              : exercise,
          ),
        };
      });
    } finally {
      setDeletingSetId(null);
    }
  };

  const handleSwipeEnd = (
    exerciseId: string,
    setId: string,
    x: number,
    y: number,
  ) => {
    if (!swipeStart || swipeStart.setId !== setId) return;

    const deltaX = x - swipeStart.x;
    const deltaY = Math.abs(y - swipeStart.y);
    setSwipeStart(null);

    if (deltaX > 80 && deltaY < 50) {
      void handleDeleteSet(exerciseId, setId);
    }
  };

  if (loading) {
    return <p>Loading workout...</p>;
  }

  if (!workout) {
    return (
      <div className="empty-state">
        <p>Workout not found</p>
        <button onClick={() => navigate("/")}>Back home</button>
      </div>
    );
  }

  return (
    <div className="active-workout">
      <div className="page-header active-workout__header">
        <button onClick={() => navigate("/")}>Finish</button>
        <div>
          <h5>{workout.name}</h5>
          <span>{formatDuration(elapsedSeconds)}</span>
        </div>
      </div>

      <div className="section">
        <button onClick={() => setExercisePickerOpen((open) => !open)}>
          {exercisePickerOpen ? "Close exercises" : "Add exercise"}
        </button>

        {exercisePickerOpen && (
          <div className="exercise-picker">
            {exercisesLoading ? (
              <p>Loading exercises...</p>
            ) : availableExercises.length === 0 ? (
              <p>No more exercises to add</p>
            ) : (
              availableExercises.map((exercise) => (
                <button
                  key={exercise._id}
                  type="button"
                  onClick={() => handleAddExercise(exercise._id, exercise.name)}
                >
                  {exercise.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="section">
        {workout.exercises.length === 0 ? (
          <div className="empty-state">
            <p>Add an exercise to start logging sets</p>
          </div>
        ) : (
          workout.exercises.map((exercise) => {
            const draft = setDrafts[exercise._id] ?? { reps: "", weight: "" };

            return (
              <div key={exercise._id} className="active-exercise">
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
                      <div
                        key={set._id}
                        className={`set-row${deletingSetId === set._id ? " set-row--deleting" : ""}`}
                        onPointerDown={(event) =>
                          setSwipeStart({
                            setId: set._id,
                            x: event.clientX,
                            y: event.clientY,
                          })
                        }
                        onPointerUp={(event) =>
                          handleSwipeEnd(
                            exercise._id,
                            set._id,
                            event.clientX,
                            event.clientY,
                          )
                        }
                        onPointerCancel={() => setSwipeStart(null)}
                      >
                        {(() => {
                          const valueDraft = setValueDrafts[set._id];

                          return (
                            <>
                        <span className="set-row__lead">
                          <span className="set-row__number">{index + 1}</span>
                          {personalBestSetIds.has(set._id) && (
                            <span className="set-row__pb">PB!</span>
                          )}
                        </span>
                        <input
                          aria-label={`${exercise.exerciseName} set ${index + 1} reps`}
                          type="number"
                          min="1"
                          value={valueDraft?.reps ?? set.reps.toString()}
                          onPointerDown={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            handleSetValueChange(
                              set._id,
                              "reps",
                              event.target.value,
                            )
                          }
                          onBlur={() =>
                            handleSetValueCommit(
                              exercise._id,
                              set._id,
                              "reps",
                              valueDraft?.reps ?? set.reps.toString(),
                            )
                          }
                        />
                        <input
                          aria-label={`${exercise.exerciseName} set ${index + 1} weight`}
                          type="number"
                          min="0"
                          step="0.5"
                          value={valueDraft?.weight ?? set.weight.toString()}
                          onPointerDown={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            handleSetValueChange(
                              set._id,
                              "weight",
                              event.target.value,
                            )
                          }
                          onBlur={() =>
                            handleSetValueCommit(
                              exercise._id,
                              set._id,
                              "weight",
                              valueDraft?.weight ?? set.weight.toString(),
                            )
                          }
                        />
                            </>
                          );
                        })()}
                      </div>
                    ))
                  )}
                </div>

                <div className="set-form">
                  <input
                    type="number"
                    min="1"
                    placeholder="Reps"
                    value={draft.reps}
                    onChange={(event) =>
                      handleDraftChange(
                        exercise._id,
                        "reps",
                        event.target.value,
                      )
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Weight"
                    value={draft.weight}
                    onChange={(event) =>
                      handleDraftChange(
                        exercise._id,
                        "weight",
                        event.target.value,
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSet(exercise._id)}
                  >
                    Add set
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
