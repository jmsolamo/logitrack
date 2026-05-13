import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FileText, Download, Calendar as CalendarIcon, Filter, Search, RotateCcw,
  Truck, CheckCircle2, X, Lightbulb, TrendingUp, Users,
  HardHat, ShoppingCart, DollarSign, MapPin, ClipboardList, Wrench
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { toast } from 'react-toastify';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('delivery_plan');
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [deliveries, setDeliveries] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [requests, setRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);

  // Checkboxes
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Shared Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [personnelFilter, setPersonnelFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [delRes, purRes, perRes, reqRes, vehRes, destRes, mLogRes] = await Promise.all([
        axios.get('/api/deliveries', config),
        axios.get('/api/purchases', config),
        axios.get('/api/personnels', config),
        axios.get('/api/delivery-requests', config),
        axios.get('/api/vehicles', config),
        axios.get('/api/destinations', config),
        axios.get('/api/vehicles/maintenance-logs/monthly', config)
      ]);
      setDeliveries(delRes.data);
      setPurchases(purRes.data);
      setPersonnel(perRes.data);
      setRequests(reqRes.data);
      setVehicles(vehRes.data);
      setDestinations(destRes.data);
      setMaintenanceLogs(mLogRes.data);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
    setPersonnelFilter('all');
    setSelectedIds(new Set());
  };

  const toggleSelectAll = (items) => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(d => d._id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const isDateInRange = (dateStr) => {
    if (!dateStr) return false;
    const dDate = new Date(dateStr);
    const dFrom = dateFrom ? new Date(dateFrom) : null;
    const dTo = dateTo ? new Date(dateTo) : null;
    if (dFrom && dTo) return dDate >= dFrom && dDate <= dTo;
    if (dFrom) return dDate >= dFrom;
    if (dTo) return dDate <= dTo;
    return true;
  };

  // --- FILTERS & COMPUTES ---
  
  const filteredDeliveryPlan = useMemo(() => {
    return deliveries.filter(d => {
      const q = searchQuery.toLowerCase();
      const match = !q || (d.referenceNo||'').toLowerCase().includes(q) || (d.vehicleEquipment||'').toLowerCase().includes(q);
      const sMatch = statusFilter === 'all' || (d.status || 'Pending') === statusFilter;
      const dMatch = (!dateFrom && !dateTo) || isDateInRange(d.dateFrom);
      
      const pMatch = personnelFilter === 'all' || 
        (d.driver || []).includes(personnelFilter) || 
        (d.helper || []).includes(personnelFilter);

      return match && sMatch && dMatch && pMatch;
    });
  }, [deliveries, searchQuery, statusFilter, dateFrom, dateTo, personnelFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const q = searchQuery.toLowerCase();
      const match = !q || (r.referenceNo||'').toLowerCase().includes(q) || (r.department||'').toLowerCase().includes(q);
      const sMatch = statusFilter === 'all' || r.requestStatus === statusFilter;
      const dMatch = (!dateFrom && !dateTo) || isDateInRange(r.dateFrom);
      return match && sMatch && dMatch;
    });
  }, [requests, searchQuery, statusFilter, dateFrom, dateTo]);

  const filteredVehicles = useMemo(() => {
    const repairCosts = {};
    purchases.forEach(p => {
      if (p.category) {
        const amount = String(p.amount || '').split(',').reduce((s, v) => s + Number(v.trim() || 0), 0);
        repairCosts[p.category] = (repairCosts[p.category] || 0) + amount;
      }
    });

    return vehicles.filter(v => {
      const q = searchQuery.toLowerCase();
      const match = !q || (v.plateNumber||'').toLowerCase().includes(q) || (v.model||'').toLowerCase().includes(q);
      const sMatch = statusFilter === 'all' || v.status === statusFilter;
      return match && sMatch;
    }).map(v => ({
      ...v,
      repairCost: repairCosts[v.plateNumber] || 0
    })).sort((a, b) => {
      if (a.status === 'Maintenance' && b.status !== 'Maintenance') return -1;
      if (b.status === 'Maintenance' && a.status !== 'Maintenance') return 1;
      return (b.repairCost || 0) - (a.repairCost || 0) || (b.maintenanceCount || 0) - (a.maintenanceCount || 0);
    });
  }, [vehicles, purchases, searchQuery, statusFilter]);

  const uniquePositions = useMemo(() => {
    const list = new Set();
    personnel.forEach(p => {
      if (p.position) list.add(p.position);
    });
    return Array.from(list).sort();
  }, [personnel]);

  const allPersonnelNames = useMemo(() => {
    const list = new Set();
    deliveries.forEach(d => {
      (d.driver || []).forEach(p => list.add(p));
      (d.helper || []).forEach(p => list.add(p));
    });
    return Array.from(list).sort();
  }, [deliveries]);

  const filteredPersonnel = useMemo(() => {
    return personnel.map(p => {
      const fName = (p.firstname||'').toLowerCase();
      const lName = (p.lastname||'').toLowerCase();
      let dCount = 0;
      let hCount = 0;
      deliveries.forEach(d => {
        const dMatch = (!dateFrom && !dateTo) || isDateInRange(d.dateFrom);
        if (!dMatch) return;
        const drivers = (d.driver||[]).map(x => (x||'').toLowerCase());
        const helpers = (d.helper||[]).map(x => (x||'').toLowerCase());
        if (fName && lName) {
          if (drivers.some(name => name.includes(fName) && name.includes(lName))) dCount++;
          if (helpers.some(name => name.includes(fName) && name.includes(lName))) hCount++;
        } else if (fName || lName) {
          if (drivers.some(name => name.includes(fName) || name.includes(lName))) dCount++;
          if (helpers.some(name => name.includes(fName) || name.includes(lName))) hCount++;
        }
      });
      return { ...p, driverCount: dCount, helperCount: hCount, deliveriesCount: dCount + hCount };
    }).filter(p => {
      const q = searchQuery.toLowerCase();
      const searchMatch = !q || (p.firstname||'').toLowerCase().includes(q) || (p.lastname||'').toLowerCase().includes(q) || (p.position||'').toLowerCase().includes(q);
      const posMatch = statusFilter === 'all' || p.position === statusFilter;
      return searchMatch && posMatch;
    }).sort((a, b) => b.deliveriesCount - a.deliveriesCount);
  }, [personnel, deliveries, searchQuery, dateFrom, dateTo, statusFilter]);

  const filteredDestinations = useMemo(() => {
    return destinations.filter(d => {
      const q = searchQuery.toLowerCase();
      const match = !q || (d.name||'').toLowerCase().includes(q) || (d.area||'').toLowerCase().includes(q);
      const sMatch = statusFilter === 'all' || d.status === statusFilter;
      return match && sMatch;
    });
  }, [destinations, searchQuery, statusFilter]);

  const currentInsights = useMemo(() => {
    const generated = [];
    if (activeTab === 'delivery_plan') {
      const completed = filteredDeliveryPlan.filter(d => d.status === 'Completed').length;
      const pending = filteredDeliveryPlan.filter(d => d.status === 'Pending').length;
      const inTransit = filteredDeliveryPlan.filter(d => d.status === 'In Transit').length;
      generated.push({ icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, title: 'Completion Rate', text: `${Math.round((completed/Math.max(1, filteredDeliveryPlan.length))*100)}% completed deliveries.` });
      generated.push({ icon: <Truck className="h-4 w-4 text-blue-500" />, title: 'Total Volume', text: `${filteredDeliveryPlan.length} total deliveries scheduled.` });
      generated.push({ icon: <RotateCcw className="h-4 w-4 text-amber-500" />, title: 'Pending Trips', text: `${pending} deliveries still waiting to start.` });
      generated.push({ icon: <TrendingUp className="h-4 w-4 text-indigo-500" />, title: 'In Transit', text: `${inTransit} active deliveries currently on the road.` });
    } else if (activeTab === 'requests') {
      const approved = filteredRequests.filter(r => r.requestStatus === 'Approved').length;
      const pendingReq = filteredRequests.filter(r => r.requestStatus === 'Pending').length;
      const rejected = filteredRequests.filter(r => r.requestStatus === 'Rejected').length;
      generated.push({ icon: <FileText className="h-4 w-4 text-blue-500" />, title: 'Requests Volume', text: `${filteredRequests.length} total requests.` });
      generated.push({ icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, title: 'Approval Rate', text: `${Math.round((approved/Math.max(1, filteredRequests.length))*100)}% approved requests.` });
      generated.push({ icon: <RotateCcw className="h-4 w-4 text-amber-500" />, title: 'Awaiting Action', text: `${pendingReq} requests pending for review.` });
      generated.push({ icon: <X className="h-4 w-4 text-rose-500" />, title: 'Rejected Requests', text: `${rejected} requests were not approved.` });
    } else if (activeTab === 'vehicles') {
      const available = filteredVehicles.filter(v => v.status === 'Available').length;
      generated.push({ icon: <Truck className="h-4 w-4 text-indigo-500" />, title: 'Available Fleet', text: `${available} of ${filteredVehicles.length} vehicles are available.` });
      
      const totalRepairCost = filteredVehicles.reduce((s, v) => s + (v.repairCost || 0), 0);
      generated.push({ icon: <DollarSign className="h-4 w-4 text-rose-500" />, title: 'Fleet Maintenance Cost', text: `₱${totalRepairCost.toLocaleString()} total repair spending.` });
      
      const mostRepaired = [...filteredVehicles].sort((a,b) => (b.maintenanceCount||0) - (a.maintenanceCount||0))[0];
      if (mostRepaired && mostRepaired.maintenanceCount > 0) {
        generated.push({ icon: <RotateCcw className="h-4 w-4 text-amber-500" />, title: 'Most Frequent Repair', text: `${mostRepaired.plateNumber} (${mostRepaired.maintenanceCount} times).` });
      }

      const mostMaintained = [...filteredVehicles].sort((a,b) => (b.repairCost||0) - (a.repairCost||0))[0];
      if (mostMaintained && mostMaintained.repairCost > 0) {
        generated.push({ icon: <Wrench className="h-4 w-4 text-rose-500" />, title: 'Highest Maintenance Cost', text: `${mostMaintained.plateNumber} (₱${mostMaintained.repairCost.toLocaleString()}).` });
      }
    } else if (activeTab === 'personnel') {
      generated.push({ icon: <Users className="h-4 w-4 text-blue-500" />, title: 'Total Workforce', text: `${filteredPersonnel.length} personnel registered.` });
      
      const topDriver = [...filteredPersonnel].sort((a,b) => b.driverCount - a.driverCount)[0];
      if (topDriver && topDriver.driverCount > 0) {
        generated.push({ icon: <Truck className="h-4 w-4 text-emerald-500" />, title: 'Top Driver', text: `${(topDriver.firstname||'').toUpperCase()} ${(topDriver.lastname||'').toUpperCase()} (${topDriver.driverCount} trips).` });
      }

      const topHelper = [...filteredPersonnel].sort((a,b) => b.helperCount - a.helperCount)[0];
      if (topHelper && topHelper.helperCount > 0) {
        generated.push({ icon: <HardHat className="h-4 w-4 text-amber-500" />, title: 'Top Helper', text: `${(topHelper.firstname||'').toUpperCase()} ${(topHelper.lastname||'').toUpperCase()} (${topHelper.helperCount} trips).` });
      }

      const totalTrips = filteredPersonnel.reduce((s, p) => s + (p.deliveriesCount || 0), 0);
      generated.push({ icon: <TrendingUp className="h-4 w-4 text-indigo-500" />, title: 'Total Productivity', text: `${totalTrips} total trips completed by team.` });
    }
    return generated;
  }, [activeTab, filteredDeliveryPlan, filteredRequests, filteredVehicles, filteredPersonnel]);

  const chartData = useMemo(() => {
    if (activeTab === 'delivery_plan') {
      const counts = filteredDeliveryPlan.reduce((acc, d) => {
        const s = d.status || 'Pending';
        acc[s] = (acc[s]||0) + 1; return acc;
      }, {});
      return Object.keys(counts).map(k => ({ label: k, value: counts[k] }));
    } else if (activeTab === 'requests') {
      // Pivot requests by month and department
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthMap = {};
      filteredRequests.forEach(r => {
        if (!r.dateFrom) return;
        const d = new Date(r.dateFrom);
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        const dept = r.department || 'Unknown';
        if (!monthMap[label]) monthMap[label] = { label, _sort: d.getTime() };
        monthMap[label][dept] = (monthMap[label][dept] || 0) + 1;
      });
      return Object.values(monthMap).sort((a, b) => a._sort - b._sort);
    } else if (activeTab === 'vehicles') {
      // Pivot maintenance logs into stacked format: { label: 'Jan 2026', 'ABC-123': 2, 'XYZ-789': 1 }
      if (maintenanceLogs.length > 0) {
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthMap = {};
        maintenanceLogs.forEach(l => {
          const [y, m] = l.month.split('-');
          const label = `${monthNames[parseInt(m)-1]} ${y}`;
          if (!monthMap[label]) monthMap[label] = { label };
          monthMap[label][l.plateNumber] = l.count;
        });
        return Object.values(monthMap);
      } else {
        const counts = filteredVehicles.reduce((acc, v) => {
          const s = v.status || 'Inactive';
          acc[s] = (acc[s]||0) + 1; return acc;
        }, {});
        return Object.keys(counts).map(k => ({ label: k, value: counts[k] }));
      }
    } else if (activeTab === 'personnel') {
      const top5 = [...filteredPersonnel].sort((a, b) => b.deliveriesCount - a.deliveriesCount).slice(0, 5);
      return top5.map(p => ({ label: (p.lastname||'').toUpperCase(), Driver: p.driverCount, Helper: p.helperCount }));
    }
    return [];
  }, [activeTab, filteredDeliveryPlan, filteredRequests, filteredVehicles, filteredPersonnel, maintenanceLogs]);

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

  // Extract unique vehicle plates from chart data for line chart
  const vehiclePlates = useMemo(() => {
    if (activeTab !== 'vehicles' || maintenanceLogs.length === 0) return [];
    const plates = new Set();
    maintenanceLogs.forEach(l => plates.add(l.plateNumber));
    return Array.from(plates);
  }, [activeTab, maintenanceLogs]);

  // Extract unique departments from requests chart data for line chart
  const departmentKeys = useMemo(() => {
    if (activeTab !== 'requests') return [];
    const depts = new Set();
    filteredRequests.forEach(r => { if (r.department) depts.add(r.department); });
    return Array.from(depts).sort();
  }, [activeTab, filteredRequests]);

  const exportToCSV = () => {
    let rawData = [];
    let headers = [];
    let filename = activeTab + '_report.csv';

    if (activeTab === 'delivery_plan') {
      rawData = selectedIds.size > 0 
        ? deliveries.filter(d => selectedIds.has(d._id))
        : filteredDeliveryPlan;
      headers = ['Reference No', 'Status', 'Date From', 'Purpose', 'Activity', 'Vehicle', 'Customer / Supplier', 'Destination', 'Driver', 'Helper', 'Job Order No.'];
    } else if (activeTab === 'requests') {
      rawData = selectedIds.size > 0
        ? requests.filter(r => selectedIds.has(r._id))
        : filteredRequests;
      headers = ['Reference No', 'Department', 'Status', 'Date From', 'Date To'];
    } else if (activeTab === 'vehicles') {
      rawData = selectedIds.size > 0
        ? vehicles.filter(v => selectedIds.has(v._id))
        : filteredVehicles;
      headers = ['Plate Number', 'Model', 'Status', 'Repairs Count', 'Repair Cost'];
    } else if (activeTab === 'personnel') {
      rawData = selectedIds.size > 0
        ? personnel.filter(p => selectedIds.has(p._id))
        : filteredPersonnel;
      headers = ['First Name', 'Last Name', 'Position', 'Total Trips'];
    }

    if (rawData.length === 0) return toast.warning('No data to export');

    let data = [];
    if (activeTab === 'delivery_plan') {
      data = rawData.map(d => [
        d.referenceNo, 
        d.status, 
        formatDate(d.dateFrom), 
        (d.purpose||[]).join(', '),
        (d.activity||[]).join(', '),
        d.vehicleEquipment, 
        (d.customerSupplier||[]).join(', '),
        (d.destination||[]).join(', '),
        (d.driver||[]).join(', '),
        (d.helper||[]).join(', '),
        (d.jobOrderNo||[]).join(', ')
      ]);
    } else if (activeTab === 'requests') {
      data = rawData.map(r => [r.referenceNo, r.department, r.status, formatDate(r.dateFrom), formatDate(r.dateTo)]);
    } else if (activeTab === 'vehicles') {
      data = rawData.map(v => [v.plateNumber, v.model, v.status, v.maintenanceCount || 0, v.repairCost]);
    } else if (activeTab === 'personnel') {
      data = rawData.map(p => [(p.firstname||'').toUpperCase(), (p.lastname||'').toUpperCase(), (p.position||'').toUpperCase(), p.deliveriesCount]);
    }

    const csvContent = [headers.join(','), ...data.map(r => r.map(f => `"${String(f||'').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `${activeTab}_report_${dateStr}.csv`;
    link.click();
    toast.success(`${selectedIds.size > 0 ? 'Selected' : 'Filtered'} report exported successfully`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Loading Report Data...</p>
        </div>
      </div>
    );
  }

  const renderTab = (key, label, icon) => (
    <button 
      className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors shrink-0 whitespace-nowrap ${activeTab === key ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
      onClick={() => { setActiveTab(key); handleResetFilters(); }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 pb-0 shrink-0">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Business Reports</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Filter, Analyze, and Export System Data</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{selectedIds.size} selected</span>
          )}
          <button
            onClick={exportToCSV}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-emerald-700 w-full sm:w-auto"
          >
            <Download className="h-3.5 w-3.5" />
            Export to CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0 min-h-0 rounded-lg border border-border bg-card shadow-sm mx-4 mb-4">
        
        {/* Tabs */}
        <div className="flex flex-wrap border-b border-border bg-card/95 backdrop-blur px-2 pt-2 shrink-0 z-20">
          {renderTab('delivery_plan', 'Delivery Plan', <Truck className="h-3.5 w-3.5" />)}
          {renderTab('requests', 'Requests', <ClipboardList className="h-3.5 w-3.5" />)}
          {renderTab('vehicles', 'Vehicles', <Truck className="h-3.5 w-3.5" />)}
          {renderTab('personnel', 'Personnel', <HardHat className="h-3.5 w-3.5" />)}
        </div>



        {/* Scrollable Content Area */}
        <div className="flex flex-col flex-1 overflow-auto">

        {/* Key Insights Section */}
        {currentInsights.length > 0 && (
          <div className="border-b border-border bg-card p-4 shrink-0">
            <div className="flex items-center gap-1.5 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground">Key Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentInsights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2.5 rounded-md border border-border bg-muted/20 p-3 shadow-sm">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background border border-border shadow-sm">
                    {insight.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-0.5">{insight.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{insight.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual + Table Combo Area */}
        <div className="flex flex-col border-t border-border">
          
          {/* Summary Visualizer */}
          {chartData.length > 0 && (
            <div className="flex flex-col md:flex-row border-b border-border bg-muted/10 p-4 gap-4">
              <div className="w-full md:w-64 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-4 shrink-0 text-center md:text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Metrics Breakdown</p>
                <h2 className="text-3xl font-black text-foreground">{chartData.length}</h2>
                <p className="text-[11px] text-muted-foreground uppercase mt-1">Categories Analyzed</p>
              </div>
              <div className="w-full h-[200px] md:flex-1 relative">
                {activeTab === 'vehicles' && vehiclePlates.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                      {vehiclePlates.map((plate, i) => (
                        <Line key={plate} type="monotone" dataKey={plate} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      ))}
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : activeTab === 'requests' && departmentKeys.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                      {departmentKeys.map((dept, i) => (
                        <Line key={dept} type="monotone" dataKey={dept} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      ))}
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <RechartsTooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                      {activeTab === 'personnel' ? (
                        <>
                          <Bar dataKey="Driver" stackId="a" fill="#3b82f6" barSize={40} />
                          <Bar dataKey="Helper" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        </>
                      ) : (
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}



          {/* Filters - Sticky to top of scroll container */}
          <div className="sticky top-0 z-20 flex flex-col gap-4 sm:flex-row sm:items-center border-b border-border p-4 bg-card shadow-sm shrink-0">
            <div className="flex flex-1 gap-2 flex-wrap items-center">
              
              <div className="relative w-[200px] shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs bg-background pl-8"
                />
              </div>

              {['delivery_plan', 'requests', 'vehicles', 'destinations', 'personnel'].includes(activeTab) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${statusFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                      <Filter className='h-3.5 w-3.5' />
                      <span className="text-[10px] font-bold tracking-wider uppercase">{statusFilter === 'all' ? (activeTab === 'personnel' ? 'Position' : 'Status') : statusFilter}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[180px]">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by {activeTab === 'personnel' ? 'Position' : 'Status'}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem className="text-[10px] uppercase font-bold" checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>ALL</DropdownMenuCheckboxItem>
                    {activeTab === 'personnel' && uniquePositions.map(s => (
                      <DropdownMenuCheckboxItem key={s} className="text-[10px] uppercase" checked={statusFilter === s} onCheckedChange={() => setStatusFilter(s)}>{s}</DropdownMenuCheckboxItem>
                    ))}
                    {activeTab === 'delivery_plan' && ['Pending', 'In Transit', 'Completed'].map(s => (
                      <DropdownMenuCheckboxItem key={s} className="text-[10px] uppercase" checked={statusFilter === s} onCheckedChange={() => setStatusFilter(s)}>{s}</DropdownMenuCheckboxItem>
                    ))}
                    {activeTab === 'requests' && ['Pending', 'Approved', 'Rejected'].map(s => (
                      <DropdownMenuCheckboxItem key={s} className="text-[10px] uppercase" checked={statusFilter === s} onCheckedChange={() => setStatusFilter(s)}>{s}</DropdownMenuCheckboxItem>
                    ))}
                    {activeTab === 'vehicles' && ['Available', 'Maintenance', 'Unavailable'].map(s => (
                      <DropdownMenuCheckboxItem key={s} className="text-[10px] uppercase" checked={statusFilter === s} onCheckedChange={() => setStatusFilter(s)}>{s}</DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {activeTab === 'delivery_plan' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${personnelFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                      <Users className='h-3.5 w-3.5' />
                      <span className="text-[10px] font-bold tracking-wider uppercase truncate max-w-[120px]">{personnelFilter === 'all' ? 'Personnel' : personnelFilter}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[220px] max-h-[300px] overflow-y-auto">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Personnel</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem className="text-[10px] uppercase font-bold" checked={personnelFilter === 'all'} onCheckedChange={() => setPersonnelFilter('all')}>ALL PERSONNEL</DropdownMenuCheckboxItem>
                    {allPersonnelNames.map(name => (
                      <DropdownMenuCheckboxItem key={name} className="text-[10px] uppercase" checked={personnelFilter === name} onCheckedChange={() => setPersonnelFilter(name)}>{name}</DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {['delivery_plan', 'requests'].includes(activeTab) && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={`h-8 w-[120px] text-[10px] font-bold uppercase tracking-wider bg-background ${(dateFrom || dateTo) ? 'border-primary text-primary' : ''}`}
                    title="Date From"
                  />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">TO</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={`h-8 w-[120px] text-[10px] font-bold uppercase tracking-wider bg-background ${(dateFrom || dateTo) ? 'border-primary text-primary' : ''}`}
                    title="Date To"
                  />
                </div>
              )}

              {(searchQuery || dateFrom || dateTo || statusFilter !== 'all') && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-8 gap-1.5 text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider font-bold">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-card relative">
            
            {activeTab === 'delivery_plan' && (
              <table className="w-full min-w-[max-content] border-collapse relative">
                <thead className="sticky top-[161px] sm:top-[65px] z-10 bg-orange-500 backdrop-blur shadow-sm">
                  <tr className="border-b border-orange-600/20">
                    <th className="w-[40px] px-3 py-2.5 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={filteredDeliveryPlan.length > 0 && selectedIds.size === filteredDeliveryPlan.length}
                        onChange={() => toggleSelectAll(filteredDeliveryPlan)}
                        className="h-3.5 w-3.5 accent-white cursor-pointer"
                      />
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Ref No.</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle">Status</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Date</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Purpose</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Activity</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Vehicle</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Customer/Supplier</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Destination</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveryPlan.map((req, idx) => (
                    <tr key={req._id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? 'bg-card/30' : ''} ${selectedIds.has(req._id) ? 'bg-primary/5' : ''}`}>
                      <td className="w-[40px] px-3 py-2 text-center" onClick={() => toggleSelect(req._id)}>
                        <input
                          type="checkbox"
                          readOnly
                          checked={selectedIds.has(req._id)}
                          className="h-3.5 w-3.5 accent-primary cursor-pointer pointer-events-none"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-tight align-middle">{req.referenceNo || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 align-middle text-center"><span className="text-[10px] font-bold uppercase text-muted-foreground">{req.status}</span></td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{formatDate(req.dateFrom)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{(req.purpose||[]).join(', ') || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{(req.activity||[]).join(', ') || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{req.vehicleEquipment || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{(req.customerSupplier||[]).join(', ') || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{(req.destination||[]).join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'requests' && (
              <table className="w-full min-w-[max-content] border-collapse relative">
                <thead className="sticky top-[161px] sm:top-[65px] z-10 bg-orange-500 backdrop-blur shadow-sm">
                  <tr className="border-b border-orange-600/20">
                    <th className="w-[40px] px-3 py-2.5 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={filteredRequests.length > 0 && selectedIds.size === filteredRequests.length}
                        onChange={() => toggleSelectAll(filteredRequests)}
                        className="h-3.5 w-3.5 accent-white cursor-pointer"
                      />
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Ref No.</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Department</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle">Status</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req, index) => (
                    <tr key={req._id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-card/30' : ''} ${selectedIds.has(req._id) ? 'bg-primary/5' : ''}`}>
                      <td className="w-[40px] px-3 py-2 text-center" onClick={() => toggleSelect(req._id)}>
                        <input
                          type="checkbox"
                          readOnly
                          checked={selectedIds.has(req._id)}
                          className="h-3.5 w-3.5 accent-primary cursor-pointer pointer-events-none"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary uppercase tracking-tight align-middle">{req.referenceNo || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{req.department || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 align-middle text-center"><span className="text-[10px] font-bold uppercase text-muted-foreground">{req.requestStatus}</span></td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{formatDate(req.dateFrom)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'vehicles' && (
              <table className="w-full min-w-[max-content] border-collapse relative">
                <thead className="sticky top-[161px] sm:top-[65px] z-10 bg-orange-500 backdrop-blur shadow-sm">
                  <tr className="border-b border-orange-600/20">
                    <th className="w-[40px] px-3 py-2.5 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={filteredVehicles.length > 0 && selectedIds.size === filteredVehicles.length}
                        onChange={() => toggleSelectAll(filteredVehicles)}
                        className="h-3.5 w-3.5 accent-white cursor-pointer"
                      />
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Plate Number</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Model</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle">Status</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Repairs Count</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Repair Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((req, index) => (
                    <tr key={req._id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-card/30' : ''} ${selectedIds.has(req._id) ? 'bg-primary/5' : ''}`}>
                      <td className="w-[40px] px-3 py-2 text-center" onClick={() => toggleSelect(req._id)}>
                        <input
                          type="checkbox"
                          readOnly
                          checked={selectedIds.has(req._id)}
                          className="h-3.5 w-3.5 accent-primary cursor-pointer pointer-events-none"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary uppercase tracking-tight align-middle">{req.plateNumber || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{req.model || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 align-middle text-center"><span className="text-[10px] font-bold uppercase text-muted-foreground">{req.status}</span></td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground text-right align-middle">{req.maintenanceCount || 0}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-rose-600 text-right align-middle">₱ {(req.repairCost || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'personnel' && (
              <table className="w-full min-w-[max-content] border-collapse relative">
                <thead className="sticky top-[161px] sm:top-[65px] z-10 bg-orange-500 backdrop-blur shadow-sm">
                  <tr className="border-b border-orange-600/20">
                    <th className="w-[40px] px-3 py-2.5 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={filteredPersonnel.length > 0 && selectedIds.size === filteredPersonnel.length}
                        onChange={() => toggleSelectAll(filteredPersonnel)}
                        className="h-3.5 w-3.5 accent-white cursor-pointer"
                      />
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Full Name</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Position</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Total Trips</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPersonnel.map((req, index) => (
                    <tr key={req._id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-card/30' : ''} ${selectedIds.has(req._id) ? 'bg-primary/5' : ''}`}>
                      <td className="w-[40px] px-3 py-2 text-center" onClick={() => toggleSelect(req._id)}>
                        <input
                          type="checkbox"
                          readOnly
                          checked={selectedIds.has(req._id)}
                          className="h-3.5 w-3.5 accent-primary cursor-pointer pointer-events-none"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-foreground uppercase tracking-tight align-middle">{req.firstname} {req.lastname}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight align-middle">{req.position}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-black text-primary text-right align-middle">{req.deliveriesCount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
