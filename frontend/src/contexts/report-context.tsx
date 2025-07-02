import { useReports } from '@/hooks/use-reports';
import React, { createContext, useContext } from 'react';

type ReportContextType = ReturnType<typeof useReports>;

const ReportContext = createContext<ReportContextType | null>(null);

interface ReportProviderProps {
  children: React.ReactNode;
}

export const ReportProvider: React.FC<ReportProviderProps> = ({ children }) => {
  const reportMethods = useReports();

  return (
    <ReportContext.Provider value={reportMethods}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReportContext = (): ReportContextType => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReportContext must be used within a ReportProvider');
  }
  return context;
};
