import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  ArrowRight,
  CalendarDays,
  MapPin,
} from 'lucide-react';

function UsersDashboard() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/deliveries/user-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusConfig = {
    Pending: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
    },
    'In Transit': {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      dot: 'bg-blue-500',
    },
    Completed: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    },
  };

  const statCards = [
    {
      label: 'Total Deliveries',
      value: stats?.total ?? 0,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
    },
    {
      label: 'Pending',
      value: stats?.pending ?? 0,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    {
      label: 'In Transit',
      value: stats?.inTransit ?? 0,
      icon: Truck,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'Completed',
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
<<<<<<< HEAD
            {(user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
              Welcome back, {user?.username || 'User'}!
=======
            {(user?.firstName || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
              Welcome back, {user?.firstName || 'User'}!
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
            </h1>
            <p className="text-xs text-muted-foreground">
              Here's an overview of the delivery activity.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`group relative overflow-hidden rounded-lg border ${card.borderColor} ${card.bgColor} p-4 transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {card.label}
                  </p>
                  <p className={`mt-1.5 text-2xl font-bold ${card.color}`}>
                    {card.value}
                  </p>
                </div>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Deliveries */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Recent Deliveries</h2>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Last 5
          </span>
        </div>

        {stats?.recentDeliveries?.length > 0 ? (
          <div className="divide-y divide-border">
            {stats.recentDeliveries.map((delivery) => {
              const sc = statusConfig[delivery.status] || statusConfig.Pending;
              return (
                <div
                  key={delivery._id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                    <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {delivery.referenceNo}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${sc.bg} ${sc.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        {delivery.status}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      {delivery.destination?.length > 0 && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {delivery.destination.join(', ')}
                        </span>
                      )}
                      {delivery.vehicleEquipment && (
                        <span className="hidden sm:inline-flex items-center gap-1">
                          <Truck className="h-3 w-3 shrink-0" />
                          {delivery.vehicleEquipment}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(delivery.dateFrom)}
                    {delivery.dateTo && (
                      <>
                        <ArrowRight className="h-2.5 w-2.5" />
                        {formatDate(delivery.dateTo)}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Package className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No deliveries found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UsersDashboard;
