import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Loader2,
  ClipboardList,
  Search,
  CheckCircle2,
  X,
  AlertTriangle,
  Truck,
  CalendarDays,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import axios from 'axios';
import { useAppToast } from '../../components/ui/alert-toast-provider';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

export default function ReviewerRequestsPage() {
  const { user } = useOutletContext();
  const [requests, setRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, request: null, notes: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useAppToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const [{ data: requestsData }, { data: vehiclesData }] = await Promise.all([
        axios.get('/api/delivery-requests', {
          params: {
            reviewerStatus: 'Pending',
            requestStatus: 'For Review',
          },
        }),
        axios.get('/api/vehicles'),
      ]);
      setRequests(requestsData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error fetching reviewer requests:', error);
      toast.error('Failed to load review requests');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours() % 12 || 12).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${mm}/${dd}/${yyyy} | ${hh}:${min} ${ampm}`;
  };

  const computeDuration = (from, to) => {
    if (!from) return '—';
    if (!to) return '1 day';
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = new Date(to) - new Date(from);
    const days = Math.ceil(diffMs / msPerDay);
    if (days < 0) return '—';
    return `${days + 1} day${days + 1 > 1 ? 's' : ''}`;
  };

  const statusConfig = {
    'For Review': {
      icon: Truck,
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      border: 'border-amber-200',
    },
    Approved: {
      icon: CheckCircle2,
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      border: 'border-emerald-200',
    },
    'Approved with Changes': {
      icon: Truck,
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
      border: 'border-blue-200',
    },
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const q = searchQuery.toLowerCase();
      const searchMatch =
        !q ||
        (r.requestedBy || '').toLowerCase().includes(q) ||
        (r.deliveryType || '').toLowerCase().includes(q) ||
        (r.destination || []).join(' ').toLowerCase().includes(q) ||
        (r.vehicleEquipment || '').toLowerCase().includes(q) ||
        (r.purpose || []).join(' ').toLowerCase().includes(q) ||
        (r.customerSupplier || []).join(' ').toLowerCase().includes(q);

      const statusMatch = statusFilter === 'all' || r.requestStatus === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [requests, searchQuery, statusFilter]);

  const handleReviewAccept = async () => {
    if (!detailsModal.request) return;
    setActionLoading(true);

    try {
      await axios.put(`/api/delivery-requests/${detailsModal.request._id}/reviewer-accept`, {
        reviewerNotes: detailsModal.notes,
        reviewerReviewedBy: user?.department || user?.username || 'Reviewer',
      });
      toast.success('Request accepted successfully');
      setDetailsModal({ isOpen: false, request: null, notes: '' });
      await fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error(error.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const getVehicleLabel = (plate) => {
    if (!plate) return '—';
    if (plate === 'RENT_VEHICLE') return `Rent Vehicle${detailsModal.request?.tnvsProvider ? ` - ${detailsModal.request.tnvsProvider}` : ''}`;
    const v = vehicles.find((v) => v.plateNumber === plate);
    return v ? `${v.plateNumber} — ${v.model}` : plate;
  };

  return (
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center shrink-0">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Reviewer Review</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Review admin-approved delivery requests and accept after validation.
          </p>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0 min-h-0 rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center border-b border-border p-4 bg-muted/20 shrink-0">
          <div className="relative max-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs bg-background pl-8"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 bg-background">
                <span className="text-[10px]">Status: {statusFilter === 'all' ? 'All' : statusFilter}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-[10px]">
              <DropdownMenuLabel className="text-[10px]">Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {['all', 'For Review', 'Approved', 'Approved with Changes'].map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={statusFilter === key}
                  onCheckedChange={() => setStatusFilter(key)}
                  className="text-[10px]"
                >
                  {key === 'all' ? 'All' : key}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex h-8 items-center rounded border border-primary/30 bg-primary/10 px-3 text-[10px] font-bold text-primary uppercase tracking-wider shrink-0">
            {filteredRequests.length} Requests
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loading review requests...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
              <ClipboardList className="h-8 w-8 text-muted-foreground/50 mb-1" />
              <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No review requests found</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Check back after admin approval and personnel assignment.</p>
            </div>
          ) : (
            <table className="w-full min-w-[1200px] border-collapse relative">
              <thead className="sticky top-0 z-10 bg-orange-500 backdrop-blur shadow-sm">
                <tr className="border-b border-orange-600/20">
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Ref No</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Date Submitted</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle">Status</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Delivery Type</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Delivery Date</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Duration</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Vehicle</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Destination</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Job Order No</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Requested By</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, index) => {
                  const sc = statusConfig[req.requestStatus] || statusConfig.Approved;
                  return (
                    <tr
                      key={req._id}
                      onClick={() => setDetailsModal({ isOpen: true, request: req, notes: req.reviewerNotes || '' })}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/30 cursor-pointer ${index % 2 === 0 ? 'bg-card/30' : ''}`}
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-tight align-middle">{req.deliveryReferenceNo || req.referenceNo || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-muted-foreground align-middle">{formatDateTime(req.dateSubmitted || req.createdAt)}</td>
                      <td className="whitespace-nowrap px-3 py-2 align-middle text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${sc.bg} ${sc.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {req.requestStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{req.deliveryType || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{req.dateFrom && req.dateTo ? `${formatDate(req.dateFrom)} - ${formatDate(req.dateTo)}` : formatDate(req.dateFrom)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-muted-foreground tracking-tight align-middle">{computeDuration(req.dateFrom, req.dateTo)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{getVehicleLabel(req.vehicleEquipment)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight align-middle">{(req.destination || []).filter(Boolean).join(', ') || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight text-center align-middle">{(req.jobOrderNo || []).filter(Boolean).join(' / ') || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase text-foreground align-middle">{req.requestedBy || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {detailsModal.isOpen && detailsModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3 shrink-0">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Review Request</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {detailsModal.request.referenceNo} • {detailsModal.request.deliveryType} • Submitted {formatDateTime(detailsModal.request.dateSubmitted || detailsModal.request.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setDetailsModal({ isOpen: false, request: null, notes: '' })}
                className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Ready for Reviewer Acceptance</span>
              </div>

              {[
                { label: 'Request Ref No', value: detailsModal.request.referenceNo },
                { label: 'Delivery Ref No', value: detailsModal.request.deliveryReferenceNo },
                { label: 'Delivery Type', value: detailsModal.request.deliveryType },
                { label: 'Date From', value: formatDate(detailsModal.request.dateFrom) },
                { label: 'Date To', value: formatDate(detailsModal.request.dateTo) },
                { label: 'Duration', value: computeDuration(detailsModal.request.dateFrom, detailsModal.request.dateTo) },
                { label: 'Vehicle', value: getVehicleLabel(detailsModal.request.vehicleEquipment) },
                { label: 'Purpose', value: (detailsModal.request.purpose || []).filter(Boolean).join(' / ') },
                { label: 'Activity', value: (detailsModal.request.activity || []).filter(Boolean).join(' / ') },
                { label: 'Destination', value: (detailsModal.request.destination || []).filter(Boolean).join(' / ') },
                { label: 'Customer / Supplier', value: (detailsModal.request.customerSupplier || []).filter(Boolean).join(' / ') },
                { label: 'Job Order No.', value: (detailsModal.request.jobOrderNo || []).filter(Boolean).join(' / ') },
                { label: 'Driver(s)', value: (detailsModal.request.driver || []).filter(Boolean).join(' / ') || '—' },
                { label: 'Helper(s)', value: (detailsModal.request.helper || []).filter(Boolean).join(' / ') || '—' },
                { label: 'Total Budget', value: detailsModal.request.totalBudget ? `₱ ${Number(detailsModal.request.totalBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—' },
              ].map((field) => (
                <div key={field.label} className="flex items-start gap-2 text-[11px]">
                  <span className="w-[130px] shrink-0 font-bold uppercase tracking-wider text-muted-foreground text-[9px] pt-0.5">{field.label}</span>
                  <span className="font-semibold text-foreground uppercase">{field.value || '—'}</span>
                </div>
              ))}

              {detailsModal.request.notes && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Request Notes</p>
                  <p className="text-[11px] text-foreground">{detailsModal.request.notes}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reviewer Notes (optional)</label>
                <textarea
                  value={detailsModal.notes}
                  onChange={(e) => setDetailsModal((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="block w-full rounded border border-input bg-background px-3 py-2 text-[11px] shadow-sm transition-colors focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none resize-none"
                  placeholder="Add notes or comments before accepting the request..."
                />
              </div>
            </div>

            <div className="sticky bottom-0 z-10 border-t border-border bg-card p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
              <span className="text-[10px] text-muted-foreground">Review the request and accept once validated.</span>
              <Button
                type="button"
                onClick={handleReviewAccept}
                disabled={actionLoading}
                className="ml-auto inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {actionLoading ? 'Accepting...' : 'Accept Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
