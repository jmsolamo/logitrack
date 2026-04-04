import { Construction } from 'lucide-react';

function ApprovalPage() {
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
          Approvals Coming Soon
        </h1>
        <p className="mb-5 text-[11px] text-muted-foreground md:text-xs">
          We're building something amazing. This page is currently under construction
          and will be available in the next update.
        </p>

        <div className="grid w-full grid-cols-2 gap-2 text-left">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Module
            </div>
            <div className="text-[11px] font-medium">Workflow Engine</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Feature
            </div>
            <div className="text-[11px] font-medium">Registration Approval</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApprovalPage;
