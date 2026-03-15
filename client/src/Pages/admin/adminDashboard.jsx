import { Construction } from 'lucide-react';

function AdminDashboard() {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-sidebar-primary/20" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary">
            <Construction className="h-8 w-8" />
          </div>
        </div>
        
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Dashboard Coming Soon
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          We're building something amazing. This page is currently under construction 
          and will be available in the next update.
        </p>
        
        <div className="grid w-full grid-cols-2 gap-3 text-left">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Module
            </div>
            <div className="text-xs font-medium">Real-time Tracking</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Feature
            </div>
            <div className="text-xs font-medium">Advanced Analytics</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
