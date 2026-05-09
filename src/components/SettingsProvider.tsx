'use client';

import React, { createContext, useContext } from 'react';

interface SettingsContextType {
  brandName?: string;
  logoUrl?: string;
  uiTemplates?: {
    theme?: string;
    logoFont?: string;
    bodyFont?: string;
  };
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ 
  children, 
  settings 
}: { 
  children: React.ReactNode; 
  settings: SettingsContextType;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined || context === null) {
    // Return empty settings instead of throwing or returning null
    return {} as SettingsContextType;
  }
  return context;
}
