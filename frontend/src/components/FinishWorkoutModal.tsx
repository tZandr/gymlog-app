import { useState } from "react";

interface Props {
  onFinish: (rating: number, saveAsTemplate: boolean) => void;
  onCancel: () => void;
  onDiscard: () => void;
}

const RATINGS = [
  { value: 1, label: "Bad" },
  { value: 2, label: "Okay" },
  { value: 3, label: "Good" },
  { value: 4, label: "Great" },
  { value: 5, label: "Amazing" },
];

export function FinishWorkoutModal({ onFinish, onCancel, onDiscard }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if (confirmDiscard) {
    return (
      <div className="modal-overlay">
        <div className="modal finish-modal">
          <h5>Discard workout?</h5>
          <p className="finish-modal__discard-warning">
            This will permanently delete the entire workout and all recorded sets. This cannot be undone.
          </p>
          <div className="finish-modal__actions">
            <button type="button" className="btn-danger" onClick={onDiscard}>
              Yes, delete workout
            </button>
            <button type="button" onClick={() => setConfirmDiscard(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal finish-modal">
        <h5>How did it feel?</h5>
        <div className="finish-modal__ratings">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              type="button"
              className={`finish-modal__rating${rating === r.value ? " finish-modal__rating--selected" : ""}`}
              onClick={() => setRating(r.value)}
            >
              <span className="finish-modal__num">{r.value}</span>
              <span className="finish-modal__label">{r.label}</span>
            </button>
          ))}
        </div>

        <div className="finish-modal__template-row">
          <span>Save as template</span>
          <button
            type="button"
            className={`toggle${saveAsTemplate ? " toggle--on" : ""}`}
            onClick={() => setSaveAsTemplate((t) => !t)}
          />
        </div>

        <div className="finish-modal__actions">
          <button
            type="button"
            className="btn-success"
            disabled={rating === null}
            onClick={() => rating !== null && onFinish(rating, saveAsTemplate)}
          >
            Finish Workout
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="finish-modal__discard-link"
            onClick={() => setConfirmDiscard(true)}
          >
            Discard workout
          </button>
        </div>
      </div>
    </div>
  );
}
