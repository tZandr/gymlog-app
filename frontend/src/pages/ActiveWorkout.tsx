import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActiveExercisePicker } from "../components/ActiveExercisePicker";
import { ActiveWorkoutExercise } from "../components/ActiveWorkoutExercise";
import { ActiveWorkoutHeader } from "../components/ActiveWorkoutHeader";
import { FinishWorkoutModal } from "../components/FinishWorkoutModal";
import { useActiveWorkout } from "../context/ActiveWorkoutContext";

import type { SetValueDraft } from "../components/WorkoutSetRow";
import {
  addExercise,
  addSet,
  deleteSet,
  deleteExercise as removeExerciseFromWorkout,
  deleteWorkout,
  getWorkout,
  getWorkouts,
  updateSet,
  updateWorkout,
} from "../api/workouts";
import { useExercises } from "../hooks/useExercises";
import type { IExercise } from "../types/Exercise";
import type { IWorkout, IWorkoutExercise } from "../types/Workout";
import type { SetType } from "../components/WorkoutSetRow";

type SwipeStart = {
  setId: string;
  x: number;
  y: number;
};

export default function ActiveWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveWorkout, clearActiveWorkout } = useActiveWorkout();
  const { exercises, loading: exercisesLoading } = useExercises();
  const [workout, setWorkout] = useState<IWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [setTypes, setSetTypes] = useState<Record<string, SetType>>({});
  const [completedSetIds, setCompletedSetIds] = useState<Set<string>>(new Set());
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
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
    if (!id || !workout) return;
    setActiveWorkout(id, workout.name, workout.date);
  }, [id, workout?._id, workout?.name, workout?.date, setActiveWorkout]);

  useEffect(() => {
    if (!workout?.date) return;

    const startedAt = new Date(workout.date).getTime();
    const updateElapsed = () => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      );
    };

    updateElapsed();
    timerRef.current = window.setInterval(updateElapsed, 1000);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [workout?.date]);

  const addedExerciseIds = useMemo(
    () =>
      new Set(workout?.exercises.map((exercise) => exercise.exerciseId) ?? []),
    [workout?.exercises],
  );

  const availableExercises = exercises.filter(
    (exercise) => !addedExerciseIds.has(exercise._id),
  );

  const exercisePbs = useMemo(() => {
    const pbs = new Map<string, { reps: number; weight: number }>();
    workoutHistory.forEach((w) => {
      w.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          const current = pbs.get(ex.exerciseId);
          if (!current || set.weight > current.weight || (set.weight === current.weight && set.reps > current.reps)) {
            pbs.set(ex.exerciseId, { reps: set.reps, weight: set.weight });
          }
        });
      });
    });
    return pbs;
  }, [workoutHistory]);

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

  const handleRemoveExercise = async (workoutExerciseId: string) => {
    if (!id) return;
    await removeExerciseFromWorkout(id, workoutExerciseId);
    setWorkout((current) =>
      current
        ? { ...current, exercises: current.exercises.filter((e) => e._id !== workoutExerciseId) }
        : current,
    );
  };

  const handleChangeExercise = async (workoutExercise: IWorkoutExercise, newExercise: IExercise) => {
    if (!id) return;
    await removeExerciseFromWorkout(id, workoutExercise._id);
    const updated = await addExercise(id, { exerciseId: newExercise._id, exerciseName: newExercise.name });
    const newWorkoutExercise = updated.exercises.find((e) => e.exerciseId === newExercise._id);
    const withSet = newWorkoutExercise
      ? await addSet(id, newWorkoutExercise._id, { reps: 1, weight: 0 })
      : updated;
    setWorkout(withSet);
  };

  const handleExerciseUpdated = (workoutExerciseId: string, updated: IExercise) => {
    setWorkout((current) =>
      current
        ? {
            ...current,
            exercises: current.exercises.map((e) =>
              e._id === workoutExerciseId ? { ...e, exerciseName: updated.name } : e,
            ),
          }
        : current,
    );
  };

  const handleAddExercise = async (exercise: IExercise) => {
    if (!id) return;

    const updated = await addExercise(id, {
      exerciseId: exercise._id,
      exerciseName: exercise.name,
    });

    const newExercise = updated.exercises.find(e => e.exerciseId === exercise._id);
    const withSet = newExercise
      ? await addSet(id, newExercise._id, { reps: 0, weight: 0 })
      : updated;

    setWorkout(withSet);
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

  const handleAddSet = async (exercise: IWorkoutExercise) => {
    if (!id) return;

    const lastSet = exercise.sets[exercise.sets.length - 1];
    const reps = lastSet?.reps ?? 1;
    const weight = lastSet?.weight ?? 0;

    const updated = await addSet(id, exercise._id, { reps, weight });
    setWorkout(updated);
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

  const handleCycleSetType = (setId: string) => {
    setSetTypes((prev) => {
      const current = prev[setId] ?? "normal";
      const next: SetType =
        current === "normal" ? "warmup" : current === "warmup" ? "drop" : "normal";
      return { ...prev, [setId]: next };
    });
  };

  const handleToggleComplete = (setId: string) => {
    setCompletedSetIds((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) next.delete(setId);
      else next.add(setId);
      return next;
    });
  };

  const handleMinimize = () => {
    setLeaving(true);
    setTimeout(() => navigate("/"), 350);
  };

  const handleDiscardWorkout = async () => {
    if (!id) return;
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    await deleteWorkout(id);
    clearActiveWorkout();
    navigate("/");
  };

  const handleFinishWorkout = async (rating: number, saveAsTemplate: boolean) => {
    if (!id) return;
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    await updateWorkout(id, { rating, isTemplate: saveAsTemplate, durationSeconds: elapsedSeconds });
    clearActiveWorkout();
    navigate("/");
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
    <div className={`active-workout${leaving ? " active-workout--leaving" : ""}`}>
      <ActiveWorkoutHeader
        workoutName={workout.name}
        elapsedSeconds={elapsedSeconds}
        onMinimize={handleMinimize}
        onWorkoutNameChange={handleWorkoutNameChange}
        onWorkoutNameCommit={handleWorkoutNameCommit}
      />

      {showFinishModal && (
        <FinishWorkoutModal
          onFinish={handleFinishWorkout}
          onCancel={() => setShowFinishModal(false)}
          onDiscard={handleDiscardWorkout}
        />
      )}

      <div className="section">
        {workout.exercises.length === 0 ? (
          <div className="empty-state">
            <p>Add an exercise to start logging sets</p>
          </div>
        ) : (
          workout.exercises.map((exercise) => {
            return (
              <ActiveWorkoutExercise
                key={exercise._id}
                exercise={exercise}
                setValueDrafts={setValueDrafts}
                deletingSetId={deletingSetId}
                personalBestSetIds={personalBestSetIds}
                previousBestRepsPerSet={previousBestRepsPerSet}
                setTypes={setTypes}
                completedSetIds={completedSetIds}
                onCycleSetType={handleCycleSetType}
                onToggleComplete={handleToggleComplete}
                onAddSet={() => handleAddSet(exercise)}
                fullExercise={exercises.find((e) => e._id === exercise.exerciseId)}
                changeExercises={availableExercises}
                onRemoveExercise={() => handleRemoveExercise(exercise._id)}
                onChangeExercise={(newExercise) => handleChangeExercise(exercise, newExercise)}
                onExerciseUpdated={(updated) => handleExerciseUpdated(exercise._id, updated)}
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
        exercisePbs={exercisePbs}
        onToggle={() => setExercisePickerOpen((open) => !open)}
        onSelect={handleAddExercise}
      />

      <div className="active-workout__bottom-actions">
        <button type="button" className="btn-success" onClick={() => setShowFinishModal(true)}>
          Finish Workout
        </button>
      </div>
    </div>
  );
}
