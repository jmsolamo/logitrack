import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Truck, ClipboardList, Activity, Plus, FileText, CheckCircle,
  AlertCircle, Server, Clock, Calendar as CalendarIcon, MapPin, Lightbulb, TrendingUp,
  Megaphone, Car, CheckSquare, CheckCircle2, DollarSign, HardHat, ShoppingCart, CircleDollarSign
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { toast } from 'react-toastify';
import { getPurposeColor } from '../../../lib/purposeColors';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#6366f1'];

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalDeliveries: 0,
    pendingRequests: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    unavailableVehicles: 0,
    maintenanceVehicles: 0,
    unavailableVehiclesList: [],
    totalPersonnel: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    weeklyExpenses: 0,
    monthlyExpenses: 0,
    yearlyExpenses: 0,
    monthlyExpensesTrend: Array(12).fill(0),
    topJobOrders: [],
    motorpoolPurchases: 0,
    maintenancePurchases: 0,
    vehiclePurchases: 0,
    pendingDeliveries: 0,
    inTransitDeliveries: 0,
    approvedRequests: 0,
    declinedRequests: 0,
    approvedWithChangesRequests: 0
  });
  const [chartData, setChartData] = useState({
    deliveriesTrend: [],
    statusDistribution: [],
    topVehicles: [],
    expenseBreakdown: []
  });
  const [activityFeed, setActivityFeed] = useState([]);
  const [serverHealth, setServerHealth] = useState('Checking...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [metricsRes, chartsRes, activityRes, healthRes] = await Promise.all([
          axios.get('/api/dashboard/metrics'),
          axios.get('/api/dashboard/charts'),
          axios.get('/api/dashboard/activity'),
          axios.get('/api/health').catch(() => ({ data: { status: 'error' } }))
        ]);

        setMetrics(metricsRes.data);
        setChartData(chartsRes.data);
        setActivityFeed(activityRes.data);
        setServerHealth(healthRes.data?.status === 'ok' ? 'Online' : 'Offline');
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
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
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4 text-blue-500" />;
      case 'delivery': return <Truck className="h-4 w-4 text-emerald-500" />;
      case 'request': return <ClipboardList className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const maxDeliveryCount = chartData.deliveriesTrend.length > 0
    ? Math.max(...chartData.deliveriesTrend.map(d => d.count))
    : 0;

  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isPeak = payload[0].value === maxDeliveryCount && maxDeliveryCount > 0;
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-md outline-none">
          <p className="text-[11px] font-bold text-foreground mb-1">{label}</p>
          <p className="text-[12px] font-bold text-primary">
            {payload[0].value} Deliveries
          </p>
          {isPeak && (
            <div className="mt-2 flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-widest w-fit">
              <Lightbulb className="h-3 w-3 shrink-0" /> Peak Volume Month
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isTop = chartData.topVehicles[0]?.name === label;
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-md outline-none">
          <p className="text-[11px] font-bold text-foreground mb-1">{label}</p>
          <p className="text-[12px] font-bold text-blue-600">
            {payload[0].value} Usage Count
          </p>
          {isTop && (
            <div className="mt-2 flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 uppercase tracking-widest w-fit">
              <TrendingUp className="h-3 w-3 shrink-0" /> Most Requested
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomMetricTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const name = data.name || label;
      const color = data.color || payload[0].fill;
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-md outline-none">
          <p className="text-[11px] font-bold text-foreground mb-1 uppercase tracking-widest">{name}</p>
          <p className="text-[14px] font-black" style={{ color: color }}>
            {data.prefix || ''}{payload[0].value.toLocaleString(undefined, { minimumFractionDigits: data.isCurrency ? 2 : 0 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return percent > 0 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] font-bold pointer-events-none"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  const deliveriesData = [
    { name: 'Pending', value: metrics.pendingDeliveries || 0, color: '#ea580c' },
    { name: 'In Transit', value: metrics.inTransitDeliveries || 0, color: '#2563eb' },
    { name: 'Completed', value: metrics.completedDeliveries || 0, color: '#10b981' }
  ];

  const requestsData = [
    { name: 'Approved', value: metrics.approvedRequests || 0, color: '#10b981' },
    { name: 'Changes', value: metrics.approvedWithChangesRequests || 0, color: '#2563eb' },
    { name: 'Declined', value: metrics.declinedRequests || 0, color: '#ef4444' }
  ];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const expensesData = (metrics.monthlyExpensesTrend || Array(12).fill(0)).map((val, index) => ({
    name: monthNames[index],
    value: val,
    color: '#3b82f6',
    prefix: '₱',
    isCurrency: true
  }));

  const vehiclesData = [
    { name: 'Available', value: metrics.availableVehicles || 0, color: '#10b981' },
    { name: 'Unavailable', value: metrics.unavailableVehicles || 0, color: '#ef4444' },
    { name: 'Maintenance', value: metrics.maintenanceVehicles || 0, color: '#f59e0b' }
  ];

  const topJobOrdersData = (metrics.topJobOrders || []).map((item) => ({
    name: item.name,
    value: item.value,
    color: '#f59e0b',
    prefix: '₱',
    isCurrency: true
  }));

  const purchasesData = [
    { name: 'Logistics', value: metrics.vehiclePurchases || 0, color: '#d97706', prefix: '₱', isCurrency: true },
    { name: 'Motorpool', value: metrics.motorpoolPurchases || 0, color: '#e11d48', prefix: '₱', isCurrency: true },
    { name: 'Maint.', value: metrics.maintenancePurchases || 0, color: '#ea580c', prefix: '₱', isCurrency: true }
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background p-4 overflow-y-auto space-y-6 animate-in fade-in duration-500">

      {/* Header & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground uppercase">Dashboard</h1>
          </div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">Overview & Key Metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/members" className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" />
            Add User
          </Link>
          <Link to="/admin/request" className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-orange-700">
            <CheckCircle className="h-3.5 w-3.5" />
            Approvals
          </Link>
          <Link to="/admin/reports" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            <FileText className="h-3.5 w-3.5" />
            Reports
          </Link>
        </div>
      </div>

      {/* Key Metrics - Row 1 (Financial) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 shrink-0">
        {/* Card 1: Delivery Expenses */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-teal-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Delivery Expenses</p>
              <h3 className="text-2xl font-black text-foreground mt-1">₱{metrics.totalExpenses.toLocaleString()}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 relative z-10">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3 relative z-10">
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap truncate" title="Weekly">Weekly</p>
              <p className="text-xs font-bold text-indigo-600">₱{(metrics.weeklyExpenses || 0).toLocaleString()}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap truncate" title="Monthly">Monthly</p>
              <p className="text-xs font-bold text-blue-600">₱{(metrics.monthlyExpenses || 0).toLocaleString()}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap truncate" title="Yearly">Yearly</p>
              <p className="text-xs font-bold text-emerald-600">₱{(metrics.yearlyExpenses || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Purchases */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-rose-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Purchases</p>
              <h3 className="text-2xl font-black text-foreground mt-1">₱{metrics.totalPurchases.toLocaleString()}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 relative z-10">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3 relative z-10">
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap truncate" title="Logistics">Logistics</p>
              <p className="text-xs font-bold text-amber-600">₱{(metrics.vehiclePurchases || 0).toLocaleString()}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap truncate" title="Motorpool">Motorpool</p>
              <p className="text-xs font-bold text-rose-600">₱{(metrics.motorpoolPurchases || 0).toLocaleString()}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap truncate" title="Maintenance">Maintenance</p>
              <p className="text-xs font-bold text-orange-600">₱{(metrics.maintenancePurchases || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics - Row 2 (Operational) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 shrink-0">
        {/* Card 3: Total Deliveries */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Deliveries</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{metrics.totalDeliveries}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 relative z-10">
              <Truck className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3 relative z-10">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Pending</p>
              <p className="text-xs font-bold text-orange-600">{metrics.pendingDeliveries || 0}</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">In Transit</p>
              <p className="text-xs font-bold text-blue-600">{metrics.inTransitDeliveries || 0}</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Completed</p>
              <p className="text-xs font-bold text-emerald-600">{metrics.completedDeliveries || 0}</p>
            </div>
          </div>
        </div>

        {/* Card 4: Pending Requests */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-orange-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pending Requests</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{metrics.pendingRequests}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 relative z-10">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3 relative z-10">
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap truncate" title="Approved">Approved</p>
              <p className="text-xs font-bold text-emerald-600">{metrics.approvedRequests || 0}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap truncate" title="Approved with Changes">With Changes</p>
              <p className="text-xs font-bold text-blue-600">{metrics.approvedWithChangesRequests || 0}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap truncate" title="Declined">Declined</p>
              <p className="text-xs font-bold text-red-600">{metrics.declinedRequests || 0}</p>
            </div>
          </div>
        </div>

        {/* Card 5: Active Fleet */}
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
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap truncate" title="Available">Available</p>
              <p className="text-xs font-bold text-emerald-600">{metrics.availableVehicles || 0}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap truncate" title="Unavailable">Unavailable</p>
              <p className="text-xs font-bold text-rose-600">{metrics.unavailableVehicles || 0}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap truncate" title="Maintenance">Maintenance</p>
              <p className="text-xs font-bold text-amber-600">{metrics.maintenanceVehicles || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-1 min-h-[400px]">

        {/* Main Charts Area */}
        <div className="w-full space-y-4 flex flex-col">

          {/* Today's Agenda Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
            {/* Deliveries Today */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col min-h-[250px]">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <Truck className="h-3 w-3 text-indigo-500" /> Deliveries Today
                </h3>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{metrics.deliveriesToday || 0}</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {metrics.recentDeliveriesToday?.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.recentDeliveriesToday.map((item, idx) => {
                      const color = getPurposeColor(item.purpose);
                      const statusColor = item.status === 'Completed'
                        ? 'bg-emerald-500'
                        : item.status === 'In Transit'
                          ? 'bg-blue-500'
                          : 'bg-amber-500';
                      const statusLabel = item.status || 'Pending';
                      
                      const joinArray = (arr) => {
                        if (!arr || !Array.isArray(arr)) return '—';
                        const filtered = arr.filter(Boolean);
                        return filtered.length > 0 ? filtered.join(' / ') : '—';
                      };

                      return (
                        <div key={idx} className={`rounded-lg border ${color.border} ${color.bg} p-3 transition-all hover:shadow-md`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`h-2 w-2 rounded-full ${statusColor} shrink-0`} />
                                <span className={`text-[11px] font-bold ${color.text} uppercase tracking-tight truncate`}>
                                  {item.vehicleEquipment || 'N/A'} — {joinArray(item.customerSupplier?.length > 0 ? item.customerSupplier : item.destination)}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider pl-4 truncate">
                                {joinArray(item.purpose)}
                                {item.activity?.length > 0 && ` — ${joinArray(item.activity)}`}
                              </div>
                            </div>
                            <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColor} text-white shrink-0`}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mt-2 pt-2 border-t border-border/30 pl-4">
                            <div>
                              <div className="text-[8px] text-muted-foreground uppercase tracking-widest">Driver</div>
                              <div className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate">{joinArray(item.driver)}</div>
                            </div>
                            <div>
                              <div className="text-[8px] text-muted-foreground uppercase tracking-widest">Helper</div>
                              <div className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate">{joinArray(item.helper)}</div>
                            </div>
                            <div>
                              <div className="text-[8px] text-muted-foreground uppercase tracking-widest">Job Order</div>
                              <div className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate">{joinArray(item.jobOrderNo)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">No deliveries today</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Requests Today */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col min-h-[250px]">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-orange-500" /> Pending Requests
                </h3>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{metrics.pendingRequestsToday || 0}</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {metrics.recentPendingRequestsToday?.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.recentPendingRequestsToday.map((item, idx) => {
                      const color = getPurposeColor(item.purpose);
                      const statusColor = 'bg-amber-500'; // Pending requests are always amber
                      const statusLabel = item.requestStatus || 'Pending';
                      
                      const joinArray = (arr) => {
                        if (!arr || !Array.isArray(arr)) return '—';
                        const filtered = arr.filter(Boolean);
                        return filtered.length > 0 ? filtered.join(' / ') : '—';
                      };

                      const dateFrom = item.dateFrom ? new Date(item.dateFrom).toLocaleDateString() : 'N/A';
                      const dateTo = item.dateTo ? new Date(item.dateTo).toLocaleDateString() : 'N/A';
                      const duration = (item.dateFrom && item.dateTo) 
                        ? `${Math.ceil(Math.abs(new Date(item.dateTo) - new Date(item.dateFrom)) / (1000 * 60 * 60 * 24)) + 1} Day(s)` 
                        : 'N/A';

                      return (
                        <div key={idx} className={`rounded-lg border ${color.border} ${color.bg} p-3 transition-all hover:shadow-md`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`h-2 w-2 rounded-full ${statusColor} shrink-0`} />
                                <span className={`text-[11px] font-bold ${color.text} uppercase tracking-tight truncate`}>
                                  {item.vehicleEquipment || 'No Vehicle'} — {joinArray(item.customerSupplier?.length > 0 ? item.customerSupplier : item.destination)}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider pl-4 truncate">
                                {joinArray(item.purpose)}
                                {item.activity?.length > 0 && ` — ${joinArray(item.activity)}`}
                              </div>
                            </div>
                            <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColor} text-white shrink-0`}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mt-2 pt-2 border-t border-border/30 pl-4">
                            <div className="col-span-1">
                              <div className="text-[8px] text-muted-foreground uppercase tracking-widest">Requested By</div>
                              <div className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate">{item.requestedBy || 'Unknown'}</div>
                            </div>
                            <div className="col-span-1">
                              <div className="text-[8px] text-muted-foreground uppercase tracking-widest">Job Order</div>
                              <div className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate">{joinArray(item.jobOrderNo)}</div>
                            </div>
                            <div className="col-span-1">
                              <div className="text-[8px] text-muted-foreground uppercase tracking-widest">Reference No.</div>
                              <div className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate">{item.referenceNo || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">No pending requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Fleet Status & Alerts */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                <Car className="h-3 w-3 text-primary" /> Vehicle Fleet Status
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{metrics.availableVehicles || 0} Available</span>
                <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{metrics.unavailableVehiclesList?.length || 0} Alerts</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
              {/* Distribution Chart */}
              <div className="lg:col-span-1 w-full relative flex items-center justify-center aspect-square max-h-[220px] lg:max-h-none lg:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={vehiclesData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={55} 
                      outerRadius={85} 
                      paddingAngle={2} 
                      dataKey="value"
                      label={renderPieLabel}
                      labelLine={false}
                    >
                      {vehiclesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomMetricTooltip />} cursor={{ fill: 'transparent' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Alerts List */}
              <div className="lg:col-span-3">
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

          {/* Expenses Analytics Combined Section */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col mb-4">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                <CircleDollarSign className="h-3 w-3 text-primary" /> Expenses Analytics
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">₱{(metrics.monthlyExpenses || 0).toLocaleString()} This Month</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Monthly Trend Chart */}
              <div className="flex flex-col h-[220px]">
                <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Annual Expense Trend</h4>
                <div className="flex-1 w-full relative min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={expensesData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280', fontWeight: 600 }} dy={10} interval={0} />
                      <YAxis hide={true} />
                      <RechartsTooltip content={<CustomMetricTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '3 3' }} />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Job Orders Chart */}
              <div className="flex flex-col h-[220px]">
                <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Top 5 Job Orders by Expense</h4>
                <div className="flex-1 w-full relative min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topJobOrdersData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280', fontWeight: 600 }} dy={10} />
                      <YAxis hide={true} />
                      <RechartsTooltip content={<CustomMetricTooltip />} cursor={{ fill: '#f3f4f6' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {topJobOrdersData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>


          {/* Breakdown Metric Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 flex-1">
            {/* Chart 1: Deliveries */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col aspect-square sm:aspect-auto sm:h-[260px]">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-4 shrink-0">Deliveries</h3>
              <div className="flex-1 w-full relative min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={deliveriesData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={55} 
                      outerRadius={95} 
                      paddingAngle={2} 
                      dataKey="value"
                      label={renderPieLabel}
                      labelLine={false}
                    >
                      {deliveriesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomMetricTooltip />} cursor={{ fill: 'transparent' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Requests */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col aspect-square sm:aspect-auto sm:h-[260px]">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-4 shrink-0">Requests</h3>
              <div className="flex-1 w-full relative min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={requestsData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={55} 
                      outerRadius={95} 
                      paddingAngle={2} 
                      dataKey="value"
                      label={renderPieLabel}
                      labelLine={false}
                    >
                      {requestsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomMetricTooltip />} cursor={{ fill: 'transparent' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Bottom Grid: Trend Chart & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
            {/* Trend Chart */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col min-h-[300px]">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-4">Delivery Trends (Last 6 Months)</h3>
              <div className="flex-1 w-full relative min-h-[250px]">
                {chartData.deliveriesTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.deliveriesTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <RechartsTooltip
                        content={<CustomLineTooltip />}
                        cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '3 3' }}
                      />
                      <Line type="monotone" dataKey="count" name="Deliveries" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity (Aligned with Trend Chart) */}
            <div className="lg:col-span-1 rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col min-h-[300px] max-h-[400px] overflow-hidden">
              <div className="flex items-center gap-2 mb-4 shrink-0 border-b border-border pb-3">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground">Recent Activity</h3>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {activityFeed.length > 0 ? (
                  <div className="relative pl-3 border-l-2 border-muted">
                    {activityFeed.map((activity, index) => (
                      <div key={activity.id} className="mb-5 relative">
                        <div className="absolute -left-[19px] top-1 flex h-7 w-7 items-center justify-center rounded-full bg-background border-2 border-muted shadow-sm">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="pl-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-foreground">{activity.title}</p>
                            <span className="text-[9px] font-semibold text-muted-foreground whitespace-nowrap">
                              {formatDateTime(activity.timestamp)}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {activity.description}
                          </p>
                          <div className="mt-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider
                              ${['Verified', 'Completed', 'Approved'].includes(activity.status) ? 'bg-emerald-100 text-emerald-700' :
                                ['Pending', 'In Transit'].includes(activity.status) ? 'bg-orange-100 text-orange-700' :
                                  'bg-muted text-muted-foreground'}`}
                            >
                              {activity.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center opacity-70">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">No Recent Activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
