import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWorkout } from '../api/workouts';
import { useWorkouts } from '../hooks/useWorkouts';
import { WorkoutCard } from '../components/WorkoutCard';

export default function Home() {
  const { workouts, loading } = useWorkouts();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const startWorkout = async () => {
    try {
      setStarting(true);
      const workout = await createWorkout({
        name: 'Workout',
        gym: '',
        date: new Date().toISOString(),
        notes: '',
        exercises: [],
      });
      navigate(`/workouts/${workout._id}`);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h5>Workout</h5>
      </div>
      <div>
        <h5>Quick Start</h5>
        <div className="btn-group">
          <button onClick={startWorkout} disabled={starting}>
            {starting ? 'Starting...' : 'Start Workout'}
          </button>
          <button>Create Template</button>
        </div>
      </div>
      <div className="section">
        <h3>Saved Workouts</h3>
        {loading ? (
          <p>Loading...</p>
        ) : workouts.length === 0 ? (
          <div className="empty-state">
            <p>No workouts saved yet</p>
            <button onClick={startWorkout} disabled={starting}>
              {starting ? 'Starting...' : 'Start your first workout'}
            </button>
          </div>
        ) : (
          <div className="workout-list">
            {workouts.map((workout) => (
              <WorkoutCard key={workout._id} workout={workout} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
