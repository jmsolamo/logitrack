import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAppToast } from '../../../../components/ui/alert-toast-provider';
import {
  ClipboardList,
  Search,
  Loader2,
  RotateCcw,
  Calendar,
  Columns,
  MapPin,
  User,
  Truck,
  CalendarDays,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Minus,
  X,
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
import { cn } from '../../../../lib/utils';

const tableColumns = [
  { key: 'referenceNo', label: 'Reference No.', category: 'base' },
  { key: 'date', label: 'Date', category: 'base' },
  { key: 'driver', label: 'Driver', category: 'base' },
  { key: 'vehicle', label: 'Vehicle', category: 'base' },
  { key: 'destination', label: 'Destination', category: 'base' },
  { key: 'jobOrderNo', label: 'Job Order No.', category: 'base' },
  { key: 'totalExpenses', label: 'Total Expenses', category: 'base' },
  { key: 'fuelLiters', label: 'Liters (Fuel)', category: 'fuel' },
  { key: 'fuelAmount', label: 'Amount (Fuel)', category: 'fuel' },
  { key: 'tollFee', label: 'Toll Fee', category: 'expenses' },
  { key: 'pierExpenses', label: 'Pier Expenses', category: 'expenses' },
  { key: 'rmDetails', label: 'Repair & Maintenance', category: 'rm' },
  { key: 'rmAmount', label: 'Amount (R&M)', category: 'rm' },
  { key: 'meals', label: 'Meals', category: 'expenses' },
  { key: 'load', label: 'Load', category: 'expenses' },
  { key: 'contingencyDetails', label: 'Contingency', category: 'contingency' },
  { key: 'contingencyAmount', label: 'Amount (Contingency)', category: 'contingency' },
];
const allColumnKeys = tableColumns.map(c => c.key);

export default function ActualExpenses() {
  const [deliveries, setDeliveries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [deliveryCharges, setDeliveryCharges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  const [driverFilter, setDriverFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  // Visibility
  const [visibleColumns, setVisibleColumns] = useState(new Set(allColumnKeys));

  // Details & Edit Modal State
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, delivery: null });
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditSubmitLoading, setIsEditSubmitLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', description: '', actionType: '', item: null, isLoading: false });
  const [formData, setFormData] = useState({
    fuel: [], tollFee: [], pierExpenses: [], repairAndMaintenance: [],
    mealExpenses: [], loadExpenses: [], contingency: []
  });

  const toast = useAppToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deliveriesRes, vehiclesRes, chargesRes] = await Promise.all([
        axios.get('/api/deliveries'),
        axios.get('/api/vehicles'),
        axios.get('/api/delivery-charges')
      ]);
      setVehicles(vehiclesRes.data);
      setDeliveryCharges(chargesRes.data);
      // Filter by Completed status and sort by latest first based on createdAt
      const completedDeliveries = deliveriesRes.data.filter(d => d.status === 'Completed');
      const sorted = completedDeliveries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDeliveries(sorted);
    } catch (error) {
      console.error('Error fetching actual expenses:', error);
      toast.error('Failed to load expenses data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setDateFromFilter('');
    setDateToFilter('');
    setDriverFilter('all');
    setVehicleFilter('all');
    setDestinationFilter('all');
    setMonthFilter('all');
    setVisibleColumns(new Set(allColumnKeys));
    toast.success('Filters cleared');
  };

  const openDetailsModal = (delivery) => {
    setIsEditingDetails(false);
    setDetailsModal({ isOpen: true, delivery });
  };

  const closeDetailsModal = () => {
    setDetailsModal({ isOpen: false, delivery: null });
  };

  const openEditMode = (delivery) => {
    // Get the latest delivery data from state
    const latestDelivery = deliveries.find(d => d._id === delivery._id) || delivery;

    // Helper to format date for input field
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    // Process arrays to ensure dates are properly formatted for input fields
    const processArray = (arr) => {
      if (!arr || !Array.isArray(arr)) return [];
      return arr.map(item => ({
        ...item,
        date: item.date ? formatDateForInput(item.date) : ''
      }));
    };

    setFormData({
      fuel: processArray(latestDelivery.fuel),
      tollFee: processArray(latestDelivery.tollFee),
      pierExpenses: processArray(latestDelivery.pierExpenses),
      repairAndMaintenance: processArray(latestDelivery.repairAndMaintenance),
      mealExpenses: processArray(latestDelivery.mealExpenses),
      loadExpenses: processArray(latestDelivery.loadExpenses),
      contingency: processArray(latestDelivery.contingency)
    });
    setIsEditingDetails(true);
    setDetailsModal({ isOpen: true, delivery: latestDelivery });
  };

  const handleExpenseChange = (category, index, field, value) => {
    setFormData(prev => {
      const arr = [...prev[category]];
      let finalValue = value;
      if (value === '') {
        finalValue = field === 'date' ? null : '';
      } else if (['amount', 'amt', 'liters'].includes(field)) {
        finalValue = Number(value);
      } else if (field === 'date') {
        finalValue = value;
      } else {
        finalValue = String(value).toUpperCase();
      }

      arr[index] = {
        ...arr[index],
        [field]: finalValue
      };
      return { ...prev, [category]: arr };
    });
  };

  const addExpenseItem = (category, defaultItem = { amt: 0 }) => {
    setFormData(prev => ({ ...prev, [category]: [...prev[category], defaultItem] }));
  };

  const removeExpenseItem = (category, index) => {
    setFormData(prev => ({ ...prev, [category]: prev[category].filter((_, i) => i !== index) }));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setConfirmDialog({
      isOpen: true,
      title: 'SAVE EXPENSES',
      description: `Are you sure you want to save these expenses for delivery ${detailsModal.delivery.referenceNo}?`,
      actionType: 'edit',
      item: detailsModal.delivery,
      isLoading: false
    });
  };

  const confirmEdit = async () => {
    const delivery = confirmDialog.item;
    setConfirmDialog(prev => ({ ...prev, isLoading: true }));
    setIsEditSubmitLoading(true);

    try {
      // Strip empty/falsy date values so Mongoose doesn't fail casting '' to Date
      const cleanItems = (arr) => (arr || []).map(item => {
        const cleaned = { ...item };
        // Remove frontend-generated id field that conflicts with MongoDB
        if (cleaned.id) delete cleaned.id;
        // Only remove date if it's empty/null/undefined, keep valid date strings
        if (cleaned.date === null || cleaned.date === undefined || cleaned.date === '') {
          delete cleaned.date;
        }
        return cleaned;
      });

      const payload = {
        fuel: cleanItems(formData.fuel),
        tollFee: cleanItems(formData.tollFee),
        pierExpenses: cleanItems(formData.pierExpenses),
        repairAndMaintenance: cleanItems(formData.repairAndMaintenance),
        mealExpenses: cleanItems(formData.mealExpenses),
        loadExpenses: cleanItems(formData.loadExpenses),
        contingency: cleanItems(formData.contingency)
      };

      await axios.put(`/api/deliveries/${delivery._id}`, payload);
      toast.success('Expenses updated successfully');

      const response = await axios.get('/api/deliveries');
      setDeliveries(response.data.filter(d => d.status === 'Completed').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

      const updatedDelivery = response.data.find(d => d._id === delivery._id);
      if (updatedDelivery) {
        setDetailsModal(prev => ({ ...prev, delivery: updatedDelivery }));
      }
      setIsEditingDetails(false);
      setConfirmDialog({ isOpen: false, title: '', description: '', actionType: '', item: null, isLoading: false });
    } catch (error) {
      console.error('Error updating expenses:', error);
      toast.error(error.response?.data?.message || 'Failed to update expenses');
    } finally {
      setIsEditSubmitLoading(false);
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  // --- Extract Options From Data ---
  const uniqueDrivers = useMemo(() => {
    const list = new Set();
    deliveries.forEach(d => (d.driver || []).forEach(drv => drv && list.add(drv)));
    return Array.from(list).sort();
  }, [deliveries]);

  const uniqueVehicles = useMemo(() => {
    const list = new Set();
    deliveries.forEach(d => d.vehicleEquipment && list.add(d.vehicleEquipment));
    return Array.from(list).sort();
  }, [deliveries]);

  const uniqueDestinations = useMemo(() => {
    const list = new Set();
    deliveries.forEach(d => (d.destination || []).forEach(dest => dest && list.add(dest)));
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

  // --- Helpers ---
  const sumField = (arr, key) => (arr || []).reduce((sum, item) => sum + (item?.[key] || 0), 0);
  const sumNumberArray = (arr) => {
    if (Array.isArray(arr)) return arr.reduce((sum, val) => sum + (val || 0), 0);
    return Number(arr || 0);
  };

  const getResolvedDeliveryCharge = (delivery) => {
    const stored = sumNumberArray(delivery.deliveryCharge);
    if (stored > 0) return stored;

    // Fallback lookup
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

  const getDeliveryChargeBreakdown = (delivery) => {
    if (!delivery.vehicleEquipment || !delivery.destination || !delivery.destination.length) return [];

    const plate = String(delivery.vehicleEquipment).toUpperCase();
    const breakdown = [];

    delivery.destination.forEach(dest => {
      const match = deliveryCharges.find(c =>
        String(c.plateNumber).toUpperCase() === plate &&
        String(c.destination).toUpperCase() === String(dest).toUpperCase()
      );
      if (match) {
        breakdown.push({ destination: dest, charge: match.charge });
      } else {
        breakdown.push({ destination: dest, charge: 0 });
      }
    });

    return breakdown;
  };

  const joinArray = (arr) => {
    if (!arr || !Array.isArray(arr)) return '—';
    const filtered = arr.filter(Boolean);
    return filtered.length > 0 ? filtered.join(' / ') : '—';
  };

  const joinNames = (arr) => {
    if (!arr || !Array.isArray(arr)) return '—';
    const filtered = arr.filter(Boolean);
    return filtered.length > 0 ? filtered.join(' / ').toUpperCase() : '—';
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

  const joinDetails = (arr) => {
    if (!arr || !Array.isArray(arr)) return '—';
    const details = arr.map(item => item.details).filter(Boolean);
    return details.length > 0 ? details.join(' | ') : '—';
  };

  // --- Filtering ---
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const q = searchQuery.toLowerCase();
      const searchMatch = !q || (
        (d.referenceNo || '').toLowerCase().includes(q) ||
        (d.vehicleEquipment || '').toLowerCase().includes(q) ||
        (d.destination || []).join(' ').toLowerCase().includes(q) ||
        (d.driver || []).join(' ').toLowerCase().includes(q) ||
        (d.jobOrderNo || []).join(' ').toLowerCase().includes(q)
      );

      const dateFromMatch = !dateFromFilter || (d.dateFrom && new Date(d.dateFrom) >= new Date(dateFromFilter));
      const dateToMatch = !dateToFilter || (d.dateFrom && new Date(d.dateFrom) <= new Date(dateToFilter));

      const driverMatch = driverFilter === 'all' || (d.driver || []).includes(driverFilter);
      const vehicleMatch = vehicleFilter === 'all' || d.vehicleEquipment === vehicleFilter;
      const destMatch = destinationFilter === 'all' || (d.destination || []).includes(destinationFilter);

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

      return searchMatch && dateFromMatch && dateToMatch && driverMatch && vehicleMatch && destMatch && monthMatch;
    });
  }, [deliveries, searchQuery, dateFromFilter, dateToFilter, driverFilter, vehicleFilter, destinationFilter, monthFilter]);

  const generateFiltersText = () => {
    const f = [];
    if (searchQuery) f.push(`Search: ${searchQuery}`);
    if (dateFromFilter || dateToFilter) f.push(`Date: ${dateFromFilter} to ${dateToFilter}`);
    if (monthFilter !== 'all') f.push(`Month: ${formatMonthLabel(monthFilter)}`);
    if (vehicleFilter !== 'all') f.push(`Vehicle: ${getVehicleDisplay(vehicleFilter)}`);
    if (driverFilter !== 'all') f.push(`Driver: ${driverFilter}`);
    if (destinationFilter !== 'all') f.push(`Destination: ${destinationFilter}`);
    return f.length ? f.join(' | ') : 'None';
  };

  const getVehicleDisplay = (v) => {
    if (!v) return '—';
    const vObj = vehicles.find(x => x.plateNumber === v);
    return vObj ? `${v} - ${vObj.model}` : v;
  };

  const totals = useMemo(() => {
    let tExp = 0, fLit = 0, fAmt = 0, toll = 0, pier = 0, rmAmt = 0, meal = 0, load = 0, contAmt = 0;
    filteredDeliveries.forEach(item => {
      tExp += Number(item.totalExpenses || 0);
      fLit += Number(sumField(item.fuel, 'liters') || 0);
      fAmt += Number(sumField(item.fuel, 'amount') || 0);
      toll += Number(sumField(item.tollFee, 'amt') || 0);
      pier += Number(sumField(item.pierExpenses, 'amt') || 0);
      rmAmt += Number(sumField(item.repairAndMaintenance, 'amt') || 0);
      meal += Number(sumField(item.mealExpenses, 'amt') || 0);
      load += Number(sumField(item.loadExpenses, 'amt') || 0);
      contAmt += Number(sumField(item.contingency, 'amt') || 0);
    });
    return { tExp, fLit, fAmt, toll, pier, rmAmt, meal, load, contAmt };
  }, [filteredDeliveries]);

  return (
    <>
      <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500 print:hidden">

        {/* Header */}
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center shrink-0">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Actual Expenses</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Financial breakdown and expense tracking for all deliveries</p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => window.print()} className="h-8 gap-1.5 text-[10px] uppercase font-bold tracking-wider">
              <Printer className="h-3.5 w-3.5" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Unified Table & Filters Card */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 rounded-lg border border-border bg-card shadow-sm overflow-hidden">

          {/* Search & Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center border-b border-border p-4 bg-muted/20 shrink-0">
            <div className="flex flex-1 gap-2 flex-wrap items-center">

              <div className="relative w-[200px] shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs bg-background pl-8"
                />
              </div>

              {/* Column Visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 bg-background shrink-0">
                    <Columns className='h-3.5 w-3.5' />
                    <span className="text-[10px]">Columns</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px] max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Toggle Columns ({visibleColumns.size}/{allColumnKeys.length})</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {tableColumns.map(col => (
                    <DropdownMenuCheckboxItem
                      key={col.key}
                      className="text-[10px] uppercase"
                      checked={visibleColumns.has(col.key)}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(visibleColumns);
                        if (checked) newSet.add(col.key);
                        else newSet.delete(col.key);
                        setVisibleColumns(newSet);
                      }}
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
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

              {/* Vehicle Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${vehicleFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                    <Truck className='h-3.5 w-3.5' />
                    <span className="text-[10px] font-bold tracking-wider uppercase max-w-[140px] truncate">
                      {vehicleFilter === 'all' ? 'Vehicles' : (() => {
                        const vObj = vehicles.find(x => x.plateNumber === vehicleFilter);
                        return vObj ? `${vehicleFilter} - ${vObj.model}` : vehicleFilter;
                      })()}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[220px] max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Vehicle</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem className="text-[10px] uppercase font-bold" checked={vehicleFilter === 'all'} onCheckedChange={() => setVehicleFilter('all')}>ALL VEHICLES</DropdownMenuCheckboxItem>
                  {uniqueVehicles.map(v => {
                    const vObj = vehicles.find(x => x.plateNumber === v);
                    const displayLabel = vObj ? `${v} - ${vObj.model}` : v;
                    return (
                      <DropdownMenuCheckboxItem key={v} className="text-[10px] uppercase truncate" checked={vehicleFilter === v} onCheckedChange={() => setVehicleFilter(v)}>
                        {displayLabel}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

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

              {/* Date Range Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 bg-background shrink-0">
                    <Calendar className='h-3.5 w-3.5' />
                    <span className="text-[10px]">Date Range</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="p-3 space-y-2">
                  <DropdownMenuLabel className="text-[10px]">Filter by Delivery Date</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground">From</label>
                    <input
                      type="date"
                      value={dateFromFilter}
                      onChange={(e) => setDateFromFilter(e.target.value)}
                      className="h-8 w-full rounded border border-input bg-background px-2 text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground">To</label>
                    <input
                      type="date"
                      value={dateToFilter}
                      onChange={(e) => setDateToFilter(e.target.value)}
                      className="h-8 w-full rounded border border-input bg-background px-2 text-[10px]"
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {(searchQuery || dateFromFilter || dateToFilter || driverFilter !== 'all' || vehicleFilter !== 'all' || destinationFilter !== 'all' || monthFilter !== 'all' || visibleColumns.size !== allColumnKeys.length) && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 gap-1.5 text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider font-bold">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-auto bg-card min-w-0 min-h-0 relative">
            {isLoading ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loading expenses...</span>
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
                <ClipboardList className="h-8 w-8 text-muted-foreground/50 mb-1" />
                <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No records found</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Adjust filters or add deliveries with expenses.</p>
              </div>
            ) : (
              <table className="w-full min-w-[max-content] border-collapse relative">
                <thead className="sticky top-0 z-10 bg-orange-500 backdrop-blur shadow-sm">
                  <tr className="border-b border-orange-600/20">
                    {visibleColumns.has('referenceNo') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Reference No.</th>}
                    {visibleColumns.has('date') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Date</th>}
                    {visibleColumns.has('driver') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Driver</th>}
                    {visibleColumns.has('vehicle') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Vehicle</th>}
                    {visibleColumns.has('destination') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Destination</th>}
                    {visibleColumns.has('jobOrderNo') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle">Job Order No.</th>}
                    {visibleColumns.has('totalExpenses') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle bg-orange-600/40">Total Expenses</th>}

                    {visibleColumns.has('fuelLiters') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Liters</th>}
                    {visibleColumns.has('fuelAmount') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Amount</th>}

                    {visibleColumns.has('tollFee') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Toll Fee</th>}
                    {visibleColumns.has('pierExpenses') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Pier Expenses</th>}

                    {visibleColumns.has('rmDetails') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Repair & Maintenance</th>}
                    {visibleColumns.has('rmAmount') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Amount</th>}

                    {visibleColumns.has('meals') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Meals</th>}
                    {visibleColumns.has('load') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Load</th>}

                    {visibleColumns.has('contingencyDetails') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Contingency</th>}
                    {visibleColumns.has('contingencyAmount') && <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Amount</th>}
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle sticky right-0 bg-orange-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map((item, index) => (
                    <tr
                      key={item._id}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-card/30' : ''}`}
                      onClick={() => openDetailsModal(item)}
                    >
                      {visibleColumns.has('referenceNo') && <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-tight">{item.referenceNo}</td>}
                      {visibleColumns.has('date') && (
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight">
                          {item.dateFrom && item.dateTo ? `${formatDate(item.dateFrom)} - ${formatDate(item.dateTo)}` : formatDate(item.dateFrom)}
                        </td>
                      )}
                      {visibleColumns.has('driver') && <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{joinNames(item.driver)}</td>}
                      {visibleColumns.has('vehicle') && (
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight">
                          {(() => {
                            const v = item.vehicleEquipment;
                            const vObj = vehicles.find(x => x.plateNumber === v);
                            return vObj ? `${v} - ${vObj.model}` : v || '—';
                          })()}
                        </td>
                      )}
                      {visibleColumns.has('destination') && (
                        <td className="px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight max-w-[200px] truncate" title={joinArray(item.customerSupplier)}>
                          {joinArray(item.customerSupplier)}
                        </td>
                      )}
                      {visibleColumns.has('jobOrderNo') && <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight text-center">{joinArray(item.jobOrderNo)}</td>}
                      {visibleColumns.has('totalExpenses') && (
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-wider text-right bg-muted/10">
                          ₱ {Number(item.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      )}

                      {visibleColumns.has('fuelLiters') && (
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-muted-foreground text-right tracking-tight">
                          {sumField(item.fuel, 'liters').toLocaleString()}
                        </td>
                      )}
                      {visibleColumns.has('fuelAmount') && (
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">
                          {sumField(item.fuel, 'amount').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {visibleColumns.has('tollFee') && (
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">
                          {sumField(item.tollFee, 'amt').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      {visibleColumns.has('pierExpenses') && (
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">
                          {sumField(item.pierExpenses, 'amt').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {visibleColumns.has('rmDetails') && (
                        <td className="px-3 py-2 text-[10px] font-medium text-foreground max-w-[250px] truncate" title={joinDetails(item.repairAndMaintenance)}>
                          {joinDetails(item.repairAndMaintenance)}
                        </td>
                      )}
                      {visibleColumns.has('rmAmount') && (
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">
                          {sumField(item.repairAndMaintenance, 'amt').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {visibleColumns.has('meals') && (
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">
                          {sumField(item.mealExpenses, 'amt').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      {visibleColumns.has('load') && (
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">
                          {sumField(item.loadExpenses, 'amt').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {visibleColumns.has('contingencyDetails') && (
                        <td className="px-3 py-2 text-[10px] font-medium text-foreground max-w-[250px] truncate" title={joinDetails(item.contingency)}>
                          {joinDetails(item.contingency)}
                        </td>
                      )}
                      {visibleColumns.has('contingencyAmount') && (
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground text-right">
                          {sumField(item.contingency, 'amt').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      <td className="whitespace-nowrap px-3 py-1.5 text-center sticky right-0 bg-card border-l border-border/30" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditMode(item)}
                            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Edit Expenses"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Details / Edit Modal */}
        {detailsModal.isOpen && detailsModal.delivery && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300 print:hidden">
            <div className="w-full max-w-[700px] max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">

              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-card border-b border-border p-5 pb-3.5 rounded-t-xl shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                      <Eye className="h-3 w-3" />
                    </div>
                    <h2 className="text-[12px] font-bold text-foreground uppercase tracking-tight">
                      EXPENSE DETAILS: {detailsModal.delivery.referenceNo}
                    </h2>
                  </div>
                  {isEditingDetails ? (
                    <button onClick={() => setIsEditingDetails(false)} className="rounded-full flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-destructive transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditMode(detailsModal.delivery)} className="rounded-full flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={closeDetailsModal} className="rounded-full flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-header */}
              <div className="bg-muted/30 px-5 py-4 border-b border-border/50 shrink-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">REFERENCE NO.</p>
                    <p className="text-[11px] font-bold text-foreground uppercase">{String(detailsModal.delivery.referenceNo).toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">DATE</p>
                    <p className="text-[11px] font-bold text-foreground uppercase">
                      {(detailsModal.delivery.dateFrom && detailsModal.delivery.dateTo
                        ? `${formatDate(detailsModal.delivery.dateFrom)} - ${formatDate(detailsModal.delivery.dateTo)}`
                        : formatDate(detailsModal.delivery.dateFrom)).toUpperCase()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">DRIVER</p>
                    <p className="text-[11px] font-bold text-foreground uppercase">
                      {joinNames(detailsModal.delivery.driver).toUpperCase()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">VEHICLE</p>
                    <p className="text-[11px] font-bold text-foreground uppercase">
                      {(() => {
                        const v = detailsModal.delivery.vehicleEquipment;
                        const vObj = vehicles.find(x => x.plateNumber === v);
                        return (vObj ? `${v} - ${vObj.model}` : v || '—').toUpperCase();
                      })()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">DESTINATION</p>
                    <p className="text-[11px] font-bold text-foreground uppercase line-clamp-1" title={joinArray(detailsModal.delivery.customerSupplier)}>
                      {joinArray(detailsModal.delivery.customerSupplier).toUpperCase()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">JOB ORDER NO.</p>
                    <p className="text-[11px] font-bold text-foreground uppercase line-clamp-1" title={joinArray(detailsModal.delivery.jobOrderNo)}>
                      {joinArray(detailsModal.delivery.jobOrderNo).toUpperCase()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">DELIVERY CHARGE</p>
                    <p className="text-[11px] font-bold text-orange-600 uppercase">
                      {(() => {
                        const breakdown = getDeliveryChargeBreakdown(detailsModal.delivery);
                        if (breakdown.length <= 1) {
                          return `₱ ${getResolvedDeliveryCharge(detailsModal.delivery).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                        }
                        return (
                          <>
                            {breakdown.map((b, i) => (
                              <span key={i}>
                                ₱ {b.charge.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                {i < breakdown.length - 1 ? ' / ' : ''}
                              </span>
                            ))}
                          </>
                        );
                      })()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">TOTAL EXPENSES</p>
                    <p className="text-[11px] font-bold text-orange-600 uppercase">
                      ₱ {Number(detailsModal.delivery.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-5 relative">
                {isEditingDetails ? (
                  <form id="expense-edit-form" onSubmit={handleEditSubmit} className="space-y-6">
                    {/* Fuel Editing */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fuel Expenses</label>
                        <Button type="button" variant="outline" size="sm" onClick={() => addExpenseItem('fuel', { amount: 0, liters: 0, gasStation: '', invoiceNo: '', date: '' })} className="h-6 text-[9px] px-2 uppercase my-0 py-0"><Plus className="h-3 w-3 mr-1" />Add</Button>
                      </div>
                      {formData.fuel.map((f, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-2 border border-border/50 bg-muted/20 p-2 rounded-lg">
                          <div className="w-[100px] space-y-1"><Input type="date" value={f.date || ''} onChange={(e) => handleExpenseChange('fuel', idx, 'date', e.target.value)} className="h-7 text-[10px] bg-background px-1" /></div>
                          <div className="flex-1 min-w-[100px] space-y-1"><Input placeholder="Gas Station" value={f.gasStation || ''} onChange={(e) => handleExpenseChange('fuel', idx, 'gasStation', e.target.value)} className="h-7 text-[10px] bg-background" /></div>
                          <div className="w-[70px] space-y-1"><Input type="number" placeholder="Liters" value={f.liters || ''} onChange={(e) => handleExpenseChange('fuel', idx, 'liters', e.target.value)} className="h-7 text-[10px] bg-background px-1" /></div>
                          <div className="w-[80px] space-y-1"><Input type="number" placeholder="Amount (₱)" value={f.amount || ''} onChange={(e) => handleExpenseChange('fuel', idx, 'amount', e.target.value)} className="h-7 text-[10px] bg-background px-1" /></div>
                          <div className="flex-1 min-w-[90px] space-y-1"><Input placeholder="Invoice No." value={f.invoiceNo || ''} onChange={(e) => handleExpenseChange('fuel', idx, 'invoiceNo', e.target.value)} className="h-7 text-[10px] bg-background" /></div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeExpenseItem('fuel', idx)} className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Minus className="h-3 w-3" /></Button>
                        </div>
                      ))}
                    </div>

                    {/* Component Details */}
                    {[
                      { key: 'tollFee', label: 'Toll Fee' },
                      { key: 'pierExpenses', label: 'Pier Expenses' },
                      { key: 'repairAndMaintenance', label: 'Repair & Maintenance' },
                      { key: 'mealExpenses', label: 'Meal Expenses' },
                      { key: 'loadExpenses', label: 'Load Expenses' },
                      { key: 'contingency', label: 'Contingency' }
                    ].map(cat => (
                      <div key={cat.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{cat.label}</label>
                          <Button type="button" variant="outline" size="sm" onClick={() => addExpenseItem(cat.key, { details: '', amt: 0, date: '' })} className="h-6 text-[9px] px-2 uppercase my-0 py-0"><Plus className="h-3 w-3 mr-1" />Add</Button>
                        </div>
                        {formData[cat.key].map((item, idx) => (
                          <div key={idx} className="flex flex-wrap items-center gap-2 border border-border/50 bg-muted/20 p-2 rounded-lg">
                            <div className="w-[100px] space-y-1">
                              <Input type="date" value={item.date || ''} onChange={(e) => handleExpenseChange(cat.key, idx, 'date', e.target.value)} className="h-7 text-[10px] bg-background px-1" />
                            </div>
                            <div className="flex-1 min-w-[180px] space-y-1">
                              <Input placeholder="Description details..." value={item.details || ''} onChange={(e) => handleExpenseChange(cat.key, idx, 'details', e.target.value)} className="h-7 text-[10px] bg-background" />
                            </div>
                            <div className="w-[90px] space-y-1">
                              <Input type="number" placeholder="Amount (₱)" value={item.amt || ''} onChange={(e) => handleExpenseChange(cat.key, idx, 'amt', e.target.value)} className="h-7 text-[10px] bg-background px-1" />
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeExpenseItem(cat.key, idx)} className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Minus className="h-3 w-3" /></Button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </form>
                ) : (
                  <div className="space-y-3">
                    {/* Delivery Charge Card */}
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <p className="text-[9px] text-blue-600/70 uppercase tracking-widest mb-1.5 font-bold">Delivery Charge</p>
                      <p className="text-[14px] font-bold text-blue-600">
                        {(() => {
                          const breakdown = getDeliveryChargeBreakdown(detailsModal.delivery);
                          if (breakdown.length <= 1) {
                            return `₱ ${getResolvedDeliveryCharge(detailsModal.delivery).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                          }
                          return breakdown.map((b, i) => (
                            <span key={i}>
                              ₱ {b.charge.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              {i < breakdown.length - 1 ? ' / ' : ''}
                            </span>
                          ));
                        })()}
                      </p>
                    </div>

                    {/* Total Expenses Card */}
                    <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                      <p className="text-[9px] text-orange-600/70 uppercase tracking-widest mb-1.5 font-bold">Total Expenses</p>
                      <p className="text-[14px] font-bold text-orange-600">
                        ₱ {Number(detailsModal.delivery.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Expense Categories */}
                    {[
                      { label: 'Fuel Expenses', arr: detailsModal.delivery.fuel, isFuel: true, color: 'red' },
                      { label: 'Toll Fee', arr: detailsModal.delivery.tollFee, color: 'yellow' },
                      { label: 'Pier Expenses', arr: detailsModal.delivery.pierExpenses, color: 'purple' },
                      { label: 'Repair & Maintenance', arr: detailsModal.delivery.repairAndMaintenance, color: 'pink' },
                      { label: 'Meals Expenses', arr: detailsModal.delivery.mealExpenses, color: 'green' },
                      { label: 'Load Expenses', arr: detailsModal.delivery.loadExpenses, color: 'cyan' },
                      { label: 'Contingency', arr: detailsModal.delivery.contingency, color: 'amber' }
                    ].map(cat => (
                      <div key={cat.label} className="p-3 rounded-lg bg-card border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">{cat.label}</p>
                          <span className="text-[11px] font-bold text-foreground">₱ {Number(sumField(cat.arr, cat.isFuel ? 'amount' : 'amt')).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        {!cat.arr || cat.arr.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground italic tracking-tight py-1">No records.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {cat.arr.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-start text-[10px] bg-muted/20 p-2.5 rounded border border-border/30">
                                <div className="flex flex-col gap-1 max-w-[70%] text-foreground">
                                  {cat.isFuel ? (
                                    <>
                                      <span className="font-bold uppercase truncate">{item.gasStation || 'N/A Station'}</span>
                                      <span className="text-muted-foreground tracking-tight text-[9px]">Invoice: {item.invoiceNo || '—'}  |  {item.liters} Liters</span>
                                      {item.date && <span className="text-muted-foreground tracking-tight flex items-center gap-1.5 text-[9px]"><Calendar className="h-3 w-3" /> {formatDate(item.date)}</span>}
                                    </>
                                  ) : (
                                    <>
                                      <span className="tracking-tight font-medium break-words leading-tight uppercase">{item.details || 'NO DETAILS PROVIDED'}</span>
                                      {item.date && <span className="text-muted-foreground tracking-tight flex items-center gap-1.5 mt-0.5 text-[9px]"><Calendar className="h-3 w-3" /> {formatDate(item.date)}</span>}
                                    </>
                                  )}
                                </div>
                                <span className="font-bold text-foreground self-end shrink-0">₱ {Number(cat.isFuel ? item.amount : item.amt).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer (only visible when editing) */}
              {isEditingDetails && (
                <div className="sticky bottom-0 z-10 bg-card border-t border-border p-5 pt-3 rounded-b-xl shrink-0">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingDetails(false)} disabled={isEditSubmitLoading} className="h-8 text-[10px] uppercase tracking-wider">Cancel</Button>
                    <Button type="submit" form="expense-edit-form" disabled={isEditSubmitLoading} size="sm" className="min-w-[90px] h-8 text-[10px] uppercase tracking-wider">
                      {isEditSubmitLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'SAVE CHANGES'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-[400px] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold uppercase tracking-tight text-foreground">{confirmDialog.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1">{confirmDialog.description}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" size="sm" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} disabled={confirmDialog.isLoading} className="h-8 text-[10px] uppercase tracking-wider">
                    CANCEL
                  </Button>
                  <Button size="sm" onClick={confirmEdit} disabled={confirmDialog.isLoading} className="min-w-[80px] h-8 text-[10px] uppercase tracking-wider">
                    {confirmDialog.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'CONFIRM'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
          <div className="text-[11pt] font-medium tracking-wide mt-1">ACTUAL EXPENSES REPORT</div>
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
              <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">VEHICLE</th>
              <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">DESTINATION</th>
              <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">JOB ORDER NO.</th>
              <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">TOTAL EXPENSES</th>
              <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">LITERS</th>
              <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">AMOUNT</th>
              <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">TOLL FEE</th>
              <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">PIER EXPENSES</th>
              <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">REPAIR AND MAINTENANCE</th>
              <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">AMOUNT</th>
              <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">MEALS</th>
              <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">LOAD</th>
              <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">CONTINGENGY</th>
              <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.map(item => (
              <tr key={item._id} className="break-inside-avoid">
                <td className="border border-black px-1 py-1 align-top whitespace-nowrap">{(item.dateFrom && item.dateTo ? `${formatDate(item.dateFrom)} - ${formatDate(item.dateTo)}` : formatDate(item.dateFrom)).toUpperCase()}</td>
                <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap font-medium text-center">{formatDriverInitials(item.driver)}</td>
                <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap font-bold text-center">{item.vehicleEquipment || '—'}</td>
                <td className="border border-black px-1 py-1 align-top uppercase">{joinArray(item.customerSupplier)}</td>
                <td className="border border-black px-1 py-1 align-top text-center">{joinArray(item.jobOrderNo)}</td>
                <td className="border border-black px-1 py-1 align-top text-right font-bold whitespace-nowrap">{Number(item.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="border border-black px-1 py-1 align-top text-right whitespace-nowrap">{sumField(item.fuel, 'liters').toLocaleString()}</td>
                <td className="border border-black px-1 py-1 align-top text-right whitespace-nowrap">{sumField(item.fuel, 'amount').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="border border-black px-1 py-1 align-top text-right whitespace-nowrap">{sumField(item.tollFee, 'amt').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="border border-black px-1 py-1 align-top text-right whitespace-nowrap">{sumField(item.pierExpenses, 'amt').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="border border-black px-1 py-1 align-top leading-tight">{joinDetails(item.repairAndMaintenance).toUpperCase()}</td>
                <td className="border border-black px-1 py-1 align-top text-right whitespace-nowrap">{sumField(item.repairAndMaintenance, 'amt').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="border border-black px-1 py-1 align-top text-right whitespace-nowrap">{sumField(item.mealExpenses, 'amt').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="border border-black px-1 py-1 align-top text-right whitespace-nowrap">{sumField(item.loadExpenses, 'amt').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="border border-black px-1 py-1 align-top leading-tight">{joinDetails(item.contingency).toUpperCase()}</td>
                <td className="border border-black px-1 py-1 align-top text-right whitespace-nowrap">{sumField(item.contingency, 'amt').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-[#f2f2f2] break-inside-avoid">
              <td className="border border-black px-1 py-1 font-bold bg-white" colSpan={4}></td>
              <td className="border border-black px-1 py-1 font-bold text-center">TOTAL</td>
              <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{totals.tExp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{totals.fLit.toLocaleString()}</td>
              <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{totals.fAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{totals.toll.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{totals.pier.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="border border-black px-1 py-1 font-bold bg-white"></td>
              <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{totals.rmAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{totals.meal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{totals.load.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="border border-black px-1 py-1 font-bold bg-white"></td>
              <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{totals.contAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </>
  );
}
