import React, { createContext, useCallback, useContext, useState } from 'react';

interface DataContextType {
  dataVersion: number;
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataVersion, setDataVersion] = useState<number>(1);

  const refreshData = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  return (
    <DataContext.Provider value={{ dataVersion, refreshData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
