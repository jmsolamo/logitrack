import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAppToast } from '../../../../components/ui/alert-toast-provider';
import {
  ClipboardList,
  Search,
  Loader2,
  RotateCcw,
  MapPin,
  Printer
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

export default function JobOrders() {
  const [deliveries, setDeliveries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [deliveryCharges, setDeliveryCharges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('all');

  // Checkboxes
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toast = useAppToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [deliveriesRes, vehiclesRes, chargesRes] = await Promise.all([
        axios.get('/api/deliveries'),
        axios.get('/api/vehicles'),
        axios.get('/api/delivery-charges')
      ]);
      setVehicles(vehiclesRes.data);
      setDeliveryCharges(chargesRes.data);
      const completed = deliveriesRes.data.filter(d => d.status === 'Completed');
      const sorted = completed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDeliveries(sorted);
    } catch (error) {
      console.error('Error fetching job orders:', error);
      toast.error('Failed to load job orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setDestinationFilter('all');
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

  const sumField = (arr, key) => (arr || []).reduce((sum, item) => sum + (item?.[key] || 0), 0);
  const sumNumberArray = (arr) => {
    if (Array.isArray(arr)) return arr.reduce((sum, val) => sum + (val || 0), 0);
    return Number(arr || 0);
  };

  const getResolvedDeliveryCharge = (delivery) => {
    const stored = sumNumberArray(delivery.deliveryCharge);
    if (stored > 0) return stored;
    if (!delivery.vehicleEquipment || !delivery.destination || !delivery.destination.length) return 0;
    const plate = String(delivery.vehicleEquipment).toUpperCase();
    let total = 0;
    delivery.destination.forEach(dest => {
      const match = deliveryCharges.find(c =>
        String(c.plateNumber).toUpperCase() === plate &&
        String(c.destination).toUpperCase() === String(dest).toUpperCase()
      );
      if (match) total += match.charge;
    });
    return total;
  };

  const getDeliveryChargeForDest = (delivery, dest) => {
    if (!delivery.vehicleEquipment || !dest) return 0;
    const plate = String(delivery.vehicleEquipment).toUpperCase();
    const match = deliveryCharges.find(c =>
      String(c.plateNumber).toUpperCase() === plate &&
      String(c.destination).toUpperCase() === String(dest).toUpperCase()
    );
    return match ? match.charge : 0;
  };

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
    if (destinationFilter !== 'all') f.push(`Destination: ${destinationFilter}`);
    return f.length ? f.join(' | ') : 'None';
  };


  // --- Extract filter options ---
  const uniqueDestinations = useMemo(() => {
    const list = new Set();
    deliveries.forEach(d => (d.customerSupplier || []).forEach(dest => dest && list.add(dest)));
    return Array.from(list).sort();
  }, [deliveries]);

  // --- Flatten deliveries into individual job order rows ---
  const flattenedRows = useMemo(() => {
    const rows = [];
    deliveries.forEach(d => {
      const jobs = d.jobOrderNo || [];
      const dests = d.customerSupplier || [];
      const purposes = d.purpose || [];
      const maxLen = Math.max(jobs.length, 1);

      // If there's only one destination, use it for all job orders
      const singleDestination = dests.length === 1 ? dests[0] : null;

      for (let i = 0; i < maxLen; i++) {
        rows.push({
          _id: `${d._id}-${i}`,
          deliveryId: d._id,
          index: i,
          jobOrderNo: jobs[i] || '—',
          destination: singleDestination || dests[i] || '—',
          purpose: purposes[i] || purposes[0] || '—',
          dateFrom: d.dateFrom,
          dateTo: d.dateTo,
          driver: d.driver,
          helper: d.helper,
          vehicleEquipment: d.vehicleEquipment,
          totalExpenses: d.totalExpenses,
          deliveryCharge: getDeliveryChargeForDest(d, singleDestination || dests[i]),
        });
      }
    });
    return rows;
  }, [deliveries, deliveryCharges]);

  // --- Filtering ---
  const filteredRows = useMemo(() => {
    return flattenedRows.filter(row => {
      const q = searchQuery.toLowerCase();
      const searchMatch = !q || (
        (row.jobOrderNo || '').toLowerCase().includes(q) ||
        (row.vehicleEquipment || '').toLowerCase().includes(q) ||
        (row.destination || '').toLowerCase().includes(q) ||
        (row.driver || []).join(' ').toLowerCase().includes(q) ||
        (row.helper || []).join(' ').toLowerCase().includes(q) ||
        (row.purpose || '').toLowerCase().includes(q)
      );

      const destMatch = destinationFilter === 'all' || row.destination === destinationFilter;

      return searchMatch && destMatch;
    });
  }, [flattenedRows, searchQuery, destinationFilter]);

  const totals = useMemo(() => {
    let totalExpenses = 0, totalCharge = 0;
    filteredRows.forEach(row => {
      totalExpenses += Number(row.totalExpenses || 0);
      totalCharge += Number(row.deliveryCharge || 0);
    });
    return { totalExpenses, totalCharge };
  }, [filteredRows]);

  const rowsToPrint = useMemo(() => {
    if (selectedIds.size === 0) return filteredRows;
    const selected = flattenedRows.filter(row => selectedIds.has(row._id));
    return selected.length > 0 ? selected : filteredRows;
  }, [flattenedRows, filteredRows, selectedIds]);

  const printTotals = useMemo(() => {
    let totalExpenses = 0, totalCharge = 0;
    rowsToPrint.forEach(row => {
      totalExpenses += Number(row.totalExpenses || 0);
      totalCharge += Number(row.deliveryCharge || 0);
    });
    return { totalExpenses, totalCharge };
  }, [rowsToPrint]);

  // --- Checkbox logic ---
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map(r => r._id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const isAllSelected = filteredRows.length > 0 && selectedIds.size === filteredRows.length;
  const hasActiveFilters = searchQuery || destinationFilter !== 'all';

  return (
    <>
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500 print:hidden">
      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center shrink-0">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Job Orders</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Job order summary for all completed deliveries</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{selectedIds.size} selected</span>
          )}
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

            {/* Destination Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${destinationFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                  <MapPin className='h-3.5 w-3.5' />
                  <span className="text-[10px] font-bold tracking-wider uppercase max-w-[120px] truncate">{destinationFilter === 'all' ? 'Dest.' : destinationFilter}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px] max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Destination</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem className="text-[10px] uppercase font-bold" checked={destinationFilter === 'all'} onCheckedChange={() => setDestinationFilter('all')}>ALL DESTINATIONS</DropdownMenuCheckboxItem>
                {uniqueDestinations.map(d => (
                  <DropdownMenuCheckboxItem key={d} className="text-[10px] uppercase truncate" checked={destinationFilter === d} onCheckedChange={() => setDestinationFilter(d)}>{d}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 gap-1.5 text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider font-bold">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}

            <div className="ml-auto flex h-8 items-center rounded border border-primary/30 bg-primary/10 px-3 text-[10px] font-bold text-primary uppercase tracking-wider shrink-0">
              {filteredRows.length} Records
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-card min-w-0 min-h-0 relative">
          {isLoading ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loading job orders...</span>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
              <ClipboardList className="h-8 w-8 text-muted-foreground/50 mb-1" />
              <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No records found</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Adjust filters or add deliveries.</p>
            </div>
          ) : (
            <table className="w-full min-w-[1200px] border-collapse relative">
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
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle">Job Order No.</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Date</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Driver</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Helper</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Vehicle</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Destination</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Activity</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle bg-orange-600/40">Total Expenses</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Delivery Charge</th>
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
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-tight text-center">{row.jobOrderNo}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight">
                      {row.dateFrom && row.dateTo ? `${formatDate(row.dateFrom)} - ${formatDate(row.dateTo)}` : formatDate(row.dateFrom)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{joinArray(row.driver)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{joinArray(row.helper)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight">{getVehicleDisplay(row.vehicleEquipment)}</td>
                    <td className="px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight max-w-[200px] truncate" title={row.destination}>{row.destination}</td>
                    <td className="px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight max-w-[180px] truncate" title={row.purpose}>{row.purpose}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary text-right bg-muted/10">
                      ₱ {Number(row.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-foreground text-right">
                      ₱ {row.deliveryCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer - Totals */}
        {filteredRows.length > 0 && (
          <div className="border-t border-border bg-muted/20 shrink-0 overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse" style={{ tableLayout: 'fixed' }}>
              <tbody>
                <tr className="bg-muted/20">
                  <td className="w-[40px] px-3 py-2.5 text-center"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-left"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-left"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-left"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-left"></td>
                  <td className="px-3 py-2.5 text-left"></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-left font-bold uppercase text-[10px] text-foreground tracking-wide">Total:</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold text-primary text-right">
                    ₱ {totals.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold text-foreground text-right">
                    ₱ {totals.totalCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
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
        <div className="text-[11pt] font-medium tracking-wide mt-1">JOB ORDERS REPORT</div>
      </div>

      <div className="flex justify-between items-end mb-1 text-[8pt]">
        <div className="font-medium">Filters: {generateFiltersText()}</div>
        <div className="font-medium">Date Generated: {(new Date().getMonth() + 1).toString().padStart(2, '0')}-{(new Date().getDate()).toString().padStart(2, '0')}-{new Date().getFullYear()}</div>
      </div>

      <table className="w-full border-collapse border border-black text-[7pt] leading-tight" style={{ tableLayout: 'auto' }}>
        <thead className="bg-[#f2f2f2]">
          <tr>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">JOB ORDER NO.</th>
            <th className="border border-black px-1 py-1 font-bold whitespace-nowrap align-middle">DATE</th>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">DRIVER</th>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">HELPER</th>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">VEHICLE</th>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">DESTINATION</th>
            <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">ACTIVITY</th>
            <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">TOTAL EXPENSES</th>
            <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">DELIVERY CHARGE</th>
          </tr>
        </thead>
        <tbody>
          {rowsToPrint.map(row => (
            <tr key={row._id} className="break-inside-avoid">
              <td className="border border-black px-1 py-1 align-top font-bold text-center whitespace-nowrap">{row.jobOrderNo}</td>
              <td className="border border-black px-1 py-1 align-top whitespace-nowrap">{(row.dateFrom && row.dateTo ? `${formatDate(row.dateFrom)} - ${formatDate(row.dateTo)}` : formatDate(row.dateFrom)).toUpperCase()}</td>
              <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap font-medium text-center">{formatDriverInitials(row.driver)}</td>
              <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap font-medium text-center">{formatDriverInitials(row.helper)}</td>
              <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap font-bold text-center">{row.vehicleEquipment || '—'}</td>
              <td className="border border-black px-1 py-1 align-top uppercase">{row.destination}</td>
              <td className="border border-black px-1 py-1 align-top uppercase">{row.purpose}</td>
              <td className="border border-black px-1 py-1 align-top text-right font-bold whitespace-nowrap">{Number(row.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="border border-black px-1 py-1 align-top text-right font-bold whitespace-nowrap">{row.deliveryCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          ))}
          {/* Total Row */}
          <tr className="bg-[#f2f2f2] break-inside-avoid">
            <td className="border border-black px-1 py-1 font-bold bg-white" colSpan={6}></td>
            <td className="border border-black px-1 py-1 font-bold text-center">TOTAL</td>
            <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{printTotals.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{printTotals.totalCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>

    </>
  );
}
