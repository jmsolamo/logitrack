import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAppToast } from '../../../../components/ui/alert-toast-provider';
import {
  ClipboardList,
  Search,
  Loader2,
  RotateCcw,
  MapPin
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

  // --- Extract filter options ---
  const uniqueDestinations = useMemo(() => {
    const list = new Set();
    deliveries.forEach(d => (d.destination || []).forEach(dest => dest && list.add(dest)));
    return Array.from(list).sort();
  }, [deliveries]);

  // --- Flatten deliveries into individual job order rows ---
  const flattenedRows = useMemo(() => {
    const rows = [];
    deliveries.forEach(d => {
      const jobs = d.jobOrderNo || [];
      const dests = d.destination || [];
      const purposes = d.purpose || [];
      const maxLen = Math.max(jobs.length, dests.length, 1);

      for (let i = 0; i < maxLen; i++) {
        rows.push({
          _id: `${d._id}-${i}`,
          deliveryId: d._id,
          index: i,
          jobOrderNo: jobs[i] || '—',
          destination: dests[i] || '—',
          purpose: purposes[i] || '—',
          dateFrom: d.dateFrom,
          dateTo: d.dateTo,
          driver: d.driver,
          helper: d.helper,
          vehicleEquipment: d.vehicleEquipment,
          totalExpenses: d.totalExpenses,
          deliveryCharge: getDeliveryChargeForDest(d, dests[i]),
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
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center shrink-0">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Job Orders</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Job order summary for all completed deliveries</p>
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
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-card/30' : ''} ${selectedIds.has(row._id) ? 'bg-primary/5' : ''}`}
                  >
                    <td className="w-[40px] px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row._id)}
                        onChange={() => toggleSelect(row._id)}
                        className="h-3.5 w-3.5 accent-primary cursor-pointer"
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
      </div>
    </div>
  );
}
