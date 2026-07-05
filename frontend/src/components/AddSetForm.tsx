export type SetDraft = {
  reps: string;
  weight: string;
};

interface Props {
  draft: SetDraft;
  onChange: (field: keyof SetDraft, value: string) => void;
  onAddSet: () => void;
}

export function AddSetForm({ draft, onChange, onAddSet }: Props) {
  return (
    <div className="set-form">
      <input
        type="number"
        min="1"
        placeholder="Reps"
        value={draft.reps}
        onChange={(event) => onChange("reps", event.target.value)}
      />
      <input
        type="number"
        min="0"
        step="0.5"
        placeholder="Weight"
        value={draft.weight}
        onChange={(event) => onChange("weight", event.target.value)}
      />
      <button type="button" onClick={onAddSet}>
        Add set
      </button>
    </div>
  );
}
