import { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  ClipboardList,
  Plus,
  X,
  ChevronDown,
  Columns,
  ListFilter,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { useAppToast } from '../../../components/ui/alert-toast-provider';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { cn } from '../../../lib/utils';

// Column definitions
const tableColumns = [
  { key: 'referenceNo', label: 'Ref No.' },
  { key: 'status', label: 'Status' },
  { key: 'deliveryType', label: 'Type' },
  { key: 'dateFrom', label: 'Date From' },
  { key: 'dateTo', label: 'Date To' },
  { key: 'duration', label: 'Duration' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'vehicleEquipment', label: 'Vehicle / Equipment' },
  { key: 'destination', label: 'Destination' },
  { key: 'driver', label: 'Driver' },
  { key: 'helper', label: 'Helper' },
  { key: 'jobOrderNo', label: 'Job Order No.' },
  { key: 'customerSupplier', label: 'Customer / Supplier' },
  { key: 'totalBudget', label: 'Total Budget' },
  { key: 'requestedBy', label: 'Requested By' },
];

const allColumnKeys = tableColumns.map(c => c.key);

function DeliveryPlan() {
  const [deliveries, setDeliveries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [personnels, setPersonnels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(new Set(allColumnKeys));

  // Status Modal State
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    delivery: null,
    dateInput: '',
    timeInput: '',
    isLoading: false
  });

  const initialFormData = {
    deliveryType: '',
    dateFrom: '',
    dateTo: '',
    purpose: '',
    vehicleEquipment: '',
    destination: '',
    driver: '',
    helper: '',
    jobOrderNo: '',
    customerSupplier: '',
    totalBudget: '',
    requestedBy: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const toast = useAppToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deliveriesRes, vehiclesRes, destinationsRes, personnelsRes] = await Promise.all([
        axios.get('/api/deliveries'),
        axios.get('/api/vehicles'),
        axios.get('/api/destinations'),
        axios.get('/api/personnels')
      ]);
      setDeliveries(deliveriesRes.data);
      setVehicles(vehiclesRes.data);
      setDestinations(destinationsRes.data);
      setPersonnels(personnelsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // If switching to Itinerary, clear dateTo
      if (name === 'deliveryType' && value === 'Itinerary') {
        updated.dateTo = '';
      }
      return updated;
    });
  };

  const openModal = () => {
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);

    try {
      const payload = {
        deliveryType: formData.deliveryType,
        dateFrom: formData.dateFrom || undefined,
        dateTo: formData.dateTo || undefined,
        purpose: formData.purpose ? [formData.purpose] : [],
        vehicleEquipment: formData.vehicleEquipment,
        destination: formData.destination ? [formData.destination] : [],
        driver: formData.driver ? [formData.driver] : [],
        helper: formData.helper ? [formData.helper] : [],
        jobOrderNo: formData.jobOrderNo ? [formData.jobOrderNo] : [],
        customerSupplier: formData.customerSupplier ? [formData.customerSupplier] : [],
        totalBudget: formData.totalBudget ? Number(formData.totalBudget) : 0,
        requestedBy: formData.requestedBy
      };

      await axios.post('/api/deliveries', payload);
      toast.success('Delivery created successfully');

      const response = await axios.get('/api/deliveries');
      setDeliveries(response.data);
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create delivery');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setTypeFilter('all');
    toast.success('Filters cleared');
  };

  // --- Status Update Logic ---
  const openStatusModal = (delivery) => {
    if (delivery.status === 'Completed') return;
    
    // Default the date input to current local date/time
    const now = new Date();
    // format to YYYY-MM-DDThh:mm for datetime-local
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const localDateTime = now.toISOString().slice(0, 16);
    
    const [localDate, localTime] = localDateTime.split('T');

    setStatusModal({
      isOpen: true,
      delivery,
      dateInput: localDate,
      timeInput: localTime,
      isLoading: false
    });
  };

  const closeStatusModal = () => {
    setStatusModal({ isOpen: false, delivery: null, dateInput: '', timeInput: '', isLoading: false });
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    const { delivery, dateInput, timeInput } = statusModal;
    
    if (!dateInput || !timeInput) {
      toast.error('Date and time are required');
      return;
    }

    setStatusModal(prev => ({ ...prev, isLoading: true }));

    try {
      const combinedDateTime = new Date(`${dateInput}T${timeInput}`);
      let payload = {};
      if (delivery.status === 'Pending' || !delivery.status) {
        payload = {
          status: 'In Transit',
          departureDate: combinedDateTime.toISOString()
        };
      } else if (delivery.status === 'In Transit') {
        payload = {
          status: 'Completed',
          arrivalDate: combinedDateTime.toISOString()
        };
      }

      await axios.put(`/api/deliveries/${delivery._id}`, payload);
      toast.success(`Delivery marked as ${payload.status}`);
      
      // Refresh deliveries
      const response = await axios.get('/api/deliveries');
      setDeliveries(response.data);
      closeStatusModal();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
      setStatusModal(prev => ({ ...prev, isLoading: false }));
    }
  };
  // ---------------------------

  // Helper: join array values with comma
  const joinArray = (arr) => {
    if (!arr || !Array.isArray(arr)) return '—';
    const filtered = arr.filter(Boolean);
    return filtered.length > 0 ? filtered.join(', ') : '—';
  };

  // Helper: format name as First Initial + Last Name
  const formatName = (name) => {
    if (!name || typeof name !== 'string') return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    return `${firstName.charAt(0)}. ${lastName}`;
  };

  const joinNames = (arr) => {
    if (!arr || !Array.isArray(arr)) return '—';
    const filtered = arr.filter(Boolean);
    return filtered.length > 0 ? filtered.map(formatName).join(', ') : '—';
  };

  // Helper: format date as MM/DD/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  // Helper: compute duration between two dates
  const computeDuration = (from, to) => {
    if (!from || !to) return '—';
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = new Date(to) - new Date(from);
    const days = Math.ceil(diffMs / msPerDay);
    if (days < 0) return '—';
    if (days === 0) return '1 day';
    return `${days + 1} day${days + 1 > 1 ? 's' : ''}`;
  };

  // Toggle column visibility
  const toggleColumn = (column) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  };

  // Filter
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const q = searchQuery.toLowerCase();
      const searchMatch = !q || (
        (d.referenceNo || '').toLowerCase().includes(q) ||
        (d.deliveryType || '').toLowerCase().includes(q) ||
        (d.purpose || []).join(' ').toLowerCase().includes(q) ||
        (d.vehicleEquipment || '').toLowerCase().includes(q) ||
        (d.destination || []).join(' ').toLowerCase().includes(q) ||
        (d.driver || []).join(' ').toLowerCase().includes(q) ||
        (d.helper || []).join(' ').toLowerCase().includes(q) ||
        (d.jobOrderNo || []).join(' ').toLowerCase().includes(q) ||
        (d.customerSupplier || []).join(' ').toLowerCase().includes(q) ||
        (d.requestedBy || '').toLowerCase().includes(q)
      );
      const typeMatch = typeFilter === 'all' || (d.deliveryType || '').toLowerCase() === typeFilter.toLowerCase();
      return searchMatch && typeMatch;
    });
  }, [deliveries, searchQuery, typeFilter]);

  const drivers = personnels.filter(p => p.position === 'Driver');
  const helpers = personnels.filter(p => p.position === 'Helper');

  const inputFormClass = "block h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto";
  const selectClass = `${inputFormClass} appearance-none cursor-pointer`;

  return (
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500">

      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center shrink-0">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Delivery Plan</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Overview of All Scheduled Deliveries</p>
        </div>
      </div>

      {/* Unified Table & Filters Card */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {/* Search, Filters & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center border-b border-border p-4 bg-muted/20 shrink-0">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search deliveries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs h-8 text-xs bg-background"
            />

            {/* Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 bg-background">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="text-xs">Type</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={typeFilter === 'all'} onCheckedChange={() => setTypeFilter('all')}>All</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={typeFilter === 'Field Trip'} onCheckedChange={() => setTypeFilter('Field Trip')}>Field Trip</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={typeFilter === 'Itinerary'} onCheckedChange={() => setTypeFilter('Itinerary')}>Itinerary</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {(searchQuery || typeFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Column Visibility Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 bg-background">
                  <Columns className="h-3.5 w-3.5" />
                  <span className="text-xs">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tableColumns.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    className="capitalize"
                    checked={visibleColumns.has(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Create Button */}
            <Button size="sm" onClick={openModal} className="h-8 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs hidden sm:inline">New Delivery</span>
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-card min-w-0 min-h-0 relative">
          {isLoading ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loading deliveries...</span>
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
              <ClipboardList className="h-8 w-8 text-muted-foreground/50 mb-1" />
              <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No deliveries found</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Try adjusting your search or add a new delivery.</p>
            </div>
          ) : (
            <table className="w-full min-w-[900px] border-collapse relative">
              <thead className="sticky top-0 z-10 bg-orange-500 backdrop-blur shadow-sm">
                <tr className="border-b border-orange-600/20">
                  {tableColumns.filter(c => visibleColumns.has(c.key)).map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white",
                        col.key === 'jobOrderNo' ? "text-center" : col.key === 'totalBudget' ? "text-right pr-6" : "text-left"
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((item, index) => (
                  <tr
                    key={item._id}
                    className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${index % 2 === 0 ? 'bg-card/30' : ''}`}
                  >
                    {visibleColumns.has('referenceNo') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-tight">{item.referenceNo}</td>
                    )}
                    {visibleColumns.has('status') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold tracking-tight">
                        <span 
                          onClick={() => openStatusModal(item)}
                          className={cn(
                          "px-2 py-1 rounded-full text-[8px] uppercase tracking-widest font-bold",
                          item.status === 'Completed' ? "bg-green-500/10 text-green-600" :
                          item.status === 'In Transit' ? "bg-blue-500/10 text-blue-600 cursor-pointer hover:bg-blue-500/20 transition-colors" :
                          "bg-yellow-500/10 text-yellow-600 cursor-pointer hover:bg-yellow-500/20 transition-colors"
                        )}>
                          {item.status || 'Pending'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.has('deliveryType') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight">{item.deliveryType || '—'}</td>
                    )}
                    {visibleColumns.has('dateFrom') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight">{formatDate(item.dateFrom)}</td>
                    )}
                    {visibleColumns.has('dateTo') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight">{formatDate(item.dateTo)}</td>
                    )}
                    {visibleColumns.has('duration') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-muted-foreground tracking-tight">{computeDuration(item.dateFrom, item.dateTo)}</td>
                    )}
                    {visibleColumns.has('purpose') && (
                      <td className="max-w-[120px] truncate px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight" title={joinArray(item.purpose)}>{joinArray(item.purpose)}</td>
                    )}
                    {visibleColumns.has('vehicleEquipment') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight">{item.vehicleEquipment || '—'}</td>
                    )}
                    {visibleColumns.has('destination') && (
                      <td className="max-w-[120px] truncate px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight" title={joinArray(item.destination)}>{joinArray(item.destination)}</td>
                    )}
                    {visibleColumns.has('driver') && (
                      <td className="max-w-[100px] truncate px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight" title={joinArray(item.driver)}>{joinNames(item.driver)}</td>
                    )}
                    {visibleColumns.has('helper') && (
                      <td className="max-w-[100px] truncate px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight" title={joinArray(item.helper)}>{joinNames(item.helper)}</td>
                    )}
                    {visibleColumns.has('jobOrderNo') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight text-center">{joinArray(item.jobOrderNo)}</td>
                    )}
                    {visibleColumns.has('customerSupplier') && (
                      <td className="px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight" title={joinArray(item.customerSupplier)}>{joinArray(item.customerSupplier)}</td>
                    )}
                    {visibleColumns.has('totalBudget') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-wider text-right pr-6">{Number(item.totalBudget || 0).toLocaleString()}</td>
                    )}
                    {visibleColumns.has('requestedBy') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{item.requestedBy || '—'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
        )}
      </div>

      </div>

      {/* Create Delivery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                  <Plus className="h-3 w-3" />
                </div>
                <h2 className="text-[12px] font-bold text-foreground uppercase tracking-tight">
                  NEW DELIVERY
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full flex h-5.5 w-5.5 items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Delivery Type - Radio */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Delivery Type</label>
                <div className="flex items-center gap-4">
                  {['Field Trip', 'Itinerary'].map((type) => (
                    <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryType"
                        value={type}
                        checked={formData.deliveryType === type}
                        onChange={handleInputChange}
                        className="h-3.5 w-3.5 accent-primary cursor-pointer"
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date From / Date To */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Date From</label>
                  <input
                    name="dateFrom"
                    type="date"
                    value={formData.dateFrom}
                    onChange={handleInputChange}
                    className={inputFormClass}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Date To</label>
                  <input
                    name="dateTo"
                    type="date"
                    value={formData.deliveryType === 'Itinerary' ? '' : formData.dateTo}
                    onChange={handleInputChange}
                    disabled={formData.deliveryType === 'Itinerary'}
                    className={`${inputFormClass} ${formData.deliveryType === 'Itinerary' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              {/* Purpose - Dropdown */}
              <div className="relative">
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="" disabled>SELECT PURPOSE</option>
                  {['Delivery', 'Pick Up', 'Rescue', 'Pull Out', 'Service Manpower', 'Assign to Project', 'Purchase'].map((p) => (
                    <option key={p} value={p} className="font-bold">{p.toUpperCase()}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                  <ChevronDown className="h-3 w-3" />
                </div>
              </div>

              {/* Vehicle / Equipment */}
              <div className="relative">
                <select
                  name="vehicleEquipment"
                  value={formData.vehicleEquipment}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="" disabled>SELECT VEHICLE / EQUIPMENT</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v.plateNumber} className="font-bold">{v.plateNumber} — {v.model}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                  <ChevronDown className="h-3 w-3" />
                </div>
              </div>

              {/* Destination */}
              <div className="relative">
                <select
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="" disabled>SELECT DESTINATION</option>
                  {destinations.map(d => (
                    <option key={d._id} value={d.name} className="font-bold">{d.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                  <ChevronDown className="h-3 w-3" />
                </div>
              </div>

              {/* Driver / Helper */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <select
                    name="driver"
                    value={formData.driver}
                    onChange={handleInputChange}
                    className={selectClass}
                  >
                    <option value="" disabled>SELECT DRIVER</option>
                    {drivers.map(d => (
                      <option key={d._id} value={`${d.firstname} ${d.lastname}`} className="font-bold">
                        {d.lastname}, {d.firstname}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </div>
                <div className="relative">
                  <select
                    name="helper"
                    value={formData.helper}
                    onChange={handleInputChange}
                    className={selectClass}
                  >
                    <option value="" disabled>SELECT HELPER</option>
                    {helpers.map(h => (
                      <option key={h._id} value={`${h.firstname} ${h.lastname}`} className="font-bold">
                        {h.lastname}, {h.firstname}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </div>
              </div>

              {/* Job Order No. */}
              <input
                name="jobOrderNo"
                value={formData.jobOrderNo}
                onChange={handleInputChange}
                placeholder="JOB ORDER NO."
                className={inputFormClass}
              />

              {/* Customer / Supplier */}
              <input
                name="customerSupplier"
                value={formData.customerSupplier}
                onChange={handleInputChange}
                placeholder="CUSTOMER / SUPPLIER"
                className={inputFormClass}
              />

              {/* Total Budget */}
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground/60 select-none">
                  ₱
                </div>
                <input
                  name="totalBudget"
                  type="number"
                  value={formData.totalBudget}
                  onChange={handleInputChange}
                  placeholder="TOTAL BUDGET"
                  className={`${inputFormClass} pl-7`}
                />
              </div>

              {/* Requested By */}
              <input
                name="requestedBy"
                value={formData.requestedBy}
                onChange={handleInputChange}
                placeholder="REQUESTED BY"
                className={inputFormClass}
              />

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitLoading}
                  size="sm"
                  className="min-w-[90px] h-8 text-[10px] uppercase tracking-wider"
                >
                  {isSubmitLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'SUBMIT'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Status Update Modal */}
      {statusModal.isOpen && statusModal.delivery && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[400px] rounded-xl border border-border bg-card p-5 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded",
                  (statusModal.delivery.status === 'Pending' || !statusModal.delivery.status) 
                    ? "bg-blue-500/10 text-blue-600" 
                    : "bg-green-500/10 text-green-600"
                )}>
                  <RotateCcw className="h-3 w-3" />
                </div>
                <h2 className="text-[12px] font-bold text-foreground uppercase tracking-tight">
                  UPDATE STATUS: {statusModal.delivery.referenceNo}
                </h2>
              </div>
              <button
                onClick={closeStatusModal}
                disabled={statusModal.isLoading}
                className="rounded-full flex h-5.5 w-5.5 items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div className="rounded-lg bg-muted/30 p-3 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Current Status</p>
                <p className={cn(
                  "text-[12px] font-bold uppercase tracking-widest",
                   statusModal.delivery.status === 'In Transit' ? "text-blue-600" : "text-yellow-600"
                )}>
                  {statusModal.delivery.status || 'Pending'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                    {(statusModal.delivery.status === 'Pending' || !statusModal.delivery.status) ? 'Departure Date' : 'Arrival Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={statusModal.dateInput}
                    onChange={(e) => setStatusModal(prev => ({ ...prev, dateInput: e.target.value }))}
                    disabled={statusModal.isLoading}
                    className="block h-9 w-full rounded border border-input bg-background px-3 py-1 text-[12px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                    {(statusModal.delivery.status === 'Pending' || !statusModal.delivery.status) ? 'Departure Time' : 'Arrival Time'}
                  </label>
                  <input
                    type="time"
                    required
                    value={statusModal.timeInput}
                    onChange={(e) => setStatusModal(prev => ({ ...prev, timeInput: e.target.value }))}
                    disabled={statusModal.isLoading}
                    className="block h-9 w-full rounded border border-input bg-background px-3 py-1 text-[12px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeStatusModal}
                  disabled={statusModal.isLoading}
                  className="flex-1 text-[11px] h-8 uppercase tracking-wider font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={statusModal.isLoading}
                  className={cn(
                    "flex-1 text-[11px] h-8 uppercase tracking-wider font-bold",
                    (statusModal.delivery.status === 'Pending' || !statusModal.delivery.status)
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  )}
                >
                  {statusModal.isLoading ? (
                    <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> UPDAting...</>
                  ) : (
                    (statusModal.delivery.status === 'Pending' || !statusModal.delivery.status) ? 'Mark as Departed' : 'Mark as Arrived'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryPlan;
