import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface PendingCountContextType {
  pendingCount: number;
  setPendingCount: (count: number) => void;
  decrementPending: () => void;
}

const PendingCountContext = createContext<PendingCountContextType | undefined>(undefined);

export function PendingCountProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState<number>(0);

  const decrementPending = useCallback(() => {
    setPendingCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <PendingCountContext.Provider value={{ pendingCount, setPendingCount, decrementPending }}>
      {children}
    </PendingCountContext.Provider>
  );
}

export function usePendingCount() {
  const context = useContext(PendingCountContext);
  if (context === undefined) {
    throw new Error("usePendingCount must be used within a PendingCountProvider");
  }
  return context;
}
