import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActiveExercisePicker } from "../components/ActiveExercisePicker";
import { ActiveWorkoutExercise } from "../components/ActiveWorkoutExercise";
import { ActiveWorkoutHeader } from "../components/ActiveWorkoutHeader";
import type { SetDraft } from "../components/AddSetForm";
import type { SetValueDraft } from "../components/WorkoutSetRow";
import {
  addExercise,
  addSet,
  deleteSet,
  getWorkout,
  getWorkouts,
  updateSet,
  updateWorkout,
} from "../api/workouts";
import { useExercises } from "../hooks/useExercises";
import type { IExercise } from "../types/Exercise";
import type { IWorkout } from "../types/Workout";

type SwipeStart = {
  setId: string;
  x: number;
  y: number;
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

  const { personalBestSetIds, previousBestRepsPerSet } = useMemo(() => {
    if (!workout) return { personalBestSetIds: new Set<string>(), previousBestRepsPerSet: new Map<string, number>() };

    const bestRepsByExerciseAndWeight = new Map<string, number>();
    const personalBests = new Set<string>();
    const prevBestReps = new Map<string, number>();
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
        const key = `${exercise.exerciseId}:${set.weight}`;
        const previousBest = bestRepsByExerciseAndWeight.get(key) ?? 0;
        if (previousBest > 0) {
          prevBestReps.set(set._id, previousBest);
        }
        trackSet(exercise.exerciseId, set.weight, set.reps, set._id);
      });
    });

    return { personalBestSetIds: personalBests, previousBestRepsPerSet: prevBestReps };
  }, [workout, workoutHistory]);

  const handleAddExercise = async (exercise: IExercise) => {
    if (!id) return;

    const updated = await addExercise(id, {
      exerciseId: exercise._id,
      exerciseName: exercise.name,
    });
    setWorkout(updated);
    setExercisePickerOpen(false);
  };

  const handleWorkoutNameChange = (name: string) => {
    setWorkout((current) => (current ? { ...current, name } : current));
  };

  const handleWorkoutNameCommit = async (name: string) => {
    if (!id || !workout) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setWorkout({ ...workout, name: "Workout" });
      await updateWorkout(id, { name: "Workout" });
      return;
    }

    const updated = await updateWorkout(id, { name: trimmedName });
    setWorkout(updated);
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
      <ActiveWorkoutHeader
        workoutName={workout.name}
        elapsedSeconds={elapsedSeconds}
        onFinish={() => navigate("/")}
        onWorkoutNameChange={handleWorkoutNameChange}
        onWorkoutNameCommit={handleWorkoutNameCommit}
      />

      <div className="section">
        {workout.exercises.length === 0 ? (
          <div className="empty-state">
            <p>Add an exercise to start logging sets</p>
          </div>
        ) : (
          workout.exercises.map((exercise) => {
            const draft = setDrafts[exercise._id] ?? { reps: "", weight: "" };

            return (
              <ActiveWorkoutExercise
                key={exercise._id}
                exercise={exercise}
                setDraft={draft}
                setValueDrafts={setValueDrafts}
                deletingSetId={deletingSetId}
                personalBestSetIds={personalBestSetIds}
                previousBestRepsPerSet={previousBestRepsPerSet}
                onSetDraftChange={(field, value) =>
                  handleDraftChange(exercise._id, field, value)
                }
                onAddSet={() => handleAddSet(exercise._id)}
                onSetValueChange={handleSetValueChange}
                onSetValueCommit={(setId, field, value) =>
                  handleSetValueCommit(exercise._id, setId, field, value)
                }
                onSwipeStart={(setId, x, y) =>
                  setSwipeStart({ setId, x, y })
                }
                onSwipeEnd={(setId, x, y) =>
                  handleSwipeEnd(exercise._id, setId, x, y)
                }
                onSwipeCancel={() => setSwipeStart(null)}
              />
            );
          })
        )}
      </div>

      <ActiveExercisePicker
        exercises={availableExercises}
        loading={exercisesLoading}
        open={exercisePickerOpen}
        onToggle={() => setExercisePickerOpen((open) => !open)}
        onSelect={handleAddExercise}
      />
    </div>
  );
}
