import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAppToast } from '../../../../components/ui/alert-toast-provider';
import {
  ClipboardList,
  Search,
  Loader2,
  RotateCcw,
  Calendar,
  CalendarDays,
  User,
  Printer
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';

export default function DriverExpenseBreakdown() {
  const { user } = useOutletContext() || {};
  const getInitials = (u) => {
    if (!u) return '';
    if (u.username) return u.username.charAt(0).toUpperCase();
    return '';
  };
  const preparedByInitials = getInitials(user);

  const [deliveries, setDeliveries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [driverFilter, setDriverFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Checkboxes
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toast = useAppToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [deliveriesRes, vehiclesRes] = await Promise.all([
        axios.get('/api/deliveries'),
        axios.get('/api/vehicles')
      ]);
      setVehicles(vehiclesRes.data);
      let completed = deliveriesRes.data.filter(d => d.status === 'Completed');

      // Exclude fuel expenses with payment type "PURCHASE ORDER" and deduct their amounts from totalExpenses
      completed = completed.map(d => {
        if (!d.fuel || d.fuel.length === 0) return d;
        const filteredFuel = d.fuel.filter(f => f.paymentType?.toUpperCase() !== 'PURCHASE ORDER');
        const removedAmount = d.fuel.reduce((sum, f) => {
          if (f.paymentType?.toUpperCase() === 'PURCHASE ORDER') return sum + (f.amount || 0);
          return sum;
        }, 0);

        return {
          ...d,
          fuel: filteredFuel,
          totalExpenses: (d.totalExpenses || 0) - removedAmount
        };
      });

      const sorted = completed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDeliveries(sorted);
    } catch (error) {
      console.error('Error fetching driver expenses:', error);
      toast.error('Failed to load driver expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setDriverFilter('all');
    setMonthFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setSelectedIds(new Set());
    toast.success('Filters cleared');
  };

  // --- Helpers ---
  const joinArray = (arr) => {
    if (!arr || !Array.isArray(arr)) return '—';
    const filtered = arr.filter(Boolean);
    return filtered.length > 0 ? filtered.join(' / ') : '—';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const formatMonthLabel = (yyyymm) => {
    const [yyyy, mm] = yyyymm.split('-');
    const date = new Date(parseInt(yyyy), parseInt(mm) - 1);
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  };

  const sumField = (arr, key) => (arr || []).reduce((sum, item) => sum + (item?.[key] || 0), 0);

  const getVehicleDisplay = (plateNumber) => {
    const vObj = vehicles.find(x => x.plateNumber === plateNumber);
    return vObj ? `${plateNumber} - ${vObj.model}` : plateNumber || '—';
  };

  const buildParticulars = (item) => {
    const details = [];
    (item.fuel || []).forEach(f => { if (f.gasStation) details.push(f.gasStation); });
    (item.tollFee || []).forEach(t => { if (t.details) details.push(t.details); });
    (item.pierExpenses || []).forEach(p => { if (p.details) details.push(p.details); });
    (item.repairAndMaintenance || []).forEach(r => { if (r.details) details.push(r.details); });
    (item.loadExpenses || []).forEach(l => { if (l.details) details.push(l.details); });
    (item.mealExpenses || []).forEach(m => { if (m.details) details.push(m.details); });
    (item.contingency || []).forEach(c => { if (c.details) details.push(c.details); });
    return details.length > 0 ? details.join(', ') : '—';
  };

  const buildParticularsLines = (item) => {
    const details = [];
    (item.fuel || []).forEach(f => { if (f.gasStation) details.push(f.gasStation); });
    (item.tollFee || []).forEach(t => { if (t.details) details.push(t.details); });
    (item.pierExpenses || []).forEach(p => { if (p.details) details.push(p.details); });
    (item.repairAndMaintenance || []).forEach(r => { if (r.details) details.push(r.details); });
    (item.loadExpenses || []).forEach(l => { if (l.details) details.push(l.details); });
    (item.mealExpenses || []).forEach(m => { if (m.details) details.push(m.details); });
    (item.contingency || []).forEach(c => { if (c.details) details.push(c.details); });
    return details;
  };

  const fmt = (val) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // --- Extract filter options ---
  const uniqueDrivers = useMemo(() => {
    const list = new Set();
    deliveries.forEach(d => (d.driver || []).forEach(drv => drv && list.add(drv)));
    return Array.from(list).sort();
  }, [deliveries]);

  const uniqueMonths = useMemo(() => {
    const list = new Set();
    deliveries.forEach(d => {
      if (d.dateFrom) {
        const dObj = new Date(d.dateFrom);
        if (!isNaN(dObj.getTime())) {
          const yyyy = dObj.getFullYear();
          const mm = String(dObj.getMonth() + 1).padStart(2, '0');
          list.add(`${yyyy}-${mm}`);
        }
      }
    });
    return Array.from(list).sort((a, b) => b.localeCompare(a));
  }, [deliveries]);

  // --- Filtering ---
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const q = searchQuery.toLowerCase();
      const searchMatch = !q || (
        (d.referenceNo || '').toLowerCase().includes(q) ||
        (d.vehicleEquipment || '').toLowerCase().includes(q) ||
        (d.customerSupplier || []).join(' ').toLowerCase().includes(q) ||
        (d.driver || []).join(' ').toLowerCase().includes(q) ||
        (d.helper || []).join(' ').toLowerCase().includes(q) ||
        (d.jobOrderNo || []).join(' ').toLowerCase().includes(q) ||
        (d.purpose || []).join(' ').toLowerCase().includes(q)
      );

      const driverMatch = driverFilter === 'all' || (d.driver || []).includes(driverFilter);

      const dateFromMatch = !dateFromFilter || (d.dateFrom && new Date(d.dateFrom) >= new Date(dateFromFilter));
      const dateToMatch = !dateToFilter || (d.dateFrom && new Date(d.dateFrom) <= new Date(dateToFilter));

      let monthMatch = true;
      if (monthFilter !== 'all') {
        if (!d.dateFrom) monthMatch = false;
        else {
          const dObj = new Date(d.dateFrom);
          if (!isNaN(dObj.getTime())) {
            const yyyy = dObj.getFullYear();
            const mm = String(dObj.getMonth() + 1).padStart(2, '0');
            monthMatch = `${yyyy}-${mm}` === monthFilter;
          } else monthMatch = false;
        }
      }

      return searchMatch && driverMatch && dateFromMatch && dateToMatch && monthMatch;
    });
  }, [deliveries, searchQuery, driverFilter, dateFromFilter, dateToFilter, monthFilter]);

  // --- Checkbox logic ---
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDeliveries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDeliveries.map(d => d._id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const isAllSelected = filteredDeliveries.length > 0 && selectedIds.size === filteredDeliveries.length;
  const hasActiveFilters = searchQuery || driverFilter !== 'all' || monthFilter !== 'all' || dateFromFilter || dateToFilter;

  // ========== PRINT DATA ==========
  const printItems = selectedIds.size > 0
    ? filteredDeliveries.filter(d => selectedIds.has(d._id))
    : filteredDeliveries;

  const printMeta = useMemo(() => {
    if (!printItems.length) return { driver: '', helper: '', jobDestLines: [], purposeLines: [], dateLines: [] };
    const drivers = [...new Set(printItems.flatMap(d => d.driver).filter(Boolean))].join(' / ');
    const helpers = [...new Set(printItems.flatMap(d => d.helper).filter(Boolean))].join(' / ');

    const dates = printItems.map(d => new Date(d.dateFrom)).filter(d => !isNaN(d));
    let dr = '';
    if (dates.length) {
      const mn = new Date(Math.min(...dates)).toLocaleDateString('en-US');
      const mx = new Date(Math.max(...dates)).toLocaleDateString('en-US');
      dr = mn === mx ? mn : `${mn} - ${mx}`;
    }

    const jobDestPairs = [];
    const dateLines = [];
    printItems.forEach(d => {
      const jos = d.jobOrderNo || [];
      const dests = d.customerSupplier || [];
      const rowDate = d.dateFrom ? new Date(d.dateFrom).toLocaleDateString('en-US') : '';
      const maxLen = Math.max(jos.length, dests.length);
      for (let i = 0; i < Math.max(1, maxLen); i++) {
        const jo = jos[i] || '';
        const dest = dests[i] || '';
        const pair = [jo, dest].filter(Boolean).join(' - ');
        if (pair && !jobDestPairs.includes(pair)) {
          jobDestPairs.push(pair);
          dateLines.push(rowDate);
        }
      }
    });

    const purposeLines = [...new Set(printItems.flatMap(d => {
      const pArr = d.purpose || [];
      const aArr = d.activity || [];
      const maxLen = Math.max(pArr.length, aArr.length, 1);
      const combined = [];
      for (let i = 0; i < maxLen; i++) {
        const p = pArr[i] || '';
        const a = aArr[i] || '';
        const pair = [p, a].filter(Boolean).join(' - ');
        if (pair) combined.push(pair);
      }
      return combined;
    }))];

    return {
      driver: drivers || '\u2014',
      helper: helpers || '',
      jobDestLines: jobDestPairs,
      purposeLines,
      dateLines: dateLines.length > 0 ? dateLines : ['\u2014']
    };
  }, [printItems]);

  const pTotals = useMemo(() => ({
    diesel: printItems.reduce((a, c) => a + sumField(c.fuel, 'amount'), 0),
    toll: printItems.reduce((a, c) => a + sumField(c.tollFee, 'amt'), 0),
    pier: printItems.reduce((a, c) => a + sumField(c.pierExpenses, 'amt'), 0),
    repair: printItems.reduce((a, c) => a + sumField(c.repairAndMaintenance, 'amt'), 0),
    load: printItems.reduce((a, c) => a + sumField(c.loadExpenses, 'amt'), 0),
    meals: printItems.reduce((a, c) => a + sumField(c.mealExpenses, 'amt'), 0),
    contingency: printItems.reduce((a, c) => a + sumField(c.contingency, 'amt'), 0),
    total: printItems.reduce((a, c) => a + (c.totalExpenses || 0), 0),
  }), [printItems]);

  return (
    <>
      {/* ====== SCREEN UI ====== */}
      <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500 print:hidden">
        {/* Header */}
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center shrink-0">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Driver Expenses</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Complete expense breakdown per driver for all completed deliveries</p>
          </div>
          {selectedIds.size > 0 && (
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{selectedIds.size} selected</span>
          )}
        </div>

        {/* Table & Filters Card */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 rounded-lg border border-border bg-card shadow-sm overflow-hidden">

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center border-b border-border p-4 bg-muted/20 shrink-0">
            <div className="flex flex-1 gap-2 flex-wrap items-center">

              <div className="relative w-[200px] shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs bg-background pl-8"
                />
              </div>

              {/* Driver Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${driverFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                    <User className='h-3.5 w-3.5' />
                    <span className="text-[10px] font-bold tracking-wider uppercase max-w-[120px] truncate">{driverFilter === 'all' ? 'Drivers' : driverFilter}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px] max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Driver</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem className="text-[10px] uppercase font-bold" checked={driverFilter === 'all'} onCheckedChange={() => setDriverFilter('all')}>ALL DRIVERS</DropdownMenuCheckboxItem>
                  {uniqueDrivers.map(d => (
                    <DropdownMenuCheckboxItem key={d} className="text-[10px] uppercase" checked={driverFilter === d} onCheckedChange={() => setDriverFilter(d)}>{d}</DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Month Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${monthFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                    <CalendarDays className='h-3.5 w-3.5' />
                    <span className="text-[10px] font-bold tracking-wider uppercase max-w-[90px] truncate">{monthFilter === 'all' ? 'Months' : formatMonthLabel(monthFilter)}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[180px] max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Month</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem className="text-[10px] uppercase font-bold" checked={monthFilter === 'all'} onCheckedChange={() => setMonthFilter('all')}>ALL MONTHS</DropdownMenuCheckboxItem>
                  {uniqueMonths.map(m => (
                    <DropdownMenuCheckboxItem key={m} className="text-[10px] uppercase" checked={monthFilter === m} onCheckedChange={() => setMonthFilter(m)}>{formatMonthLabel(m)}</DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Date Range Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${dateFromFilter || dateToFilter ? 'border-primary text-primary' : ''}`}>
                    <Calendar className='h-3.5 w-3.5' />
                    <span className="text-[10px] font-bold tracking-wider uppercase">Date Range</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="p-3 space-y-2">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Date Range</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase">From</label>
                    <input
                      type="date"
                      value={dateFromFilter}
                      onChange={(e) => setDateFromFilter(e.target.value)}
                      className="h-8 w-full rounded border border-input bg-background px-2 text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase">To</label>
                    <input
                      type="date"
                      value={dateToFilter}
                      onChange={(e) => setDateToFilter(e.target.value)}
                      className="h-8 w-full rounded border border-input bg-background px-2 text-[10px]"
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 gap-1.5 text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider font-bold">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}

              <div className="ml-auto">
                <Button variant="default" size="sm" onClick={() => window.print()} disabled={printItems.length === 0} className="h-8 gap-1.5 text-[10px] uppercase tracking-wider font-bold shrink-0 shadow-sm">
                  <Printer className="h-3.5 w-3.5" />
                  Print Report
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto bg-card min-w-0 min-h-0 relative">
            {isLoading ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loading driver expenses...</span>
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
                <ClipboardList className="h-8 w-8 text-muted-foreground/50 mb-1" />
                <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No records found</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Adjust filters or add deliveries with expenses.</p>
              </div>
            ) : (
              <table className="w-full min-w-[2200px] border-collapse relative">
                <thead className="sticky top-0 z-10 bg-orange-500 backdrop-blur shadow-sm">
                  <tr className="border-b border-orange-600/20">
                    <th className="w-[40px] px-3 py-2.5 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="h-3.5 w-3.5 accent-white cursor-pointer"
                      />
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Driver</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Helper</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle">Job Order No.</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Destination</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Purpose</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Activity</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Date</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Vehicle</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Particulars</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Diesel</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Toll Fee</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Pier</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Repair & Maint.</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Load</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Meals</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Contingency</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle bg-orange-600/40">Total Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map((item, index) => (
                    <tr
                      key={item._id}
                      onClick={() => toggleSelect(item._id)}
                      className={`cursor-pointer border-b border-border/50 hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-card/30' : ''} ${selectedIds.has(item._id) ? 'bg-primary/5' : ''}`}
                    >
                      <td className="w-[40px] px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          readOnly
                          checked={selectedIds.has(item._id)}
                          className="h-3.5 w-3.5 accent-primary cursor-pointer pointer-events-none"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{joinArray(item.driver)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{joinArray(item.helper)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-tight text-center">{joinArray(item.jobOrderNo)}</td>
                      <td className="px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight max-w-[200px] truncate" title={joinArray(item.customerSupplier)}>{joinArray(item.customerSupplier)}</td>
                      <td className="px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight max-w-[180px] truncate" title={joinArray(item.purpose)}>{joinArray(item.purpose)}</td>
                      <td className="px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight max-w-[180px] truncate" title={joinArray(item.activity)}>{joinArray(item.activity)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight">
                        {item.dateFrom && item.dateTo ? `${formatDate(item.dateFrom)} - ${formatDate(item.dateTo)}` : formatDate(item.dateFrom)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight">{item.vehicleEquipment || '—'}</td>
                      <td className="px-3 py-2 text-[10px] font-medium text-muted-foreground max-w-[300px] truncate uppercase" title={buildParticulars(item).toUpperCase()}>{buildParticulars(item)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">{fmt(sumField(item.fuel, 'amount'))}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">{fmt(sumField(item.tollFee, 'amt'))}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">{fmt(sumField(item.pierExpenses, 'amt'))}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">{fmt(sumField(item.repairAndMaintenance, 'amt'))}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">{fmt(sumField(item.loadExpenses, 'amt'))}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">{fmt(sumField(item.mealExpenses, 'amt'))}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">{fmt(sumField(item.contingency, 'amt'))}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary text-right bg-muted/10">
                        ₱ {fmt(item.totalExpenses)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ====== PRINT LAYOUT — Letter Landscape, 0.5cm margins, cm units, 9pt ====== */}
      <style>{`
      @media print {
        @page { size: letter landscape; margin: 0.5cm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; margin: 0; padding: 0; }
        * { box-sizing: border-box; }
      }
      .deb-print-report { display: none; }
      @media print { .deb-print-report { display: block !important; width: 100%; margin: 0; padding: 0; } }
      .deb-rtable { width: 100%; border-collapse: collapse; table-layout: auto; }
      .deb-rtable th, .deb-rtable td { border: 1px solid #000; padding: 0.05cm 0.1cm; font-size: 8pt; white-space: nowrap; }
      .deb-rtable th { font-weight: bold; }
      .deb-rtable td:nth-child(3) { white-space: normal; }
      .deb-meta-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      .deb-meta-table td { border: none; padding: 0.08cm 0.15cm; }
    `}</style>

      <div className="deb-print-report" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#000', background: '#fff' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '0.6cm' }}>
          <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>ENERTECH SYSTEM INDUSTRIES, INC.</div>
          <div style={{ fontSize: '10pt' }}>LOGISTIC DEPARTMENT</div>
          <div style={{ fontSize: '10pt' }}>DRIVER'S EXPENSES REPORT</div>
        </div>

        {/* META ROW */}
        <table className="deb-meta-table" style={{ fontSize: '9pt', marginBottom: '0cm', tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              <td style={{ height: '1cm', width: '5.25cm', verticalAlign: 'top', textTransform: 'uppercase' }}>
                <div>{printMeta.driver}</div>
                {printMeta.helper && <div style={{ fontSize: '8pt', marginTop: '2px' }}>{printMeta.helper}</div>}
              </td>
              <td style={{ height: '1cm', width: '7.22cm', verticalAlign: 'top', textTransform: 'uppercase' }}>
                {printMeta.jobDestLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </td>
              <td style={{ height: '1cm', width: '8.91cm', verticalAlign: 'top', textTransform: 'uppercase' }}>
                {printMeta.purposeLines.map((p, i) => (
                  <div key={i}>{p}</div>
                ))}
              </td>
              <td style={{ height: '1cm', width: '4.78cm', verticalAlign: 'top' }}>
                {printMeta.dateLines.map((d, i) => (
                  <div key={i}>{d}</div>
                ))}
              </td>
            </tr>
          </tbody>
        </table>

        {/* MAIN TABLE */}
        <table className="deb-rtable" style={{ fontSize: '8pt', pageBreakInside: 'avoid' }}>
          <thead>
            <tr style={{ fontWeight: 'bold', textAlign: 'left' }}>
              <th>DATE</th>
              <th>VEHICLE</th>
              <th>PARTICULARS</th>
              <th>DIESEL</th>
              <th>TOLL FEE</th>
              <th>PIER EXPENSES</th>
              <th style={{ lineHeight: '1.15' }}>REPAIR AND<br />MAINTENANCE</th>
              <th>LOAD</th>
              <th>MEALS</th>
              <th>CONTINGENCY</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {printItems.map(row => {
              // Build line items: each has a label (particular), date, and which column it belongs to
              const lineItems = [];
              (row.fuel || []).forEach(f => { if (f.gasStation || f.amount) lineItems.push({ particular: f.gasStation || '', date: f.date, col: 'diesel', amt: f.amount || 0 }); });
              (row.tollFee || []).forEach(t => { if (t.details || t.amt) lineItems.push({ particular: t.details || '', date: t.date, col: 'toll', amt: t.amt || 0 }); });
              (row.pierExpenses || []).forEach(p => { if (p.details || p.amt) lineItems.push({ particular: p.details || '', date: p.date, col: 'pier', amt: p.amt || 0 }); });
              (row.repairAndMaintenance || []).forEach(r => { if (r.details || r.amt) lineItems.push({ particular: r.details || '', date: r.date, col: 'repair', amt: r.amt || 0 }); });
              (row.loadExpenses || []).forEach(l => { if (l.details || l.amt) lineItems.push({ particular: l.details || '', date: l.date, col: 'load', amt: l.amt || 0 }); });
              (row.mealExpenses || []).forEach(m => { if (m.details || m.amt) lineItems.push({ particular: m.details || '', date: m.date, col: 'meals', amt: m.amt || 0 }); });
              (row.contingency || []).forEach(c => { if (c.details || c.amt) lineItems.push({ particular: c.details || '', date: c.date, col: 'contingency', amt: c.amt || 0 }); });

              const rowCount = lineItems.length || 1;
              const cellStyle = { textAlign: 'right', verticalAlign: 'top', padding: '0.08cm 0.15cm' };

              if (lineItems.length === 0) {
                return (
                  <tr key={`p-${row._id}`}>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatDate(row.dateFrom)}</td>
                    <td style={{ textTransform: 'uppercase', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{row.vehicleEquipment || '\u2014'}</td>
                    <td style={{ textTransform: 'uppercase', verticalAlign: 'top' }}>{'\u2014'}</td>
                    <td style={cellStyle}></td><td style={cellStyle}></td><td style={cellStyle}></td><td style={cellStyle}></td>
                    <td style={cellStyle}></td><td style={cellStyle}></td><td style={cellStyle}></td>
                    <td style={{ ...cellStyle, fontWeight: 'bold' }}>{fmt(row.totalExpenses)}</td>
                  </tr>
                );
              }

              return lineItems.map((li, idx) => (
                <tr key={`p-${row._id}-${idx}`}>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{li.date ? formatDate(li.date) : formatDate(row.dateFrom)}</td>
                  {idx === 0 && (
                    <td rowSpan={rowCount} style={{ textTransform: 'uppercase', whiteSpace: 'nowrap', verticalAlign: 'top', borderBottom: '1px solid #000' }}>{row.vehicleEquipment || '\u2014'}</td>
                  )}
                  <td style={{ textTransform: 'uppercase', verticalAlign: 'top' }}>{li.particular}</td>
                  <td style={cellStyle}>{li.col === 'diesel' ? fmt(li.amt) : ''}</td>
                  <td style={cellStyle}>{li.col === 'toll' ? fmt(li.amt) : ''}</td>
                  <td style={cellStyle}>{li.col === 'pier' ? fmt(li.amt) : ''}</td>
                  <td style={cellStyle}>{li.col === 'repair' ? fmt(li.amt) : ''}</td>
                  <td style={cellStyle}>{li.col === 'load' ? fmt(li.amt) : ''}</td>
                  <td style={cellStyle}>{li.col === 'meals' ? fmt(li.amt) : ''}</td>
                  <td style={cellStyle}>{li.col === 'contingency' ? fmt(li.amt) : ''}</td>
                  {idx === 0 && (
                    <td rowSpan={rowCount} style={{ ...cellStyle, fontWeight: 'bold', borderBottom: '1px solid #000' }}>{fmt(row.totalExpenses)}</td>
                  )}
                </tr>
              ));
            })}
            {printItems.length === 0 && (
              <tr><td colSpan={11} style={{ textAlign: 'center', padding: '0.5cm', fontStyle: 'italic' }}>No records</td></tr>
            )}
            <tr style={{ fontWeight: 'bold' }}>
              <td colSpan={2}></td>
              <td style={{ textAlign: 'center' }}>TOTAL</td>
              <td style={{ textAlign: 'right' }}>{fmt(pTotals.diesel)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(pTotals.toll)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(pTotals.pier)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(pTotals.repair)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(pTotals.load)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(pTotals.meals)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(pTotals.contingency)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(pTotals.total)}</td>
            </tr>
            {/* ACA / FOR RETURN Aligned with columns */}
            <tr style={{ fontWeight: 'bold' }}>
              <td colSpan={9} style={{ border: 'none' }}></td>
              <td style={{ textAlign: 'right', border: 'none', paddingTop: '0.3cm' }}>ACA:</td>
              <td style={{ textAlign: 'right', border: 'none', paddingTop: '0.3cm' }}>{fmt(printItems.reduce((a, c) => a + (c.totalBudget || 0), 0))}</td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td colSpan={9} style={{ border: 'none' }}></td>
              <td style={{ textAlign: 'right', border: 'none', paddingTop: '0.1cm', paddingBottom: '0.8cm' }}>FOR RETURN:</td>
              <td style={{ textAlign: 'right', border: 'none', paddingTop: '0.1cm', paddingBottom: '0.8cm' }}>{fmt(printItems.reduce((a, c) => a + (c.totalBudget || 0), 0) - pTotals.total)}</td>
            </tr>
          </tbody>
        </table>

        {/* SIGNATURES */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', fontWeight: 'bold', padding: '0 0.3cm' }}>
          <div style={{ flex: 1, marginRight: '0.5cm' }}>
            <div>PREPARED BY: JRAZ</div>
          </div>
          <div style={{ flex: 1, marginRight: '0.5cm', textAlign: 'center' }}>
            <div>RECOMMENDED BY: ASF/EAD</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div>APPROVED BY: LBC</div>
          </div>
        </div>

      </div>
    </>
  );
}
