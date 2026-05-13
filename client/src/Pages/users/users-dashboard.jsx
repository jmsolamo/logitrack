import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import axios from 'axios';
import { Truck, ClipboardList, Car, Plus, AlertCircle, CheckCircle2, History, Clock, XCircle, FileCheck2, FileWarning } from 'lucide-react';
import { StatusPieChart } from './dashboard-charts';
import { getPurposeColor } from '../../lib/purposeColors';
import Calendar from '../admin/overview/calendar';

export default function UsersDashboard() {
  const { user } = useOutletContext();
  const [metrics, setMetrics] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?._id || !user?.username) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const mRes = await axios.get('/api/dashboard/user-metrics', { params: { userId: user._id, username: user.username, role: user.role } });
        setMetrics(mRes.data);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  if (isLoading || !metrics) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const joinArr = (arr) => {
    if (!arr || !Array.isArray(arr)) return '—';
    const f = arr.filter(Boolean);
    return f.length > 0 ? f.join(' / ') : '—';
  };

  const vehiclesData = [
    { name: 'Available', value: metrics.availableVehicles || 0, color: '#10b981' },
    { name: 'Unavailable', value: metrics.unavailableVehicles || 0, color: '#ef4444' },
    { name: 'Maintenance', value: metrics.maintenanceVehicles || 0, color: '#f59e0b' },
  ];

  return (
    <div className="flex h-full flex-col bg-background p-4 overflow-y-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground uppercase">Dashboard</h1>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
            Welcome back, <span className="font-bold text-foreground">{user?.username || 'User'}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={user?.role === 'manager' ? '/reviewer/requests' : '/user/deliveries'} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> New Request
          </Link>
          <Link to={user?.role === 'manager' ? '/reviewer/deliveries' : '/user/deliveries'} className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-700">
            <Truck className="h-3.5 w-3.5" /> View Deliveries
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 shrink-0">
        {/* My Deliveries */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{user?.role === 'manager' ? 'Deliveries' : 'My Deliveries'}</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{metrics.totalDeliveries}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 relative z-10">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3 relative z-10">
            <div><p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Pending</p><p className="text-xs font-bold text-orange-600">{metrics.pendingDeliveries || 0}</p></div>
            <div><p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">In Transit</p><p className="text-xs font-bold text-blue-600">{metrics.inTransitDeliveries || 0}</p></div>
            <div><p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Completed</p><p className="text-xs font-bold text-emerald-600">{metrics.completedDeliveries || 0}</p></div>
          </div>
        </div>

        {/* My Requests */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-orange-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{user?.role === 'manager' ? 'For Review Deliveries' : 'My Requests'}</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {user?.role === 'manager' 
                  ? metrics.pendingRequests 
                  : ((metrics.pendingRequests || 0) + (metrics.approvedRequests || 0) + (metrics.declinedRequests || 0) + (metrics.approvedWithChangesRequests || 0))}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 relative z-10">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          {user?.role !== 'manager' && (
            <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3 relative z-10">
              <div><p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Pending</p><p className="text-xs font-bold text-orange-600">{metrics.pendingRequests || 0}</p></div>
              <div><p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Approved</p><p className="text-xs font-bold text-emerald-600">{(metrics.approvedRequests || 0) + (metrics.approvedWithChangesRequests || 0)}</p></div>
              <div><p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Declined</p><p className="text-xs font-bold text-red-600">{metrics.declinedRequests || 0}</p></div>
            </div>
          )}
        </div>

        {/* Fleet */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Fleet</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{metrics.totalVehicles || 0}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 relative z-10">
              <Car className="h-5 w-5" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3 relative z-10">
            <div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground truncate">Available</p><p className="text-xs font-bold text-emerald-600">{metrics.availableVehicles || 0}</p></div>
            <div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground truncate">Unavailable</p><p className="text-xs font-bold text-rose-600">{metrics.unavailableVehicles || 0}</p></div>
            <div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground truncate">Maintenance</p><p className="text-xs font-bold text-amber-600">{metrics.maintenanceVehicles || 0}</p></div>
          </div>
        </div>
      </div>

      {/* Today's Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
        {/* Deliveries Today */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col min-h-[250px]">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <Truck className="h-3 w-3 text-indigo-500" /> {user?.role === 'manager' ? 'Deliveries Today' : 'My Deliveries Today'}
            </h3>
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{metrics.deliveriesToday || 0}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            {metrics.recentDeliveriesToday?.length > 0 ? (
              <div className="space-y-3">
                {metrics.recentDeliveriesToday.map((item, idx) => {
                  const color = getPurposeColor(item.purpose);
                  const sc = item.status === 'Completed' ? 'bg-emerald-500' : item.status === 'In Transit' ? 'bg-blue-500' : 'bg-amber-500';
                  return (
                    <div key={idx} className={`rounded-lg border ${color.border} ${color.bg} p-3 transition-all hover:shadow-md`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`h-2 w-2 rounded-full ${sc} shrink-0`} />
                            <span className={`text-[11px] font-bold ${color.text} uppercase tracking-tight truncate`}>
                              {item.vehicleEquipment || 'N/A'} — {joinArr(item.customerSupplier?.length > 0 ? item.customerSupplier : item.destination)}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider pl-4 truncate">
                            {joinArr(item.purpose)}{item.activity?.length > 0 && ` — ${joinArr(item.activity)}`}
                          </div>
                        </div>
                        <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${sc} text-white shrink-0`}>{item.status || 'Pending'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-2 pt-2 border-t border-border/30 pl-4">
                        <div><div className="text-[8px] text-muted-foreground uppercase tracking-widest">Driver</div><div className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate">{joinArr(item.driver)}</div></div>
                        <div><div className="text-[8px] text-muted-foreground uppercase tracking-widest">Helper</div><div className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate">{joinArr(item.helper)}</div></div>
                        <div><div className="text-[8px] text-muted-foreground uppercase tracking-widest">Job Order</div><div className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate">{joinArr(item.jobOrderNo)}</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-6">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-2" />
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">No deliveries today</p>
              </div>
            )}
          </div>
        </div>

        {/* Request Update History */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col min-h-[250px] max-h-[400px] overflow-hidden">
          <div className="flex items-center gap-2 mb-4 shrink-0 border-b border-border pb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground">{user?.role === 'manager' ? 'Review Deliveries' : 'Request Update History'}</h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {metrics.requestUpdateHistory?.length > 0 ? (
              <div className="relative pl-3 border-l-2 border-muted">
                {metrics.requestUpdateHistory.map((item, idx) => {
                  // For reviewers, use reviewerStatus; for users, use requestStatus
                  const displayStatus = user?.role === 'manager'
                    ? (item.reviewerStatus === 'Pending' ? 'For Review' : item.reviewerStatus || 'For Review')
                    : item.requestStatus;

                  const getIcon = (status) => {
                    switch (status) {
                      case 'Approved': return <FileCheck2 className="h-4 w-4 text-emerald-500" />;
                      case 'Approved with Changes': return <FileWarning className="h-4 w-4 text-blue-500" />;
                      case 'Declined': return <XCircle className="h-4 w-4 text-red-500" />;
                      case 'For Review': return <Clock className="h-4 w-4 text-violet-500" />;
                      default: return <Clock className="h-4 w-4 text-amber-500" />;
                    }
                  };
                  const getStatusStyle = (status) => {
                    if (status === 'Approved') return 'bg-emerald-100 text-emerald-700';
                    if (status === 'Approved with Changes') return 'bg-blue-100 text-blue-700';
                    if (status === 'Declined') return 'bg-red-100 text-red-700';
                    if (status === 'For Review') return 'bg-violet-100 text-violet-700';
                    if (status === 'Pending') return 'bg-orange-100 text-orange-700';
                    return 'bg-muted text-muted-foreground';
                  };
                  const timeAgo = (() => {
                    const d = new Date(item.reviewedAt || item.updatedAt || item.createdAt);
                    const now = new Date();
                    const diffMs = now - d;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHrs = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHrs / 24);
                    if (diffMins < 60) return `${diffMins} min ago`;
                    if (diffHrs < 24) return `${diffHrs} hr ago`;
                    if (diffDays === 1) return 'Yesterday';
                    if (diffDays < 7) return `${diffDays} days ago`;
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  })();

                  const description = user?.role === 'manager'
                    ? `Request ${item.referenceNo} is awaiting your review. ${item.vehicleEquipment ? `Vehicle: ${item.vehicleEquipment}` : ''} ${item.requestedBy ? `• Requested by: ${item.requestedBy}` : ''}`
                    : item.requestStatus === 'Declined'
                      ? `Request ${item.referenceNo} was declined. ${item.declineReason ? `Reason: "${item.declineReason}"` : ''}`
                      : item.vehicleChanged
                        ? `Request ${item.referenceNo} ${item.requestStatus.toLowerCase()}. Vehicle changed from ${item.originalVehicle} to ${item.vehicleEquipment}.`
                        : `Request ${item.referenceNo} ${item.requestStatus === 'Pending' ? 'is pending review' : `was ${item.requestStatus.toLowerCase()}`}. ${item.deliveryReferenceNo ? `Delivery: ${item.deliveryReferenceNo}` : ''}`;

                  return (
                    <div key={idx} className="mb-5 relative">
                      <div className="absolute -left-[19px] top-1 flex h-7 w-7 items-center justify-center rounded-full bg-background border-2 border-muted shadow-sm">
                        {getIcon(displayStatus)}
                      </div>
                      <div className="pl-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-foreground">
                            <Link
                              to={`${user?.role === 'manager' ? '/reviewer/deliveries' : '/user/deliveries'}?requestId=${item._id}`}
                              className="text-primary hover:underline hover:text-primary/80 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item.referenceNo || 'Request Update'}
                            </Link>
                          </p>
                          <span className="text-[9px] font-semibold text-muted-foreground whitespace-nowrap">
                            {timeAgo}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {description}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${getStatusStyle(displayStatus)}`}>
                            {displayStatus || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-70">
                <ClipboardList className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">No Request Updates</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col shrink-0 min-h-[600px] overflow-hidden relative">
        <Calendar userMode={true} hideFilters={true} />
      </div>

      {/* Vehicle Fleet Status */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Car className="h-3 w-3 text-primary" /> Vehicle Fleet Status
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{metrics.availableVehicles || 0} Available</span>
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{metrics.unavailableVehicles || 0} Unavailable</span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{metrics.maintenanceVehicles || 0} Maintenance</span>
          </div>
        </div>

        <div className="w-full mt-2">
          {/* Status Alerts List */}
            {metrics.unavailableVehiclesList?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {metrics.unavailableVehiclesList.map((vehicle, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-3 bg-muted/30">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-foreground uppercase tracking-tight">{vehicle.plateNumber}</span>
                      <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        vehicle.status === 'Maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {vehicle.status}
                      </span>
                    </div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{vehicle.model}</div>
                    {vehicle.maintenanceReason && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 text-red-600/70">Issue</p>
                        <p className="text-[10px] text-foreground leading-tight italic line-clamp-2 font-medium">"{vehicle.maintenanceReason}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[120px] text-center border-2 border-dashed border-border rounded-lg bg-emerald-50/30">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-2" />
                <p className="text-[10px] font-bold uppercase text-emerald-700 tracking-widest">Entire fleet is currently available</p>
              </div>
            )}
        </div>
      </div>

    </div>
  );
}
