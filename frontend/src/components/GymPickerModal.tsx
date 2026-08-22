import { useState } from 'react';

interface Props {
  gyms: string[];
  currentGym?: string;
  onSelect: (gym: string) => void;
  onClose: () => void;
}

export function GymPickerModal({ gyms, currentGym, onSelect, onClose }: Props) {
  const [customGym, setCustomGym] = useState('');

  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = customGym.trim();
    if (!trimmed) return;
    onSelect(trimmed);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h5>Which gym?</h5>
          <button type="button" className="modal__close" onClick={onClose}>✕</button>
        </div>
        {gyms.length > 0 && (
          <>
            <label>Recent gyms</label>
            <div className="tag-group">
              {gyms.map((gym) => (
                <button
                  key={gym}
                  type="button"
                  className={`tag${gym === currentGym ? ' tag--active' : ''}`}
                  onClick={() => onSelect(gym)}
                >
                  {gym}
                </button>
              ))}
            </div>
          </>
        )}
        <form onSubmit={handleAddCustom}>
          <label>
            New gym
            <input
              type="text"
              value={customGym}
              onChange={(e) => setCustomGym(e.target.value)}
              placeholder="Gym name"
            />
          </label>
          <button type="submit" className="btn-success">Add & select</button>
        </form>
        <button type="button" onClick={() => onSelect('')}>Skip / no gym</button>
      </div>
    </div>
  );
}
