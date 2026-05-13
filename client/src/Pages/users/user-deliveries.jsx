import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  Loader2,
  ClipboardList,
  Plus,
  X,
  ChevronDown,
  Minus,
  Send,
  Clock,
  AlertTriangle,
  Truck,
  CalendarDays,
  MapPin,
  FileText,
  Search,
  Calendar,
  RotateCcw,
  Pencil,
  Trash2,
} from 'lucide-react';
import axios from 'axios';
import { useAppToast } from '../../components/ui/alert-toast-provider';
import { cn } from '../../lib/utils';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../../components/ui/dropdown-menu';

const joinArray = (arr, separator = ' / ') => {
  if (!arr || !arr.length || !Array.isArray(arr)) return '—';
  const filtered = arr.filter(Boolean);
  return filtered.length > 0 ? filtered.join(separator) : '—';
};

function UserDeliveries() {
  const { user } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  // Helper: compute duration between two dates
  const computeDuration = (from, to) => {
    if (!from) return '—';
    if (!to) return '1 day';
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = new Date(to) - new Date(from);
    const days = Math.ceil(diffMs / msPerDay);
    if (days < 0) return '—';
    if (days === 0) return '1 day';
    return `${days + 1} day${days + 1 > 1 ? 's' : ''}`;
  };

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [personnels, setPersonnels] = useState([]);
  const [activeSchedules, setActiveSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Details modal
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, request: null });

  // Edit/Delete state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState('all');

  const initialFormData = {
    deliveryType: '',
    dateFrom: '',
    dateTo: '',
    purpose: [''],
    activity: [''],
    vehicleEquipment: '',
    tnvsProvider: '',
    destination: [''],
    jobOrderNo: [''],
    customerSupplier: [''],
    requestedBy: '',
  };

  const uniqueCustomerSuppliers = useMemo(() => {
    const set = new Set();
    destinations.forEach(d => {
      if (d.customerSupplier) set.add(d.customerSupplier);
    });
    return Array.from(set).sort();
  }, [destinations]);

  const [newDestinations, setNewDestinations] = useState({});

  const [formData, setFormData] = useState(initialFormData);
  const [newCustomers, setNewCustomers] = useState({});

  const toast = useAppToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userId = user?._id || '';
      const [requestsRes, vehiclesRes, destinationsRes, personnelsRes, schedulesRes] = await Promise.all([
        axios.get(`/api/delivery-requests/my-requests?userId=${userId}`),
        axios.get('/api/vehicles'),
        axios.get('/api/destinations'),
        axios.get('/api/personnels'),
        axios.get('/api/delivery-requests/schedules'),
      ]);
      setRequests(requestsRes.data);
      setVehicles(vehiclesRes.data);
      setDestinations(destinationsRes.data);
      setPersonnels(personnelsRes.data);
      setActiveSchedules(schedulesRes.data);

      // Auto-open details modal if requestId query param is present
      const requestId = searchParams.get('requestId');
      if (requestId && requestsRes.data.length > 0) {
        const match = requestsRes.data.find((r) => r._id === requestId || r.referenceNo === requestId);
        if (match) {
          setDetailsModal({ isOpen: true, request: match });
          // Clear the query param so refreshing doesn't re-open
          setSearchParams({}, { replace: true });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayChange = (name, index, value) => {
    setFormData((prev) => {
      const newArray = [...prev[name]];
      newArray[index] = value;
      return { ...prev, [name]: newArray };
    });
  };

  const addArrayField = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: [...prev[name], ''],
    }));
  };

  const addPurposeAndActivity = () => {
    setFormData((prev) => ({
      ...prev,
      purpose: [...prev.purpose, ''],
      activity: [...prev.activity, ''],
    }));
  };

  const removeArrayField = (name, index) => {
    setFormData((prev) => {
      const newArray = prev[name].filter((_, i) => i !== index);
      return { ...prev, [name]: newArray };
    });
  };

  const handleEdit = (req) => {
    setIsEditMode(true);
    setEditingRequestId(req._id);

    // Ensure all arrays have at least one empty string if they are empty
    const ensureArray = (arr) => (arr && arr.length > 0 ? arr : ['']);

    setFormData({
      deliveryType: req.deliveryType || '',
      dateFrom: req.dateFrom ? new Date(req.dateFrom).toISOString().split('T')[0] : '',
      dateTo: req.dateTo ? new Date(req.dateTo).toISOString().split('T')[0] : '',
      purpose: ensureArray(req.purpose),
      activity: ensureArray(req.activity),
      vehicleEquipment: req.vehicleEquipment || '',
      tnvsProvider: req.tnvsProvider || '',
      destination: ensureArray(req.destination),
      jobOrderNo: ensureArray(req.jobOrderNo),
      customerSupplier: ensureArray(req.customerSupplier),
      requestedBy: req.requestedBy || '',
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery request?')) return;

    setIsDeleteLoading(true);
    try {
      await axios.delete(`/api/delivery-requests/${id}`);
      toast.success('Request deleted successfully');
      // Refresh requests
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete request');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const closeForm = () => {
    setIsFormModalOpen(false);
    setIsEditMode(false);
    setEditingRequestId(null);
    setFormData(initialFormData);
    setNewCustomers({});
    setNewDestinations({});
  };

  // Helper: check if vehicle is booked during selected dates (only for approved requests)
  const isVehicleBooked = (plateNumber) => {
    if (!plateNumber || !formData.dateFrom) return false;
    if (plateNumber === 'RENT_VEHICLE' || plateNumber === 'UNASSIGNED') return false;
    const startA = new Date(formData.dateFrom).setHours(0,0,0,0);
    const endA = new Date(formData.dateTo || formData.dateFrom).setHours(23,59,59,999);
    
    return activeSchedules.some(sched => {
      // Skip if editing the same request
      if (isEditMode && sched._id === editingRequestId) return false;
      // Skip if different vehicle
      if (sched.vehicleEquipment !== plateNumber) return false;
      // Skip if no date
      if (!sched.dateFrom) return false;
      // ONLY check approved or review-ready requests (not pending)
      if (sched.requestStatus !== 'Approved' && sched.requestStatus !== 'Approved with Changes') return false;
      
      const startB = new Date(sched.dateFrom).setHours(0,0,0,0);
      const endB = new Date(sched.dateTo || sched.dateFrom).setHours(23,59,59,999);
      return startA <= endB && endA >= startB;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.deliveryType) {
      toast.error('Delivery Type is required');
      return;
    }
    if (!formData.dateFrom) {
      toast.error('Date From is required');
      return;
    }
    if (!formData.vehicleEquipment) {
      toast.error('Vehicle / Equipment is required');
      return;
    }
    if (formData.vehicleEquipment === 'UNASSIGNED') {
      // Skip booking check — admin will assign vehicle later
    } else
    if (isVehicleBooked(formData.vehicleEquipment)) {
      toast.error(`The selected vehicle (${formData.vehicleEquipment}) is already booked during these dates.`);
      return;
    }
    if (formData.purpose.filter(v => v.trim() !== '').length === 0) {
      toast.error('At least one Purpose is required');
      return;
    }
    if (formData.activity.filter(v => v.trim() !== '').length === 0) {
      toast.error('At least one Activity is required');
      return;
    }
    if (formData.destination.filter(v => v.trim() !== '').length === 0) {
      toast.error('At least one Destination is required');
      return;
    }
    if (formData.jobOrderNo.filter(v => v.trim() !== '').length === 0) {
      toast.error('At least one Job Order No is required');
      return;
    }
    if (formData.customerSupplier.filter(v => v.trim() !== '').length === 0) {
      toast.error('At least one Customer / Supplier is required');
      return;
    }
    if (!formData.requestedBy?.trim()) {
      toast.error('Requested By is required');
      return;
    }
    setIsSubmitLoading(true);

    try {
      const processedCustomerSupplier = [...formData.customerSupplier];
      const processedDestination = [...formData.destination];

      for (let i = 0; i < processedCustomerSupplier.length; i++) {
        if (processedCustomerSupplier[i] === 'NEW_CUSTOMER' && newCustomers[i]) {
          processedCustomerSupplier[i] = newCustomers[i].trim();
        }

        if (processedDestination[i] === 'NEW_DESTINATION' && newDestinations[i]) {
          const newDestName = newDestinations[i].trim();
          processedDestination[i] = newDestName;
          
          try {
            await axios.post('/api/destinations', { 
              name: newDestName,
              customerSupplier: processedCustomerSupplier[i]
            });
          } catch (e) {
            // Ignore
          }
        }
      }

      const payload = {
        deliveryType: formData.deliveryType,
        dateFrom: formData.dateFrom || undefined,
        dateTo: formData.dateTo || undefined,
        purpose: formData.purpose.filter((v) => v.trim() !== ''),
        activity: formData.activity.filter((v) => v.trim() !== ''),
        vehicleEquipment: formData.vehicleEquipment,
        tnvsProvider: formData.vehicleEquipment === 'RENT_VEHICLE' ? formData.tnvsProvider : undefined,
        destination: processedDestination.filter((v) => v.trim() !== ''),
        jobOrderNo: formData.jobOrderNo.filter((v) => v.trim() !== ''),
        customerSupplier: processedCustomerSupplier.filter((v) => v.trim() !== ''),
        requestedBy: formData.requestedBy.trim(),
        requestedByUserId: user?._id || '',
      };

      if (isEditMode && editingRequestId) {
        await axios.put(`/api/delivery-requests/${editingRequestId}`, payload);
        toast.success('Delivery request updated successfully');
      } else {
        await axios.post('/api/delivery-requests', payload);
        toast.success('Delivery request submitted successfully');
      }

      // Refresh requests
      fetchData();
      closeForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit delivery request');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours() % 12 || 12).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${mm}/${dd}/${yyyy} | ${hh}:${min} ${ampm}`;
  };



  const inputFormClass =
    'block h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto';
  const selectClass = `${inputFormClass} appearance-none cursor-pointer`;

  const statusConfig = {
    Pending: {
      icon: Clock,
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      border: 'border-amber-200',
    },
    Approved: {
      icon: Clock,
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      border: 'border-emerald-200',
    },
    'Approved with Changes': {
      icon: Clock,
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
      border: 'border-blue-200',
    },
    'For Review': {
      icon: Clock,
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      border: 'border-amber-200',
    },
    Declined: {
      icon: Clock,
      bg: 'bg-red-100',
      text: 'text-red-700',
      dot: 'bg-red-500',
      border: 'border-red-200',
    },
  };

  // Filter Logic
  const filteredRequests = useMemo(() => {
    return requests.filter((d) => {
      const q = searchQuery.toLowerCase();
      const searchMatch = !q || (
        (d.deliveryType || '').toLowerCase().includes(q) ||
        (d.vehicleEquipment || '').toLowerCase().includes(q) ||
        (d.customerSupplier || []).join(' ').toLowerCase().includes(q) ||
        (d.purpose || []).join(' ').toLowerCase().includes(q) ||
        (d.activity || []).join(' ').toLowerCase().includes(q)
      );

      const dateFromMatch = !dateFromFilter || (d.dateFrom && new Date(d.dateFrom) >= new Date(dateFromFilter));
      const dateToMatch = !dateToFilter || (d.dateFrom && new Date(d.dateFrom) <= new Date(dateToFilter));

      const statusMatch = statusFilter === 'all' || d.requestStatus === statusFilter;
      const vehicleMatch = vehicleFilter === 'all' || d.vehicleEquipment === vehicleFilter;
      const deliveryTypeMatch = deliveryTypeFilter === 'all' || (d.deliveryType || '') === deliveryTypeFilter;
      const purposeMatch = purposeFilter === 'all' || (d.purpose && d.purpose.includes(purposeFilter));

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

      return searchMatch && dateFromMatch && dateToMatch && statusMatch && vehicleMatch && monthMatch && deliveryTypeMatch && purposeMatch;
    });
  }, [requests, searchQuery, dateFromFilter, dateToFilter, statusFilter, vehicleFilter, monthFilter, purposeFilter, deliveryTypeFilter]);

  const uniqueVehicles = useMemo(() => {
    const list = new Set();
    requests.forEach(d => d.vehicleEquipment && list.add(d.vehicleEquipment));
    return Array.from(list).sort();
  }, [requests]);

  const uniqueMonths = useMemo(() => {
    const list = new Set();
    requests.forEach(d => {
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
  }, [requests]);

  const formatMonthLabel = (yyyymm) => {
    const [yyyy, mm] = yyyymm.split('-');
    const date = new Date(parseInt(yyyy), parseInt(mm) - 1);
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFromFilter('');
    setDateToFilter('');
    setStatusFilter('all');
    setVehicleFilter('all');
    setMonthFilter('all');
    setPurposeFilter('all');
    setDeliveryTypeFilter('all');
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">My Deliveries</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Request and Track Your Deliveries</p>
        </div>
        <button
          onClick={() => { closeForm(); setIsFormModalOpen(true); }}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Request Delivery
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        {requests.length > 0 ? (
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center border-b border-border p-4 bg-muted/20 shrink-0">
              <div className="flex flex-1 gap-2 flex-wrap items-center">

                <div className="relative w-[200px] shrink-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs bg-background pl-8"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${statusFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                      <FileText className='h-3.5 w-3.5' />
                      <span className="text-[10px] font-bold tracking-wider uppercase max-w-[120px] truncate">{statusFilter === 'all' ? 'Status' : statusFilter}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[180px]">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem className="text-[10px] uppercase font-bold" checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>ALL STATUS</DropdownMenuCheckboxItem>
                    {['Pending', 'Approved', 'Approved with Changes', 'Declined'].map(s => (
                      <DropdownMenuCheckboxItem key={s} className="text-[10px] uppercase" checked={statusFilter === s} onCheckedChange={() => setStatusFilter(s)}>{s}</DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${deliveryTypeFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                      <FileText className='h-3.5 w-3.5' />
                      <span className="text-[10px] font-bold tracking-wider uppercase max-w-[120px] truncate">{deliveryTypeFilter === 'all' ? 'Type' : deliveryTypeFilter}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[180px]">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem className="text-[10px] uppercase font-bold" checked={deliveryTypeFilter === 'all'} onCheckedChange={() => setDeliveryTypeFilter('all')}>ALL TYPES</DropdownMenuCheckboxItem>
                    {['Field Trip', 'Itinerary'].map(s => (
                      <DropdownMenuCheckboxItem key={s} className="text-[10px] uppercase" checked={deliveryTypeFilter === s} onCheckedChange={() => setDeliveryTypeFilter(s)}>{s}</DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={`flex items-center gap-2 h-8 bg-background shrink-0 ${purposeFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                      <MapPin className='h-3.5 w-3.5' />
                      <span className="text-[10px] font-bold tracking-wider uppercase max-w-[120px] truncate">{purposeFilter === 'all' ? 'Purpose' : purposeFilter}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px] max-h-[300px] overflow-y-auto">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Filter by Purpose</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem className="text-[10px] uppercase font-bold" checked={purposeFilter === 'all'} onCheckedChange={() => setPurposeFilter('all')}>ALL PURPOSES</DropdownMenuCheckboxItem>
                    {['Delivery', 'Pick Up', 'Rescue', 'Pull Out', 'Service Manpower', 'Assign to Project', 'Purchase'].map(s => (
                      <DropdownMenuCheckboxItem key={s} className="text-[10px] uppercase" checked={purposeFilter === s} onCheckedChange={() => setPurposeFilter(s)}>{s}</DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

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

                {(searchQuery || dateFromFilter || dateToFilter || statusFilter !== 'all' || vehicleFilter !== 'all' || monthFilter !== 'all' || purposeFilter !== 'all' || deliveryTypeFilter !== 'all') && (
                  <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-8 gap-1.5 text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider font-bold">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-card relative">
              {filteredRequests.length === 0 ? (
                <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/50 mb-1" />
                  <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No records found</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Adjust filters to see your requests.</p>
                </div>
              ) : (
                <table className="w-full min-w-[max-content] border-collapse relative">
                  <thead className="sticky top-0 z-10 bg-orange-500 backdrop-blur shadow-sm">
                    <tr className="border-b border-orange-600/20">
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Reference No.</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Date Submitted</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle">Status</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Delivery Type</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Delivery Date</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Duration</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Purpose</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Activity</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Vehicle</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Customer / Supplier</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Destination</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle">Job Order No</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Requested By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req, index) => {
                      const sc = statusConfig[req.requestStatus] || statusConfig.Pending;
                      return (
                        <tr
                          key={req._id}
                          onClick={() => setDetailsModal({ isOpen: true, request: req })}
                          className={`border-b border-border/50 transition-colors hover:bg-muted/30 cursor-pointer ${index % 2 === 0 ? 'bg-card/30' : ''}`}
                        >
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-tight align-middle">
                            {req.deliveryReferenceNo || req.referenceNo || '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-muted-foreground align-middle">{formatDateTime(req.dateSubmitted || req.createdAt)}</td>
                          <td className="whitespace-nowrap px-3 py-2 align-middle text-center">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${sc.bg} ${sc.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                              {req.requestStatus}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{req.deliveryType || '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">
                            {req.dateFrom && req.dateTo ? `${formatDate(req.dateFrom)} - ${formatDate(req.dateTo)}` : formatDate(req.dateFrom)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-muted-foreground tracking-tight align-middle">
                            {computeDuration(req.dateFrom, req.dateTo)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight align-middle">
                            {(req.purpose || []).filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight align-middle">
                            {(req.activity || []).filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">
                            {(() => {
                              const plate = req.vehicleEquipment;
                              if (!plate) return '—';
                              if (plate === 'UNASSIGNED') return <span className="italic text-muted-foreground">UNASSIGNED</span>;
                              if (plate === 'RENT_VEHICLE') return <span>{`Rent Vehicle${req.tnvsProvider ? ` - ${req.tnvsProvider}` : ''}`}</span>;
                              const v = vehicles.find((v) => v.plateNumber === plate);
                              return v ? <span>{`${v.plateNumber} — ${v.model}`}</span> : <span>{plate}</span>;
                            })()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight align-middle">
                            {(req.customerSupplier || []).filter(Boolean).join(' / ') || '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight align-middle">
                            {(req.destination || []).filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight text-center align-middle">
                            {(req.jobOrderNo || []).filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">
                            {req.requestedBy || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-xs font-semibold text-muted-foreground">No requests yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">Submit a delivery request to get started</p>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Request Delivery
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
                  {isEditMode ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
                  {isEditMode ? 'Update Delivery Request' : 'New Delivery Request'}
                </h2>
              </div>
              <button
                onClick={closeForm}
                className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <form id="delivery-request-form" onSubmit={handleSubmit} className="space-y-3">
                {/* Delivery Type */}
                <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
                  <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Delivery Type</legend>
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
                </fieldset>

                {/* Schedule */}
                <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm min-w-0">
                  <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Schedule</legend>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Date From</label>
                      <input
                        name="dateFrom"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.dateFrom}
                        onChange={handleInputChange}
                        className={inputFormClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Date To</label>
                      <input
                        name="dateTo"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.dateTo}
                        onChange={handleInputChange}
                        className={inputFormClass}
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Vehicle */}
                <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
                  <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Vehicle / Equipment</legend>
                  <div className="relative">
                    <select
                      name="vehicleEquipment"
                      value={formData.vehicleEquipment}
                      onChange={handleInputChange}
                      className={selectClass}
                    >
                      <option value="" disabled>Select Vehicle / Equipment</option>
                      <option value="UNASSIGNED" className="font-bold">UNASSIGNED</option>
                      <option value="RENT_VEHICLE" className="font-bold">Rent Vehicle</option>
                      <option value="MOTORCYCLE" className="font-bold text-[#16a34a]">MOTORCYCLE</option>
                      {[...vehicles].sort((a, b) => a.plateNumber.localeCompare(b.plateNumber)).map((v) => {
                        let textColor = 'inherit';
                        let status = (v.status || 'available').toLowerCase();
                        let displayStatus = status === 'available' ? 'Available' : v.status;

                        // Dynamically override status if overlapping dates are selected
                        if (isVehicleBooked(v.plateNumber)) {
                          status = 'booked';
                          displayStatus = 'Booked';
                        }

                        if (status === 'available') { textColor = '#16a34a'; }
                        else if (status.includes('booked')) { textColor = '#dc2626'; }
                        else if (status.includes('maintenance')) { textColor = '#d97706'; }
                        else if (status.includes('unavailable')) { textColor = '#dc2626'; }

                        const isDisabled = status !== 'available';

                        return (
                          <option 
                            key={v._id} 
                            value={v.plateNumber} 
                            className="font-bold"
                            style={{ color: textColor }}
                            disabled={isDisabled}
                          >
                            {v.plateNumber} — {v.model} ({displayStatus})
                          </option>
                        );
                      })}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </div>
                  {formData.vehicleEquipment === 'RENT_VEHICLE' && (
                    <input
                      name="tnvsProvider"
                      value={formData.tnvsProvider}
                      onChange={handleInputChange}
                      className={`${inputFormClass} mt-2`}
                      placeholder="Specify vehicle needs"
                    />
                  )}
                </fieldset>

                {/* Purpose & Activity */}
                <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-3 min-w-0">
                  <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1 flex items-center gap-2">
                    Purpose & Activity
                  </legend>
                  {formData.purpose.map((p, index) => (
                    <div key={`purpose-activity-${index}`} className="flex items-center gap-2">
                      <div className="relative w-[30%] min-w-[130px]">
                        <select
                          value={p}
                          onChange={(e) => handleArrayChange('purpose', index, e.target.value)}
                          className={selectClass}
                        >
                          <option value="" disabled>Select Purpose</option>
                          {['Delivery', 'Pick Up', 'Rescue', 'Pull Out', 'Service Manpower', 'Assign to Project', 'Purchase'].map((opt) => (
                            <option key={opt} value={opt} className="font-bold">{opt.toUpperCase()}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                          <ChevronDown className="h-3 w-3" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <input
                          value={formData.activity[index] || ''}
                          onChange={(e) => handleArrayChange('activity', index, e.target.value)}
                          className={inputFormClass}
                          placeholder="Activity"
                        />
                      </div>
                      {index === 0 && (
                        <button type="button" onClick={addPurposeAndActivity} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                      {index > 0 && (
                        <button type="button" onClick={() => { removeArrayField('purpose', index); removeArrayField('activity', index); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </fieldset>

                {/* Customer / Supplier */}
                <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-2 min-w-0">
                  <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1 flex items-center gap-2">
                    Customer / Supplier
                  </legend>
                  {formData.customerSupplier.map((cs, index) => (
                    <div key={`cs-${index}`}>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className={cn(selectClass, "flex items-center justify-between text-left px-2.5 outline-none")}
                              >
                                <span className="font-bold text-foreground truncate max-w-[calc(100%-1.5rem)]">
                                  {!cs ? "Select Customer / Supplier" : (cs === 'NEW_CUSTOMER' ? '-- New Customer / Supplier --' : cs)}
                                </span>
                                <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="z-[200] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px] max-h-56 overflow-y-auto" align="start">
                              <DropdownMenuRadioGroup value={cs} onValueChange={(val) => {
                                handleArrayChange('customerSupplier', index, val);
                                // Reset destination when CS changes
                                handleArrayChange('destination', index, '');
                              }}>
                                {uniqueCustomerSuppliers.map((csName) => (
                                  <DropdownMenuRadioItem key={csName} value={csName} className="font-bold text-[11px] uppercase tracking-wider py-2 cursor-pointer">
                                    {csName}
                                  </DropdownMenuRadioItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioItem value="NEW_CUSTOMER" className="font-bold text-primary text-[11px] uppercase tracking-wider py-2 cursor-pointer">
                                  -- New Customer / Supplier --
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {index === 0 && (
                          <button type="button" onClick={() => addArrayField('customerSupplier')} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                        {index > 0 && (
                          <button type="button" onClick={() => removeArrayField('customerSupplier', index)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {cs === 'NEW_CUSTOMER' && (
                        <input
                          type="text"
                          placeholder="Enter new customer / supplier name"
                          value={newCustomers[index] || ''}
                          onChange={(e) => setNewCustomers({ ...newCustomers, [index]: e.target.value })}
                          className={`${inputFormClass} mt-2 w-full`}
                        />
                      )}
                    </div>
                  ))}
                </fieldset>

                {/* Job Order No. */}
                <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-2 min-w-0">
                  <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1 flex items-center gap-2">
                    Job Order No.
                  </legend>
                  {formData.jobOrderNo.map((jo, index) => (
                    <div key={`jo-${index}`}>
                      <div className="flex items-center gap-2">
                        <input
                          value={jo}
                          onChange={(e) => handleArrayChange('jobOrderNo', index, e.target.value)}
                          className={`${inputFormClass} flex-1`}
                          placeholder="Job Order No."
                        />
                        {index === 0 && (
                          <button type="button" onClick={() => addArrayField('jobOrderNo')} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                        {index > 0 && (
                          <button type="button" onClick={() => removeArrayField('jobOrderNo', index)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </fieldset>

                {/* Destination */}
                <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-2 min-w-0">
                  <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1 flex items-center gap-2">
                    Destination
                  </legend>
                  {formData.destination.map((dItem, index) => {
                    const currentCS = formData.customerSupplier[index];
                    const filteredDestinations = destinations.filter(d => d.customerSupplier === currentCS);
                    
                    return (
                      <div key={`dest-${index}`}>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className={cn(selectClass, "flex items-center justify-between text-left px-2.5 outline-none")}
                                >
                                  <span className="font-bold text-foreground truncate max-w-[calc(100%-1.5rem)]">
                                    {!dItem ? "Select Destination" : (dItem === 'NEW_DESTINATION' ? '-- New Destination --' : dItem)}
                                  </span>
                                  <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="z-[200] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px] max-h-56 overflow-y-auto" align="start">
                                <DropdownMenuRadioGroup value={dItem} onValueChange={(val) => handleArrayChange('destination', index, val)}>
                                  {filteredDestinations.map((d) => (
                                    <DropdownMenuRadioItem key={d._id} value={d.name} className="font-bold text-[11px] uppercase tracking-wider py-2 cursor-pointer">
                                      {d.name}
                                    </DropdownMenuRadioItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuRadioItem value="NEW_DESTINATION" className="font-bold text-primary text-[11px] uppercase tracking-wider py-2 cursor-pointer">
                                    -- New Destination --
                                  </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {index === 0 && (
                            <button type="button" onClick={() => addArrayField('destination')} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                          {index > 0 && (
                            <button type="button" onClick={() => removeArrayField('destination', index)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                              <Minus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {dItem === 'NEW_DESTINATION' && (
                          <input
                            type="text"
                            placeholder="Enter new destination"
                            value={newDestinations[index] || ''}
                            onChange={(e) => setNewDestinations({ ...newDestinations, [index]: e.target.value })}
                            className={`${inputFormClass} mt-2 w-full`}
                          />
                        )}
                      </div>
                    );
                  })}
                </fieldset>

                {/* Requested By */}
                <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
                  <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Requested By</legend>
                  <input
                    name="requestedBy"
                    value={formData.requestedBy}
                    onChange={handleInputChange}
                    className={inputFormClass}
                    placeholder="REQUESTED BY:"
                  />
                </fieldset>
              </form>
            </div>
            {/* Sticky Footer with Submit Button */}
            <div className="sticky bottom-0 z-10 flex justify-end border-t border-border bg-card p-4">
              <button
                type="submit"
                form="delivery-request-form"
                disabled={isSubmitLoading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  isEditMode ? <Pencil className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />
                )}
                {isSubmitLoading ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update Request' : 'Submit Request')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModal.isOpen && detailsModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-lg border border-border bg-card shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3 shrink-0">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Request Details</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {detailsModal.request.deliveryType} • Submitted {formatDateTime(detailsModal.request.dateSubmitted || detailsModal.request.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setDetailsModal({ isOpen: false, request: null })}
                className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Status */}
              {(() => {
                const req = detailsModal.request;
                const sc = statusConfig[req.requestStatus] || statusConfig.Pending;
                return (
                  <div className={`rounded-md ${sc.bg} border ${sc.border} px-3 py-2 flex items-center gap-2`}>
                    <sc.icon className={`h-4 w-4 ${sc.text}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${sc.text}`}>{req.requestStatus}</span>
                  </div>
                );
              })()}

              {/* Decline reason */}
              {detailsModal.request.requestStatus === 'Declined' && detailsModal.request.declineReason && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Decline Reason</p>
                    <p className="text-[11px] text-red-700 mt-0.5">{detailsModal.request.declineReason}</p>
                  </div>
                </div>
              )}

              {/* Vehicle change notification */}
              {(detailsModal.request.requestStatus === 'Approved' || detailsModal.request.requestStatus === 'Approved with Changes') && detailsModal.request.vehicleChanged && (
                <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Vehicle Changed</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      The assigned vehicle was changed from <span className="font-bold">{(() => {
                        const origPlate = detailsModal.request.originalVehicle;
                        const origVehicle = vehicles.find(v => v.plateNumber === origPlate);
                        return origVehicle ? `${origVehicle.plateNumber} (${origVehicle.model})` : origPlate;
                      })()}</span> to <span className="font-bold">{(() => {
                        const newPlate = detailsModal.request.vehicleEquipment;
                        const newVehicle = vehicles.find(v => v.plateNumber === newPlate);
                        return newVehicle ? `${newVehicle.plateNumber} (${newVehicle.model})` : newPlate;
                      })()}</span> by the {(() => {
                        const dept = detailsModal.request.reviewedBy || 'Admin';
                        const capitalized = dept.charAt(0).toUpperCase() + dept.slice(1);
                        return capitalized + (dept.toLowerCase().includes('department') ? '' : ' Department');
                      })()}.
                    </p>
                  </div>
                </div>
              )}

              {/* Combined delivery notification */}
              {(detailsModal.request.requestStatus === 'Approved' || detailsModal.request.requestStatus === 'Approved with Changes') && detailsModal.request.combinedWithDelivery && (
                <div className="flex items-start gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Added to Existing Delivery</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Your request has been added to delivery <span className="font-bold">{detailsModal.request.deliveryReferenceNo}</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Detail fields Grid based on the card layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                {/* Left Column */}
                <div className="space-y-4">
                  {[
                    { label: 'Request Ref No', value: detailsModal.request.referenceNo },
                    ...(detailsModal.request.deliveryReferenceNo ? [{ label: 'Delivery Ref No', value: detailsModal.request.deliveryReferenceNo }] : []),
                    { label: 'Date From', value: formatDate(detailsModal.request.dateFrom) },
                    { label: 'Date To', value: formatDate(detailsModal.request.dateTo) },
                    { label: 'Duration', value: computeDuration(detailsModal.request.dateFrom, detailsModal.request.dateTo) },
                    { label: 'Customer / Supplier', value: (detailsModal.request.customerSupplier || []).filter(Boolean).join(' / ') },
                    { label: 'Destination', value: (detailsModal.request.destination || []).filter(Boolean).join(' / ') },

                    { label: 'Requested By', value: detailsModal.request.requestedBy },
                  ].map((field) => field.value && field.value !== '—' && (
                    <div key={field.label} className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{field.label}</span>
                      <span className="text-[11px] font-semibold text-foreground uppercase mt-0.5">{field.value}</span>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {[
                    { label: 'Vehicle', value: (() => {
                      const plate = detailsModal.request.vehicleEquipment;
                      if (!plate) return '—';
                      if (plate === 'UNASSIGNED') return 'UNASSIGNED';
                      if (plate === 'RENT_VEHICLE') return `Rent Vehicle${detailsModal.request.tnvsProvider ? ` - ${detailsModal.request.tnvsProvider}` : ''}`;
                      const v = vehicles.find(v => v.plateNumber === plate);
                      return v ? `${v.plateNumber} — ${v.model}` : plate;
                    })() },
                    { label: 'Purpose', value: (detailsModal.request.purpose || []).filter(Boolean).join(' / ') },
                    { label: 'Activity', value: (detailsModal.request.activity || []).filter(Boolean).join(' / ') },
                    { label: 'Job Order No.', value: (detailsModal.request.jobOrderNo || []).filter(Boolean).join(' / ') },

                    { label: 'Notes', value: detailsModal.request.notes },
                  ].map((field) => field.value && field.value !== '—' && (
                    <div key={field.label} className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{field.label}</span>
                      <span className="text-[11px] font-semibold text-foreground uppercase mt-0.5 whitespace-pre-wrap">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 border-t border-border bg-card p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-end shrink-0">
              {detailsModal.request.reviewedBy && (
                <div className="flex flex-col gap-1 mr-auto">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-[100px] shrink-0 font-bold uppercase tracking-wider text-muted-foreground text-[9px] pt-0.5">
                      Reviewed By
                    </span>
                    <span className="font-semibold text-foreground uppercase">
                      {detailsModal.request.reviewedBy === 'Admin' ? 'Logistic' : detailsModal.request.reviewedBy}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-[100px] shrink-0 font-bold uppercase tracking-wider text-muted-foreground text-[9px] pt-0.5">
                      Reviewed At
                    </span>
                    <span className="font-semibold text-foreground uppercase">
                      {formatDateTime(detailsModal.request.reviewedAt)}
                    </span>
                  </div>
                </div>
              )}
              {detailsModal.request.requestStatus === 'Pending' && (
                <>
                  <span className="text-[10px] text-muted-foreground mr-auto">You can edit or delete pending requests.</span>
                  <Button
                    type="button"
                    onClick={() => {
                      setDetailsModal({ isOpen: false, request: null });
                      handleEdit(detailsModal.request);
                    }}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-primary/90"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Request
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setDetailsModal({ isOpen: false, request: null });
                      handleDelete(detailsModal.request._id);
                    }}
                    disabled={isDeleteLoading}
                    variant="destructive"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-[11px] font-bold uppercase tracking-wider"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleteLoading ? 'Deleting...' : 'Delete Request'}
                  </Button>
                </>
              )}
              {detailsModal.request.requestStatus === 'Declined' && (
                <Button
                  type="button"
                  onClick={() => {
                    setDetailsModal({ isOpen: false, request: null });
                    handleDelete(detailsModal.request._id);
                  }}
                  disabled={isDeleteLoading}
                  variant="destructive"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-[11px] font-bold uppercase tracking-wider"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleteLoading ? 'Deleting...' : 'Delete Request'}
                </Button>
              )}
              {detailsModal.request.requestStatus === 'For Review' && (
                <span className="text-[10px] text-amber-600 font-semibold">⏳ This request is under review by the logistics department.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDeliveries;
