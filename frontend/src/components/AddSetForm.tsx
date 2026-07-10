export type SetDraft = {
  reps: string;
  weight: string;
};

interface Props {
  onAddSet: () => void;
}

export function AddSetForm({ onAddSet }: Props) {
  return (
    <button type="button" className="set-form__btn" onClick={onAddSet}>
      + Add set
    </button>
  );
}
