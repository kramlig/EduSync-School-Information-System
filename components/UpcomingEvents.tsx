import React from 'react';
import { CalendarDaysIcon, ClockIcon } from './icons';

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'exam' | 'meeting' | 'event' | 'deadline';
}

interface UpcomingEventsProps {
  events: UpcomingEvent[];
  maxItems?: number;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events, maxItems = 5 }) => {
  const displayedEvents = events
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, maxItems);

  const typeConfig = {
    exam: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Exam' },
    meeting: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Meeting' },
    event: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Event' },
    deadline: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Deadline' },
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (displayedEvents.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <CalendarDaysIcon />
        <p className="mt-2">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedEvents.map((event) => {
        const config = typeConfig[event.type];
        return (
          <div
            key={event.id}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${config.bg} ${config.text}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(event.date)}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {event.title}
                </h4>
                {event.time && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-600 dark:text-slate-400">
                    <ClockIcon className="h-3 w-3" />
                    <span>{event.time}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UpcomingEvents;
