import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type GuestGateValue = {
  entered: boolean;
  enter: () => void;
};

const GuestGateContext = createContext<GuestGateValue | null>(null);

export function GuestGate({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);
  const enter = useCallback(() => setEntered(true), []);
  const value = useMemo(() => ({ entered, enter }), [entered, enter]);

  return <GuestGateContext.Provider value={value}>{children}</GuestGateContext.Provider>;
}

export function useGuestGate(): GuestGateValue {
  const value = useContext(GuestGateContext);
  if (!value) {
    throw new Error('useGuestGate must be used inside GuestGate');
  }
  return value;
}
