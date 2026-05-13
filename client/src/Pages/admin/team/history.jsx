import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, History, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { useAppToast } from '../../../components/ui/alert-toast-provider';
import AlertDialog from '../../../components/ui/alert-dialog';

function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const toast = useAppToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/history?limit=1000');
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load history logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      setIsClearing(true);
      await axios.delete('/api/history');
      toast.success('Login history cleared successfully');
      setLogs([]);
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Failed to clear logs');
    } finally {
      setIsClearing(false);
      setIsClearDialogOpen(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.ip_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Loading logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Login History Log
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
            Monitor system access and login attempts
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center border-b border-border pb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="SEARCH BY USERNAME, IP, OR REASON..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-card/50 px-3 py-1 pl-9 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
          />
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Showing {filteredLogs.length} logs
          </div>
          <button
            onClick={() => setIsClearDialogOpen(true)}
            disabled={logs.length === 0}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-red-500/10 px-4 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear Logs
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-bold uppercase tracking-widest text-muted-foreground">Date & Time</th>
              <th className="px-4 py-3 font-bold uppercase tracking-widest text-muted-foreground">Username</th>
              <th className="px-4 py-3 font-bold uppercase tracking-widest text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-bold uppercase tracking-widest text-muted-foreground">Reason</th>
              <th className="px-4 py-3 font-bold uppercase tracking-widest text-muted-foreground">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground/80">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">
                    {log.username}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.status === 'Success' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-red-600 border border-red-500/20">
                        <XCircle className="h-3 w-3" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-medium truncate max-w-[200px]" title={log.reason}>
                    {log.reason || '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-medium font-mono text-[10px]">
                    {log.ip_address || '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <History className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-[11px] font-bold uppercase tracking-widest">No logs found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog
        isOpen={isClearDialogOpen}
        title="Clear Login History"
        description="Are you sure you want to delete all login history logs? This action cannot be undone and will permanently remove all authentication tracking records."
        onConfirm={handleClearLogs}
        onCancel={() => setIsClearDialogOpen(false)}
        isLoading={isClearing}
        destructive
      />
    </div>
  );
}

export default HistoryPage;
