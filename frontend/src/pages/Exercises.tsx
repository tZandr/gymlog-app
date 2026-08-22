import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useExercises } from '../hooks/useExercises';
import { ExerciseList } from '../components/ExerciseList';
import { ExerciseModal } from '../components/ExerciseModal';
import { EditExerciseModal } from '../components/EditExerciseModal';
import type { IExercise } from '../types/Exercise';

export default function Exercises() {
  const { exercises, setExercises } = useExercises();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<IExercise | null>(null);

  return (
    <div>
      <div className="page-header">
        <h5>Exercises</h5>
        <button className="cog-btn" onClick={() => setCreateOpen(true)}>
          <FaPlus />
        </button>
      </div>
      <div className="section">
        <ExerciseList exercises={exercises} onSelect={setSelected} />
      </div>

      {createOpen && (
        <ExerciseModal
          onClose={() => setCreateOpen(false)}
          onCreated={(exercise) => setExercises((prev) => [...prev, exercise])}
          exercises={exercises}
        />
      )}

      {selected && (
        <EditExerciseModal
          exercise={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) =>
            setExercises((prev) => prev.map((e) => (e._id === updated._id ? updated : e)))
          }
          onDeleted={(id) =>
            setExercises((prev) => prev.filter((e) => e._id !== id))
          }
          exercises={exercises}
        />
      )}
    </div>
  );
}
