import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  Loader2,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { useAppToast } from '../components/ui/alert-toast-provider';

function AnnouncementsHistoryPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired
  const navigate = useNavigate();
  const toast = useAppToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('/api/announcements/all');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcement history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilterStatus('all');
    toast.success('Filters cleared');
  };

  const isAnnouncementActive = (announcement) => {
    const now = new Date();
    const start = new Date(announcement.startDate);
    const end = new Date(announcement.endDate);
    return now >= start && now <= end;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.createdBy.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = isAnnouncementActive(a);
    } else if (filterStatus === 'expired') {
      matchesStatus = !isAnnouncementActive(a);
    }

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-14 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground uppercase">Announcement History</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">View all announcements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {/* Search & Filter Section */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-9 w-full rounded border border-input bg-card/50 px-2.5 py-2 pl-8 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 rounded border border-input bg-card/50 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
            >
              <option value="all">All Announcements</option>
              <option value="active">Active Now</option>
              <option value="expired">Expired</option>
            </select>

            {(searchQuery || filterStatus !== 'all') && (
              <button
                onClick={handleReset}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded px-3 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-primary active:scale-95"
                title="Clear filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Announcements Grid */}
        {filteredAnnouncements.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No announcements found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement._id}
                className={`rounded-lg border p-4 transition-all hover:shadow-md ${
                  isAnnouncementActive(announcement)
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                {/* Status Badge */}
                <div className="mb-3 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-tight border ${
                    isAnnouncementActive(announcement)
                      ? 'bg-green-500/10 text-green-600 border-green-500/20'
                      : 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isAnnouncementActive(announcement) ? 'bg-green-600' : 'bg-gray-600'}`} />
                    {isAnnouncementActive(announcement) ? 'ACTIVE' : 'EXPIRED'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mb-2 text-sm font-bold tracking-tight text-foreground line-clamp-2">
                  {announcement.title}
                </h3>

                {/* Content Preview */}
                <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                  {announcement.content}
                </p>

                {/* Date Range */}
                <div className="mb-3 space-y-1 border-t border-border/50 pt-3">
                  <div className="text-[10px] text-muted-foreground">
                    <strong>Start:</strong> {formatDate(announcement.startDate)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    <strong>End:</strong> {formatDate(announcement.endDate)}
                  </div>
                </div>

                {/* Target Roles & Created By */}
                <div className="space-y-1 border-t border-border/50 pt-3">
                  <div className="text-[10px] text-muted-foreground">
                    <strong>Posted by:</strong> {announcement.createdBy}
                  </div>
                  <div className="flex gap-1 flex-wrap mt-2">
                    {announcement.targetRoles.map(role => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight bg-primary/10 text-primary border border-primary/20"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Posted Date */}
                <div className="mt-3 text-[9px] text-muted-foreground border-t border-border/50 pt-2">
                  Posted: {formatDate(announcement.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {announcements.length > 0 && (
          <div className="mt-8 flex justify-center gap-4 rounded-lg border border-border/50 bg-muted/20 p-4">
            <div className="text-center">
              <div className="text-sm font-bold text-foreground">
                {announcements.length}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-tight">Total Announcements</div>
            </div>
            <div className="border-l border-border" />
            <div className="text-center">
              <div className="text-sm font-bold text-green-600">
                {announcements.filter(a => isAnnouncementActive(a)).length}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-tight">Active Now</div>
            </div>
            <div className="border-l border-border" />
            <div className="text-center">
              <div className="text-sm font-bold text-gray-600">
                {announcements.filter(a => !isAnnouncementActive(a)).length}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-tight">Expired</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AnnouncementsHistoryPage;
