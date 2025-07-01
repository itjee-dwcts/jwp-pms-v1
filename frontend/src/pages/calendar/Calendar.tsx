import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useCalendar } from '@/hooks/useCalendar';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  PlusIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'month' | 'week' | 'day' | 'list';

interface Event {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location: string | null;
  event_type: string;
  status: string;
  calendar: {
    id: number;
    name: string;
    color: string;
  };
  project: {
    id: number;
    name: string;
  } | null;
  task: {
    id: number;
    title: string;
  } | null;
  attendees: Array<{
    id: number;
    user: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
    };
    response_status: string;
  }>;
}

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const { getEvents, getCalendars } = useCalendar();

  const [events, setEvents] = useState<Event[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendars, setSelectedCalendars] = useState<number[]>([]);

  useEffect(() => {
    fetchCalendarsAndEvents();
  }, [currentDate, viewMode]);

  const fetchCalendarsAndEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const [calendarsData, eventsData] = await Promise.all([
        getCalendars(),
        getEvents({
          start_date: getViewStartDate(),
          end_date: getViewEndDate(),
          calendar_ids: selectedCalendars.length > 0 ? selectedCalendars : undefined,
        }),
      ]);

      setCalendars(calendarsData);
      setEvents(eventsData);

      // Initialize selected calendars if empty
      if (selectedCalendars.length === 0) {
        setSelectedCalendars(calendarsData.map((cal: any) => cal.id));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load calendar data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = (): string => {
    const date = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        date.setDate(1);
        date.setDate(date.getDate() - date.getDay());
        break;
      case 'week':
        date.setDate(date.getDate() - date.getDay());
        break;
      case 'day':
        break;
      case 'list':
        date.setDate(1);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  const getViewEndDate = (): string => {
    const date = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        date.setDate(date.getDate() + (6 - date.getDay()));
        break;
      case 'week':
        date.setDate(date.getDate() + 6);
        break;
      case 'day':
        break;
      case 'list':
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'list':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const toggleCalendar = (calendarId: number) => {
    setSelectedCalendars(prev =>
      prev.includes(calendarId)
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  const getDateTitle = (): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
    };

    switch (viewMode) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', options);
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'day':
        return currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'list':
        return currentDate.toLocaleDateString('en-US', options);
    }
  };

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);

      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_time);
        return eventDate.toDateString() === day.toDateString() &&
               selectedCalendars.includes(event.calendar.id);
      });

      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
      const isToday = day.toDateString() === today.toDateString();

      days.push(
        <div
          key={day.toISOString()}
          className={`min-h-[120px] border border-gray-200 dark:border-gray-700 p-2 ${
            isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className={`text-sm font-medium mb-2 ${
            isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'
          } ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            {day.getDate()}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                style={{ backgroundColor: event.calendar.color + '20', color: event.calendar.color }}
                onClick={() => navigate(`/calendar/events/${event.id}`)}
              >
                <div className="font-medium truncate">{event.title}</div>
                {!event.is_all_day && (
                  <div className="text-xs opacity-75">
                    {new Date(event.start_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="bg-gray-100 dark:bg-gray-800 p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderListView = () => {
    const filteredEvents = events.filter(event =>
      selectedCalendars.includes(event.calendar.id)
    ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    if (filteredEvents.length === 0) {
      return (
        <Card className="p-12 text-center">
          <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No events found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No events scheduled for this period
          </p>
          <Button onClick={() => navigate('/calendar/events/new')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <Card
            key={event.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/calendar/events/${event.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: event.calendar.color }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {event.title}
                  </h3>
                </div>

                {event.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {event.description}
                  </p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    {event.is_all_day ? (
                      <span>All day</span>
                    ) : (
                      <span>
                        {new Date(event.start_time).toLocaleString()} - {' '}
                        {new Date(event.end_time).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {event.location && (
                    <div>📍 {event.location}</div>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <Badge variant="outline">{event.calendar.name}</Badge>
                  {event.project && (
                    <Badge variant="outline">Project: {event.project.name}</Badge>
                  )}
                  {event.task && (
                    <Badge variant="outline">Task: {event.task.title}</Badge>
                  )}
                </div>
              </div>

              <div className="text-right">
                <Badge className={
                  event.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  event.status === 'tentative' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }>
                  {event.status.toUpperCase()}
                </Badge>

                {event.attendees.length > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <ErrorMessage message={error} onRetry={fetchCalendarsAndEvents} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage your events and schedule
          </p>
        </div>
        <Button onClick={() => navigate('/calendar/events/new')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {getDateTitle()}
          </h2>
        </div>

        {/* View Mode Toggles */}
        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('month')}
            className={`rounded-none ${viewMode === 'month' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
          >
            <Squares2X2Icon className="h-4 w-4 mr-1" />
            Month
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('week')}
            className={`rounded-none ${viewMode === 'week' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
          >
            <ViewColumnsIcon className="h-4 w-4 mr-1" />
            Week
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('day')}
            className={`rounded-none ${viewMode === 'day' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
          >
            Day
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={`rounded-none ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
          >
            <ListBulletIcon className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              My Calendars
            </h3>
            <div className="space-y-2">
              {calendars.map((calendar) => (
                <div key={calendar.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`calendar-${calendar.id}`}
                    checked={selectedCalendars.includes(calendar.id)}
                    onChange={() => toggleCalendar(calendar.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: calendar.color }}
                  />
                  <label
                    htmlFor={`calendar-${calendar.id}`}
                    className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                  >
                    {calendar.name}
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => navigate('/calendar/calendars/new')}
                className="w-full"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Calendar
              </Button>
            </div>
          </Card>
        </div>

        {/* Main Calendar Content */}
        <div className="lg:col-span-3">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'list' && renderListView()}
          {(viewMode === 'week' || viewMode === 'day') && (
            <Card className="p-8 text-center">
              <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {viewMode === 'week' ? 'Week' : 'Day'} View Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This view is currently under development. Please use Month or List view for now.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
