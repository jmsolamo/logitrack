import { Construction } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export default function ReviewerDashboardPage() {
  const { user } = useOutletContext();

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 animate-ping rounded-full bg-sidebar-primary/20" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary">
            <Construction className="h-5 w-5" />
          </div>
        </div>

        <h1 className="mb-2 text-base font-bold tracking-tight text-foreground md:text-lg">
          Reviewer Dashboard
        </h1>
        <p className="mb-5 text-[11px] text-muted-foreground md:text-xs">
          Welcome back, {user?.username || 'Reviewer'}. This dashboard will help you manage review requests, delivery assignments, and your workflow.
        </p>

        <div className="grid w-full grid-cols-1 gap-2 text-left md:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Status
            </div>
            <div className="text-[11px] font-medium">Pending reviewer requests</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Tasks
            </div>
            <div className="text-[11px] font-medium">Review assigned deliveries</div>
          </div>
        </div>
      </div>
    </div>
  );
}
