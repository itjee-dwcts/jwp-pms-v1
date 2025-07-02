import { useCalendar } from '@/hooks/use-calendar';
import React, { createContext, useContext } from 'react';

type CalendarContextType = ReturnType<typeof useCalendar>;

const CalendarContext = createContext<CalendarContextType | null>(null);

interface CalendarProviderProps {
  children: React.ReactNode;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const calendarMethods = useCalendar();

  return (
    <CalendarContext.Provider value={calendarMethods}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendarContext = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
};
