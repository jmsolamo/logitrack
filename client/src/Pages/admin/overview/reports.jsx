import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FileText, Download, Calendar as CalendarIcon, Filter, Search, RotateCcw,
  Truck, CheckCircle2, AlertTriangle, X, Lightbulb, TrendingUp, Users,
  HardHat, ShoppingCart, DollarSign
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from 'react-toastify';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#6366f1'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('deliveries');
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [deliveries, setDeliveries] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [personnel, setPersonnel] = useState([]);

  // Shared Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Deliveries specific filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [delRes, purRes, perRes] = await Promise.all([
        axios.get('/api/deliveries'),
        axios.get('/api/purchases'),
        axios.get('/api/personnels')
      ]);
      setDeliveries(delRes.data);
      setPurchases(purRes.data);
      setPersonnel(perRes.data);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  // --- DELIVERIES LOGIC ---
  const getStatusDisplay = (d) => {
    if (d.status === 'Completed') return 'Completed';
    return d.status || 'Pending';
  };

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const q = searchQuery.toLowerCase();
      const searchMatch = !q || (
        (d.referenceNo || '').toLowerCase().includes(q) ||
        (d.deliveryType || '').toLowerCase().includes(q) ||
        (d.vehicleEquipment || '').toLowerCase().includes(q) ||
        (d.requestedBy || '').toLowerCase().includes(q)
      );

      const statusMatch = statusFilter === 'all' || getStatusDisplay(d) === statusFilter;
      const typeMatch = typeFilter === 'all' || (d.deliveryType || '').toLowerCase() === typeFilter.toLowerCase();
      
      const dFrom = dateFrom ? new Date(dateFrom) : null;
      const dTo = dateTo ? new Date(dateTo) : null;
      const dDate = d.dateFrom ? new Date(d.dateFrom) : null;

      let dateMatch = true;
      if (dDate) {
        if (dFrom && dTo) dateMatch = dDate >= dFrom && dDate <= dTo;
        else if (dFrom) dateMatch = dDate >= dFrom;
        else if (dTo) dateMatch = dDate <= dTo;
      } else if (dFrom || dTo) dateMatch = false;

      return searchMatch && statusMatch && typeMatch && dateMatch;
    });
  }, [deliveries, searchQuery, statusFilter, typeFilter, dateFrom, dateTo]);

  const deliveryInsights = useMemo(() => {
    if (filteredDeliveries.length === 0) return [];
    const generated = [];
    
    // 1. Completion Rate
    const completed = filteredDeliveries.filter(d => getStatusDisplay(d) === 'Completed').length;
    const completionRate = Math.round((completed / filteredDeliveries.length) * 100);
    generated.push({
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      title: 'Completion Rate',
      text: `${completionRate}% of deliveries are Completed (${completed}/${filteredDeliveries.length}).`
    });

    // 2. Financials
    let totalRevenue = 0;
    let totalExpense = 0;
    filteredDeliveries.forEach(d => {
      totalRevenue += (d.deliveryCharge || 0);
      totalExpense += (d.totalExpenses || 0);
    });
    generated.push({
      icon: <DollarSign className="h-4 w-4 text-amber-500" />,
      title: 'Financials Overview',
      text: `Revenue: ₱${totalRevenue.toLocaleString()} | Expenses: ₱${totalExpense.toLocaleString()}`
    });

    return generated;
  }, [filteredDeliveries]);

  const deliveryChartData = useMemo(() => {
    const counts = filteredDeliveries.reduce((acc, curr) => {
      const s = getStatusDisplay(curr);
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ status: key, count: counts[key] })).sort((a, b) => b.count - a.count);
  }, [filteredDeliveries]);

  // --- PURCHASES LOGIC ---
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const q = searchQuery.toLowerCase();
      const searchMatch = !q || (
        (p.category || '').toLowerCase().includes(q) ||
        (p.supplier || '').toLowerCase().includes(q) ||
        (p.purchasedBy || '').toLowerCase().includes(q)
      );

      const dFrom = dateFrom ? new Date(dateFrom) : null;
      const dTo = dateTo ? new Date(dateTo) : null;
      const pDate = p.date ? new Date(p.date) : null;

      let dateMatch = true;
      if (pDate) {
        if (dFrom && dTo) dateMatch = pDate >= dFrom && pDate <= dTo;
        else if (dFrom) dateMatch = pDate >= dFrom;
        else if (dTo) dateMatch = pDate <= dTo;
      } else if (dFrom || dTo) dateMatch = false;

      return searchMatch && dateMatch;
    });
  }, [purchases, searchQuery, dateFrom, dateTo]);

  const purchaseInsights = useMemo(() => {
    if (filteredPurchases.length === 0) return [];
    const generated = [];
    
    // 1. Total Spend
    const totalSpend = filteredPurchases.reduce((sum, p) => sum + (parseFloat(String(p.amount).replace(/,/g, '')) || 0), 0);
    generated.push({
      icon: <DollarSign className="h-4 w-4 text-rose-500" />,
      title: 'Total Spend',
      text: `₱${totalSpend.toLocaleString()} spent across ${filteredPurchases.length} purchases.`
    });

    // 2. Top Category
    const categories = {};
    filteredPurchases.forEach(p => {
      if (p.category) categories[p.category] = (categories[p.category] || 0) + 1;
    });
    const topCat = Object.keys(categories).sort((a, b) => categories[b] - categories[a])[0];
    if (topCat) {
      generated.push({
        icon: <ShoppingCart className="h-4 w-4 text-blue-500" />,
        title: 'Top Category',
        text: `${topCat} is the most frequent purchase category.`
      });
    }

    return generated;
  }, [filteredPurchases]);

  const purchaseChartData = useMemo(() => {
    const cats = filteredPurchases.reduce((acc, curr) => {
      const c = curr.category || 'Unknown';
      acc[c] = (acc[c] || 0) + (parseFloat(String(curr.amount).replace(/,/g, '')) || 0);
      return acc;
    }, {});
    return Object.keys(cats).map(key => ({ category: key, total: cats[key] })).sort((a, b) => b.total - a.total);
  }, [filteredPurchases]);

  // --- PERSONNEL LOGIC ---
  const filteredPersonnel = useMemo(() => {
    return personnel.filter((p) => {
      const q = searchQuery.toLowerCase();
      return !q || (
        (p.firstname || '').toLowerCase().includes(q) ||
        (p.lastname || '').toLowerCase().includes(q) ||
        (p.position || '').toLowerCase().includes(q)
      );
    });
  }, [personnel, searchQuery]);

  const personnelInsights = useMemo(() => {
    if (filteredPersonnel.length === 0) return [];
    const generated = [];
    
    const positions = {};
    filteredPersonnel.forEach(p => {
      if (p.position) positions[p.position] = (positions[p.position] || 0) + 1;
    });
    const drivers = positions['Driver'] || 0;
    const helpers = positions['Helper'] || 0;

    generated.push({
      icon: <HardHat className="h-4 w-4 text-indigo-500" />,
      title: 'Workforce Breakdown',
      text: `${drivers} Drivers and ${helpers} Helpers currently active in the system.`
    });

    return generated;
  }, [filteredPersonnel]);


  // --- EXPORT LOGIC ---
  const exportToCSV = () => {
    let dataToExport = [];
    let headers = [];
    let filename = '';

    if (activeTab === 'deliveries') {
      if (filteredDeliveries.length === 0) return toast.warning('No data to export');
      headers = ['Reference No', 'Status', 'Type', 'Date', 'Vehicle', 'Destination', 'Requested By', 'Revenue', 'Expenses'];
      dataToExport = filteredDeliveries.map(d => [
        d.referenceNo || '—', getStatusDisplay(d), d.deliveryType || '—', 
        d.dateFrom ? new Date(d.dateFrom).toISOString().split('T')[0] : '—',
        d.vehicleEquipment || '—', (d.destination || []).join(' / ') || '—', d.requestedBy || '—',
        d.deliveryCharge || 0, d.totalExpenses || 0
      ]);
      filename = 'deliveries_report.csv';
    } else if (activeTab === 'purchases') {
      if (filteredPurchases.length === 0) return toast.warning('No data to export');
      headers = ['Date', 'Category', 'Items', 'Amount', 'Supplier', 'Purchased By'];
      dataToExport = filteredPurchases.map(p => [
        p.date || '—', p.category || '—', p.items || '—', p.amount || '0', p.supplier || '—', p.purchasedBy || '—'
      ]);
      filename = 'purchases_report.csv';
    } else if (activeTab === 'personnel') {
      if (filteredPersonnel.length === 0) return toast.warning('No data to export');
      headers = ['First Name', 'Last Name', 'Position'];
      dataToExport = filteredPersonnel.map(p => [
        p.firstname || '—', p.lastname || '—', p.position || '—'
      ]);
      filename = 'personnel_report.csv';
    }

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${new Date().toISOString().split('T')[0]}_${filename}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
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

  // Active Context
  const currentInsights = activeTab === 'deliveries' ? deliveryInsights : activeTab === 'purchases' ? purchaseInsights : personnelInsights;

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-4 flex items-center justify-between shrink-0 p-4 pb-0">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Business Reports</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Filter, Analyze, and Export System Data</p>
        </div>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <Download className="h-3.5 w-3.5" />
          Export to CSV
        </button>
      </div>

      <div className="flex flex-col flex-1 min-w-0 min-h-0 rounded-lg border border-border bg-card shadow-sm overflow-hidden mx-4 mb-4">
        
        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/30 px-2 pt-2">
          <button 
            className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'deliveries' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => { setActiveTab('deliveries'); handleResetFilters(); }}
          >
            Deliveries
          </button>
          <button 
            className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'purchases' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => { setActiveTab('purchases'); handleResetFilters(); }}
          >
            Purchases
          </button>
          <button 
            className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'personnel' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => { setActiveTab('personnel'); handleResetFilters(); }}
          >
            Personnel
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center border-b border-border p-4 bg-muted/10 shrink-0">
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

            {activeTab === 'deliveries' && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${statusFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                      <Filter className='h-3.5 w-3.5' />
                      <span className="text-[10px] font-bold tracking-wider uppercase">{statusFilter === 'all' ? 'Status' : statusFilter}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[180px]">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem className="text-[10px] uppercase font-bold" checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>ALL</DropdownMenuCheckboxItem>
                    {['Pending', 'In Transit', 'Completed'].map(s => (
                      <DropdownMenuCheckboxItem key={s} className="text-[10px] uppercase" checked={statusFilter === s} onCheckedChange={() => setStatusFilter(s)}>{s}</DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${typeFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                      <Truck className='h-3.5 w-3.5' />
                      <span className="text-[10px] font-bold tracking-wider uppercase">{typeFilter === 'all' ? 'Type' : typeFilter}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[180px]">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem className="text-[10px] uppercase font-bold" checked={typeFilter === 'all'} onCheckedChange={() => setTypeFilter('all')}>ALL TYPES</DropdownMenuCheckboxItem>
                    {['Field Trip', 'Itinerary'].map(s => (
                      <DropdownMenuCheckboxItem key={s} className="text-[10px] uppercase" checked={typeFilter === s} onCheckedChange={() => setTypeFilter(s)}>{s}</DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {(activeTab === 'deliveries' || activeTab === 'purchases') && (
              <div className="flex items-center gap-2 bg-background border border-input rounded-md px-2 h-8 shrink-0">
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent border-none outline-none text-[10px] w-[100px]" title="Date From" />
                <span className="text-[10px] text-muted-foreground font-bold">-</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent border-none outline-none text-[10px] w-[100px]" title="Date To" />
              </div>
            )}

            {(searchQuery || dateFrom || dateTo || statusFilter !== 'all' || typeFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-8 gap-1.5 text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider font-bold">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Key Insights Section */}
        {currentInsights.length > 0 && (
          <div className="border-b border-border bg-card p-4 shrink-0">
            <div className="flex items-center gap-1.5 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground">Key Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
        <div className="flex flex-col flex-1 overflow-hidden">
          
          {/* Summary Visualizer for Deliveries */}
          {activeTab === 'deliveries' && filteredDeliveries.length > 0 && (
            <div className="h-[200px] border-b border-border bg-muted/10 p-4 shrink-0 flex gap-4">
              <div className="w-64 flex flex-col justify-center border-r border-border pr-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Report Summary</p>
                <h2 className="text-3xl font-black text-foreground">{filteredDeliveries.length}</h2>
                <p className="text-[11px] text-muted-foreground uppercase mt-1">Total Deliveries</p>
              </div>
              <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deliveryChartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <RechartsTooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Summary Visualizer for Purchases */}
          {activeTab === 'purchases' && filteredPurchases.length > 0 && (
            <div className="h-[200px] border-b border-border bg-muted/10 p-4 shrink-0 flex gap-4">
              <div className="w-64 flex flex-col justify-center border-r border-border pr-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Spend</p>
                <h2 className="text-3xl font-black text-rose-600">
                  ₱{filteredPurchases.reduce((sum, p) => sum + (parseFloat(String(p.amount).replace(/,/g, '')) || 0), 0).toLocaleString()}
                </h2>
                <p className="text-[11px] text-muted-foreground uppercase mt-1">{filteredPurchases.length} Records</p>
              </div>
              <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purchaseChartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <RechartsTooltip cursor={{ fill: '#f3f4f6' }} formatter={(value) => `₱${value.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                    <Bar dataKey="total" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table Area */}
          <div className="flex-1 overflow-auto bg-card relative">
            
            {/* Deliveries Table */}
            {activeTab === 'deliveries' && (
              filteredDeliveries.length === 0 ? (
                <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
                  <FileText className="h-8 w-8 text-muted-foreground/50 mb-1" />
                  <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No records found</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Adjust filters to see report data.</p>
                </div>
              ) : (
                <table className="w-full min-w-[max-content] border-collapse relative">
                  <thead className="sticky top-0 z-10 bg-slate-900 backdrop-blur shadow-sm">
                    <tr className="border-b border-slate-800">
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 text-left align-middle">Ref No.</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 text-center align-middle">Status</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 text-left align-middle">Schedule</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 text-left align-middle">Vehicle</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400 text-right align-middle">Revenue</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-rose-400 text-right align-middle">Expenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.map((req, index) => {
                      const status = getStatusDisplay(req);
                      let sc = { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' };
                      if (status === 'Completed') sc = { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
                      else if (status === 'Pending') sc = { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' };
                      else if (status === 'In Transit') sc = { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' };

                      return (
                        <tr key={req._id} className={`border-b border-border/50 hover:bg-muted/30 ${index % 2 === 0 ? 'bg-card/30' : ''}`}>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-tight align-middle">{req.referenceNo || '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 align-middle text-center">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${sc.bg} ${sc.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />{status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">
                            {req.dateFrom && req.dateTo ? `${formatDate(req.dateFrom)} - ${formatDate(req.dateTo)}` : formatDate(req.dateFrom)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{req.vehicleEquipment || '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-emerald-600 tracking-tight align-middle text-right">₱{(req.deliveryCharge || 0).toLocaleString()}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-rose-600 tracking-tight align-middle text-right">₱{(req.totalExpenses || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}

            {/* Purchases Table */}
            {activeTab === 'purchases' && (
              filteredPurchases.length === 0 ? (
                <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/50 mb-1" />
                  <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No purchases found</p>
                </div>
              ) : (
                <table className="w-full min-w-[max-content] border-collapse relative">
                  <thead className="sticky top-0 z-10 bg-slate-900 backdrop-blur shadow-sm">
                    <tr className="border-b border-slate-800">
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 text-left align-middle">Date</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 text-left align-middle">Category</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 text-left align-middle">Items</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 text-left align-middle">Supplier</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-rose-400 text-right align-middle">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((req, index) => (
                      <tr key={req._id} className={`border-b border-border/50 hover:bg-muted/30 ${index % 2 === 0 ? 'bg-card/30' : ''}`}>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{formatDate(req.date)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary uppercase tracking-tight align-middle">{req.category || '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight align-middle">{req.items || '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{req.supplier || '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-rose-600 tracking-tight align-middle text-right">₱{req.amount || '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Personnel Table */}
            {activeTab === 'personnel' && (
              filteredPersonnel.length === 0 ? (
                <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
                  <HardHat className="h-8 w-8 text-muted-foreground/50 mb-1" />
                  <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No personnel found</p>
                </div>
              ) : (
                <table className="w-full min-w-[max-content] border-collapse relative">
                  <thead className="sticky top-0 z-10 bg-slate-900 backdrop-blur shadow-sm">
                    <tr className="border-b border-slate-800">
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 text-left align-middle">First Name</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 text-left align-middle">Last Name</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 text-left align-middle">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPersonnel.map((req, index) => (
                      <tr key={req._id} className={`border-b border-border/50 hover:bg-muted/30 ${index % 2 === 0 ? 'bg-card/30' : ''}`}>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary uppercase tracking-tight align-middle">{req.firstname || '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary uppercase tracking-tight align-middle">{req.lastname || '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{req.position || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
