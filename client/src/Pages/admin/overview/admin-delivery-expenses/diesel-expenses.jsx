import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRef } from 'react';
import { useAppToast } from '../../../../components/ui/alert-toast-provider';
import {
  ClipboardList,
  Search,
  Loader2,
  RotateCcw,
  Calendar,
  CalendarDays,
  Truck,
  Printer,
  Download
} from 'lucide-react';
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

export default function DieselExpenses() {
  const [deliveries, setDeliveries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  // Checkboxes
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toast = useAppToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [response, vehiclesRes] = await Promise.all([
        axios.get('/api/deliveries'),
        axios.get('/api/vehicles')
      ]);
      setVehicles(vehiclesRes.data);
      const completed = response.data.filter(d => d.status === 'Completed');
      const sorted = completed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDeliveries(sorted);
    } catch (error) {
      console.error('Error fetching diesel data:', error);
      toast.error('Failed to load diesel data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setDateFilter('');
    setMonthFilter('all');
    setVehicleFilter('all');
    setSelectedIds(new Set());
    toast.success('Filters cleared');
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === flattenedRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(flattenedRows.map(r => r._id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
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

  // --- Flatten fuel entries into rows ---
  const flattenedRows = useMemo(() => {
    const rows = [];
    deliveries.forEach(d => {
      (d.fuel || []).forEach((f, idx) => {
        if (f.amount > 0 || f.liters > 0 || f.gasStation || f.invoiceNo) {
          rows.push({
            _id: `${d._id}-fuel-${idx}`,
            deliveryId: d._id,
            dateFrom: d.dateFrom,
            driver: d.driver,
            customerSupplier: d.customerSupplier,
            destination: d.destination,
            jobOrderNo: d.jobOrderNo,
            gasStation: f.gasStation || '—',
            liters: f.liters || 0,
            amount: f.amount || 0,
            invoiceNo: f.invoiceNo || '—',
            vehicleEquipment: d.vehicleEquipment,
          });
        }
      });
    });
    return rows;
  }, [deliveries]);

  // --- Extract unique filter options ---
  const uniqueVehicles = useMemo(() => {
    const list = new Set();
    deliveries.forEach(d => d.vehicleEquipment && list.add(d.vehicleEquipment));
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
  const filteredRows = useMemo(() => {
    return flattenedRows.filter(row => {
      const q = searchQuery.toLowerCase();
      const searchMatch = !q || (
        (row.gasStation || '').toLowerCase().includes(q) ||
        (row.invoiceNo || '').toLowerCase().includes(q) ||
        (row.driver || []).join(' ').toLowerCase().includes(q) ||
        (row.destination || []).join(' ').toLowerCase().includes(q) ||
        (row.jobOrderNo || []).join(' ').toLowerCase().includes(q)
      );

      const vehicleMatch = vehicleFilter === 'all' || row.vehicleEquipment === vehicleFilter;

      let dateMatch = true;
      if (dateFilter && row.dateFrom) {
        const rowDate = new Date(row.dateFrom).toISOString().split('T')[0];
        dateMatch = rowDate === dateFilter;
      } else if (dateFilter) {
        dateMatch = false;
      }

      let monthMatch = true;
      if (monthFilter !== 'all') {
        if (!row.dateFrom) monthMatch = false;
        else {
          const dObj = new Date(row.dateFrom);
          if (!isNaN(dObj.getTime())) {
            const yyyy = dObj.getFullYear();
            const mm = String(dObj.getMonth() + 1).padStart(2, '0');
            monthMatch = `${yyyy}-${mm}` === monthFilter;
          } else monthMatch = false;
        }
      }

      return searchMatch && vehicleMatch && dateMatch && monthMatch;
    });
  }, [flattenedRows, searchQuery, vehicleFilter, dateFilter, monthFilter]);

  const getVehicleDisplay = (plateNumber) => {
    const vObj = vehicles.find(x => x.plateNumber === plateNumber);
    return vObj ? `${plateNumber} - ${vObj.model}` : plateNumber || '—';
  };

  const formatDriverInitials = (arr) => {
    if (!arr || !Array.isArray(arr)) return '—';
    const filtered = arr.filter(Boolean);
    if (filtered.length === 0) return '—';
    return filtered.map(name => {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].toUpperCase();
      const lastName = parts.pop();
      const initials = parts.map(p => p[0].toUpperCase()).join('.');
      return `${initials}. ${lastName.toUpperCase()}`;
    }).join(' / ');
  };

  const generateFiltersText = () => {
    const f = [];
    if (searchQuery) f.push(`Search: ${searchQuery}`);
    if (dateFilter) f.push(`Date: ${formatDate(dateFilter)}`);
    if (monthFilter !== 'all') f.push(`Month: ${formatMonthLabel(monthFilter)}`);
    if (vehicleFilter !== 'all') f.push(`Vehicle: ${getVehicleDisplay(vehicleFilter)}`);
    return f.length ? f.join(' | ') : 'None';
  };

  const totals = useMemo(() => {
    let totalLiters = 0, totalAmount = 0;
    filteredRows.forEach(row => {
      totalLiters += Number(row.liters || 0);
      totalAmount += Number(row.amount || 0);
    });
    return { totalLiters, totalAmount };
  }, [filteredRows]);

  const footerTableRef = useRef(null);

  const exportToCSV = () => {
    const rowsToExport = selectedIds.size > 0
      ? flattenedRows.filter(row => selectedIds.has(row._id))
      : filteredRows;

    if (rowsToExport.length === 0) return toast.warning('No data to export');

    const headers = [
      'Date',
      'Driver',
      'Job Order No.',
      'Customer / Supplier',
      'Destination',
      'Gas Station',
      'Liters',
      'Amount',
      'Invoice No.',
      'Vehicle'
    ];

    const data = rowsToExport.map(row => [
      formatDate(row.dateFrom),
      joinArray(row.driver),
      joinArray(row.jobOrderNo),
      joinArray(row.customerSupplier),
      joinArray(row.destination),
      row.gasStation,
      row.liters,
      row.amount,
      row.invoiceNo,
      row.vehicleEquipment || '—'
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `diesel_expenses_${dateStr}.csv`;
    link.click();
    toast.success(`${selectedIds.size > 0 ? 'Selected' : 'Filtered'} report exported successfully`);
  };

  const hasActiveFilters = searchQuery || dateFilter || monthFilter !== 'all' || vehicleFilter !== 'all';

  return (
    <>
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500 print:hidden">
      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center shrink-0">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Diesel Expenses</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Fuel consumption tracking for all completed deliveries</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{selectedIds.size} selected</span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV}
            className="h-8 gap-1.5 text-[10px] uppercase font-bold tracking-wider border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => window.print()} className="h-8 gap-1.5 text-[10px] uppercase font-bold tracking-wider">
            <Printer className="h-3.5 w-3.5" />
            Print Report
          </Button>
        </div>
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

            {/* Date Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${dateFilter ? 'border-primary text-primary' : ''}`}>
                  <Calendar className='h-3.5 w-3.5' />
                  <span className="text-[10px] font-bold tracking-wider uppercase">{dateFilter ? formatDate(dateFilter) : 'Date'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="p-3 space-y-2">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Date</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-8 w-full rounded border border-input bg-background px-2 text-[10px]"
                />
                {dateFilter && (
                  <Button variant="ghost" size="sm" onClick={() => setDateFilter('')} className="w-full h-7 text-[10px]">Clear</Button>
                )}
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

            {/* Vehicle Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${vehicleFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                  <Truck className='h-3.5 w-3.5' />
                  <span className="text-[10px] font-bold tracking-wider uppercase max-w-[140px] truncate">
                    {vehicleFilter === 'all' ? 'Vehicles' : getVehicleDisplay(vehicleFilter)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[220px] max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Vehicle</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem className="text-[10px] uppercase font-bold" checked={vehicleFilter === 'all'} onCheckedChange={() => setVehicleFilter('all')}>ALL VEHICLES</DropdownMenuCheckboxItem>
                {uniqueVehicles.map(v => (
                  <DropdownMenuCheckboxItem key={v} className="text-[10px] uppercase truncate" checked={vehicleFilter === v} onCheckedChange={() => setVehicleFilter(v)}>
                    {getVehicleDisplay(v)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 gap-1.5 text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider font-bold">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-card min-w-0 min-h-0 relative">
          {isLoading ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loading diesel data...</span>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
              <ClipboardList className="h-8 w-8 text-muted-foreground/50 mb-1" />
              <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No records found</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Adjust filters or add deliveries with fuel entries.</p>
            </div>
          ) : (
            <table className="w-full min-w-[900px] border-collapse relative">
              <thead className="sticky top-0 z-10 bg-orange-500 backdrop-blur shadow-sm">
                <tr className="border-b border-orange-600/20">
                  <th className="w-[40px] px-3 py-2.5 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 accent-white cursor-pointer"
                    />
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Date</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Driver</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Job Order No.</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Customer / Supplier</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Destination</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Gas Station</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Liters</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Amount</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr
                    key={row._id}
                    onClick={() => toggleSelect(row._id)}
                    className={`cursor-pointer border-b border-border/50 hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-card/30' : ''} ${selectedIds.has(row._id) ? 'bg-primary/5' : ''}`}
                  >
                    <td className="w-[40px] px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        readOnly
                        checked={selectedIds.has(row._id)}
                        className="h-3.5 w-3.5 accent-primary cursor-pointer pointer-events-none"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight">{formatDate(row.dateFrom)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{joinArray(row.driver)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight text-center">{joinArray(row.jobOrderNo)}</td>
                    <td className="px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight max-w-[200px] truncate" title={joinArray(row.customerSupplier)}>{joinArray(row.customerSupplier)}</td>
                    <td className="px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight max-w-[200px] truncate" title={joinArray(row.destination)}>{joinArray(row.destination)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-foreground uppercase tracking-tight">{row.gasStation}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-muted-foreground text-right tracking-tight">{row.liters.toLocaleString()}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary text-right">
                      ₱ {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{row.invoiceNo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Separated True Footer - Absolutely at bottom of card */}
        {!isLoading && filteredRows.length > 0 && (
          <div className="shrink-0 overflow-x-hidden border-t-2 border-border bg-card shadow-[0_-4px_10px_rgba(0,0,0,0.05)] relative z-20"
            onScroll={(e) => {
              const tableContainer = e.target.previousElementSibling;
              if (tableContainer) tableContainer.scrollLeft = e.target.scrollLeft;
            }}
            ref={(el) => {
              if (el) {
                const tableContainer = el.previousElementSibling;
                if (tableContainer && !tableContainer._footerScrollLinked) {
                  tableContainer._footerScrollLinked = true;
                  tableContainer.addEventListener('scroll', () => {
                    el.scrollLeft = tableContainer.scrollLeft;
                  });
                }
              }
            }}
          >
            <table ref={footerTableRef} className="w-full min-w-[900px] border-collapse bg-card hidden sm:table">
              <tbody>
                <tr>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[9px] w-[40px] bg-card border-t border-border"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border">
                    Total ({filteredRows.length} {filteredRows.length === 1 ? 'record' : 'records'})
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center align-middle bg-card border-t border-border"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold text-foreground text-right align-middle tracking-tight bg-card border-t border-border"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[10px] font-black text-primary text-right align-middle bg-muted/30 border-t border-border tracking-wider">
                    ₱ {totals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-left align-middle bg-card border-t border-border"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {/* ====== PRINT UI ====== */}
    <style>{`
      @media print {
        @page { size: landscape; margin: 10mm; }
      }
    `}</style>
    <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:text-black print:z-[99999] font-sans">
      <div className="text-center mb-4">
        <div className="text-[14pt] font-bold tracking-tight">ENERTECH SYSTEM INDUSTRIES, INC</div>
        <div className="text-[11pt]">LOGISTIC DEPARTMENT</div>
        <div className="text-[11pt] font-medium tracking-wide mt-1">DIESEL EXPENSES REPORT</div>
      </div>

      <div className="flex justify-between items-end mb-1 text-[8pt]">
        <div className="font-medium">Filters: {generateFiltersText()}</div>
        <div className="font-medium">Date Generated: {(new Date().getMonth() + 1).toString().padStart(2, '0')}-{(new Date().getDate()).toString().padStart(2, '0')}-{new Date().getFullYear()}</div>
      </div>

      <table className="w-full border-collapse border border-black text-[7pt] leading-tight" style={{ tableLayout: 'auto' }}>
        <thead className="bg-[#f2f2f2]">
          <tr>
            <th className="border border-black px-1 py-1 font-bold whitespace-nowrap align-middle">DATE</th>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">DRIVER</th>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">JOB ORDER NO.</th>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">CUSTOMER / SUPPLIER</th>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">DESTINATION</th>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">VEHICLE</th>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">GAS STATION</th>
            <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">LITERS</th>
            <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">AMOUNT</th>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">INVOICE NO.</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map(row => (
            <tr key={row._id} className="break-inside-avoid">
              <td className="border border-black px-1 py-1 align-top whitespace-nowrap">{formatDate(row.dateFrom).toUpperCase()}</td>
              <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap font-medium text-center">{formatDriverInitials(row.driver)}</td>
              <td className="border border-black px-1 py-1 align-top text-center">{joinArray(row.jobOrderNo)}</td>
              <td className="border border-black px-1 py-1 align-top uppercase">{joinArray(row.customerSupplier)}</td>
              <td className="border border-black px-1 py-1 align-top uppercase">{joinArray(row.destination)}</td>
              <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap font-bold text-center">{row.vehicleEquipment || '—'}</td>
              <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap">{row.gasStation}</td>
              <td className="border border-black px-1 py-1 align-top text-right whitespace-nowrap">{row.liters.toLocaleString()}</td>
              <td className="border border-black px-1 py-1 align-top text-right font-bold whitespace-nowrap">{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap">{row.invoiceNo}</td>
            </tr>
          ))}
          {/* Total Row */}
          <tr className="bg-[#f2f2f2] break-inside-avoid">
            <td className="border border-black px-1 py-1 font-bold bg-white text-right" colSpan={7}>TOTAL</td>
            <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap"></td>
            <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{totals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td className="border border-black px-1 py-1 font-bold bg-white"></td>
          </tr>
        </tbody>
      </table>
    </div>

    </>
  );
}
