import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

interface ActiveWorkoutContextType {
  activeWorkoutId: string | null;
  activeWorkoutName: string;
  activeWorkoutDate: string | null;
  setActiveWorkout: (id: string, name: string, date: string) => void;
  clearActiveWorkout: () => void;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType>({
  activeWorkoutId: null,
  activeWorkoutName: "",
  activeWorkoutDate: null,
  setActiveWorkout: () => {},
  clearActiveWorkout: () => {},
});

export function ActiveWorkoutProvider({ children }: { children: ReactNode }) {
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [activeWorkoutName, setActiveWorkoutName] = useState("");
  const [activeWorkoutDate, setActiveWorkoutDate] = useState<string | null>(null);

  const setActiveWorkout = useCallback((id: string, name: string, date: string) => {
    setActiveWorkoutId(id);
    setActiveWorkoutName(name);
    setActiveWorkoutDate(date);
  }, []);

  const clearActiveWorkout = useCallback(() => {
    setActiveWorkoutId(null);
    setActiveWorkoutName("");
    setActiveWorkoutDate(null);
  }, []);

  return (
    <ActiveWorkoutContext.Provider
      value={{ activeWorkoutId, activeWorkoutName, activeWorkoutDate, setActiveWorkout, clearActiveWorkout }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export const useActiveWorkout = () => useContext(ActiveWorkoutContext);
