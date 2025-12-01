import React, { createContext, useContext, useState } from 'react';

interface MobileNavigationContextValue {
  hideBottomNav: boolean;
  setHideBottomNav: (hide: boolean) => void;
}

const MobileNavigationContext = createContext<
  MobileNavigationContextValue | undefined
>(undefined);

export function MobileNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hideBottomNav, setHideBottomNav] = useState(false);

  return (
    <MobileNavigationContext.Provider
      value={{ hideBottomNav, setHideBottomNav }}
    >
      {children}
    </MobileNavigationContext.Provider>
  );
}

export function useMobileNavigation() {
  const context = useContext(MobileNavigationContext);
  if (!context) {
    throw new Error(
      'useMobileNavigation must be used within MobileNavigationProvider'
    );
  }
  return context;
}
