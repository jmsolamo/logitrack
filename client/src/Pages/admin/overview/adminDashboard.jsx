import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, Truck, ClipboardList, Activity, Plus, FileText, CheckCircle, 
  AlertCircle, Server, Clock, Calendar as CalendarIcon, MapPin, Lightbulb, TrendingUp,
  Megaphone, Car, CheckSquare, CheckCircle2, DollarSign, HardHat, ShoppingCart
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { toast } from 'react-toastify';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#6366f1'];

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalDeliveries: 0,
    pendingRequests: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    totalVehicles: 0,
    totalPersonnel: 0,
    totalPurchases: 0,
    totalExpenses: 0
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

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Users</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{metrics.totalUsers}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 relative z-10">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Deliveries</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{metrics.totalDeliveries}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 relative z-10">
              <Truck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-orange-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pending Requests</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{metrics.pendingRequests}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 relative z-10">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-purple-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Deliveries</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{metrics.activeDeliveries}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 relative z-10">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completed Deliv.</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{metrics.completedDeliveries}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 relative z-10">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-indigo-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Personnel</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{metrics.totalPersonnel}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 relative z-10">
              <HardHat className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-teal-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Delivery Expenses</p>
              <h3 className="text-2xl font-black text-foreground mt-1">₱{metrics.totalExpenses.toLocaleString()}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 relative z-10">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-rose-500/10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Purchases</p>
              <h3 className="text-2xl font-black text-foreground mt-1">₱{metrics.totalPurchases.toLocaleString()}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 relative z-10">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4 flex-1 min-h-[400px]">
        
        {/* Main Charts Area */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-4 flex flex-col">
          
          {/* Trend Chart */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex-1 min-h-[250px] flex flex-col">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-4">Delivery Trends (Last 6 Months)</h3>
            <div className="flex-1 w-full relative">
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

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[250px]">
            {/* Status Pie */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-2">Delivery Status</h3>
              <div className="flex-1 relative w-full">
                {chartData.statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData.statusDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                        {chartData.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Expenses Breakdown Pie */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-2">Delivery Expenses</h3>
              <div className="flex-1 relative w-full">
                {chartData.expenseBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData.expenseBreakdown} cx="50%" cy="50%" innerRadius={0} outerRadius={70} dataKey="value">
                        {chartData.expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `₱${value.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Top Vehicles Bar */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-4">Top Vehicles Used</h3>
              <div className="flex-1 w-full relative">
                {chartData.topVehicles.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.topVehicles} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#374151', fontWeight: 600 }} width={80} />
                      <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: '#f3f4f6' }} />
                      <Bar dataKey="count" name="Usage Count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed Sidebar */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col h-[500px] lg:h-auto overflow-hidden">
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
                            ['Pending', 'Ongoing'].includes(activity.status) ? 'bg-orange-100 text-orange-700' : 
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
  );
}
