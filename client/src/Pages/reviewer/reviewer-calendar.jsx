import { CalendarDays } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export default function ReviewerCalendarPage() {
  const { user } = useOutletContext();

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 animate-ping rounded-full bg-sidebar-primary/20" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>

        <h1 className="mb-2 text-base font-bold tracking-tight text-foreground md:text-lg">
          Reviewer Calendar
        </h1>
        <p className="mb-5 text-[11px] text-muted-foreground md:text-xs">
          View your scheduled reviews and assigned delivery dates. This page will soon show your upcoming reviewer tasks.
        </p>
      </div>
    </div>
  );
}
