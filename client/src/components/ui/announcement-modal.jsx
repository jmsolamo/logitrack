import React from 'react';
import { X, Bell } from 'lucide-react';

const AnnouncementModal = ({ isOpen, announcements, onClose }) => {
  if (!isOpen || !announcements || announcements.length === 0) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border border-border bg-background shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground uppercase">
                New Announcements
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} for you
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Announcements List */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3 p-6">
            {announcements.map((announcement, index) => (
              <div
                key={announcement._id}
                className="group rounded-lg border border-border/50 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md animate-in fade-in slide-in-from-top-2 duration-300"
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                {/* Announcement Header */}
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="flex-1 text-sm font-bold tracking-tight text-foreground pr-2">
                    {announcement.title}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-tight bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Active
                  </span>
                </div>

                {/* Announcement Content */}
                <p className="text-[12px] leading-relaxed text-muted-foreground whitespace-pre-wrap mb-3">
                  {announcement.content}
                </p>

                {/* Announcement Footer */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      <strong>Posted by:</strong> {announcement.createdBy}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(announcement.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-border bg-muted/50 px-6 py-3 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-bold text-[12px] uppercase tracking-tight transition-all hover:bg-primary/90 active:scale-95"
          >
            Got It, Thanks
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
