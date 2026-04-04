import { useState, useEffect, useMemo } from 'react';
<<<<<<< HEAD
import { useOutletContext } from 'react-router-dom';
=======
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
import {
  Loader2,
  ClipboardList,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  AlertTriangle,
  Truck,
  CalendarDays,
  MapPin,
  ChevronDown,
<<<<<<< HEAD
  Plus,
  Minus,
  Users,
=======
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
} from 'lucide-react';
import axios from 'axios';
import { useAppToast } from '../../../components/ui/alert-toast-provider';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { cn } from '../../../lib/utils';

function RequestPage() {
<<<<<<< HEAD
  const { user } = useOutletContext();
  const [requests, setRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [personnels, setPersonnels] = useState([]);
=======
  const [requests, setRequests] = useState([]);
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');

  // Details modal
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, request: null });

  // Confirm dialog (approve)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    request: null,
    isLoading: false,
  });

<<<<<<< HEAD
  // Combine delivery modal
  const [combineModal, setCombineModal] = useState({
    isOpen: false,
    request: null,
    existingDeliveries: [],
    selectedDeliveryId: '',
    isLoading: false,
  });

  // Approve with change modal
  const [approveWithChangeModal, setApproveWithChangeModal] = useState({
    isOpen: false,
    request: null,
    selectedVehicle: '',
    isLoading: false,
  });

  // Personnel assignment modal
  const [personnelModal, setPersonnelModal] = useState({
    isOpen: false,
    deliveryId: null,
    request: null,
    driver: [''],
    helper: [''],
    totalBudget: '',
    isLoading: false,
  });

=======
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
  // Decline modal
  const [declineModal, setDeclineModal] = useState({
    isOpen: false,
    request: null,
    reason: '',
    isLoading: false,
  });

  const toast = useAppToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
<<<<<<< HEAD
      const [{ data: reqData }, { data: vehData }, { data: persData }] = await Promise.all([
        axios.get('/api/delivery-requests'),
        axios.get('/api/vehicles'),
        axios.get('/api/personnels')
      ]);
      setRequests(reqData);
      setVehicles(vehData);
      setPersonnels(persData);
=======
      const { data } = await axios.get('/api/delivery-requests');
      setRequests(data);
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
<<<<<<< HEAD
    const date = new Date(dateStr);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
=======
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
<<<<<<< HEAD
    const date = new Date(dateStr);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours() % 12 || 12).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${mm}/${dd}/${yyyy} | ${hh}:${min} ${ampm}`;
  };

  const computeDuration = (from, to) => {
    if (!from) return '—';
    if (!to) return '1 day';
=======
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const computeDuration = (from, to) => {
    if (!from || !to) return '—';
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = new Date(to) - new Date(from);
    const days = Math.ceil(diffMs / msPerDay);
    if (days < 0) return '—';
    if (days === 0) return '1 day';
    return `${days + 1} day${days + 1 > 1 ? 's' : ''}`;
  };

  const statusConfig = {
    Pending: {
      icon: Clock,
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
      border: 'border-amber-200 dark:border-amber-800',
    },
    Approved: {
      icon: CheckCircle2,
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
<<<<<<< HEAD
    'Approved with Changes': {
      icon: CheckCircle2,
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      dot: 'bg-blue-500',
      border: 'border-blue-200 dark:border-blue-800',
    },
=======
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
    Declined: {
      icon: XCircle,
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      dot: 'bg-red-500',
      border: 'border-red-200 dark:border-red-800',
    },
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const q = searchQuery.toLowerCase();
      const searchMatch =
        !q ||
        (r.requestedBy || '').toLowerCase().includes(q) ||
        (r.deliveryType || '').toLowerCase().includes(q) ||
        (r.destination || []).join(' ').toLowerCase().includes(q) ||
        (r.vehicleEquipment || '').toLowerCase().includes(q) ||
        (r.purpose || []).join(' ').toLowerCase().includes(q) ||
        (r.customerSupplier || []).join(' ').toLowerCase().includes(q);

      const statusMatch = statusFilter === 'all' || r.requestStatus === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [requests, searchQuery, statusFilter]);

  const pendingCount = requests.filter((r) => r.requestStatus === 'Pending').length;

  // Handle approve
  const handleApprove = async () => {
    const request = confirmDialog.request;
    setConfirmDialog((prev) => ({ ...prev, isLoading: true }));

    try {
<<<<<<< HEAD
      const { data } = await axios.put(`/api/delivery-requests/${request._id}/approve`, {
        reviewedBy: user?.department || 'Logistics Department',
      });
      
      toast.success('Request approved — delivery created successfully');
      setConfirmDialog({ isOpen: false, request: null, isLoading: false });
      setDetailsModal({ isOpen: false, request: null });
      
      // Open personnel assignment modal
      setPersonnelModal({
        isOpen: true,
        deliveryId: data.deliveryId,
        request: request,
        driver: request.driver && request.driver.length > 0 ? request.driver : [''],
        helper: request.helper && request.helper.length > 0 ? request.helper : [''],
        totalBudget: '',
        isLoading: false,
      });
      
      await fetchRequests();
=======
      await axios.put(`/api/delivery-requests/${request._id}/approve`, {
        reviewedBy: 'Admin',
      });
      toast.success('Request approved — delivery created successfully');
      await fetchRequests();
      setConfirmDialog({ isOpen: false, request: null, isLoading: false });
      setDetailsModal({ isOpen: false, request: null });
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve request');
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

<<<<<<< HEAD
  // Handle approve with change
  const handleApproveWithChange = async () => {
    const { request, selectedVehicle } = approveWithChangeModal;
    if (!selectedVehicle) {
      toast.error('Please select a vehicle');
      return;
    }
    setApproveWithChangeModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const { data } = await axios.put(`/api/delivery-requests/${request._id}/approve`, {
        reviewedBy: user?.department || 'Logistics Department',
        vehicleEquipment: selectedVehicle,
      });
      
      console.log('Approve with change response:', data);
      
      // Check if we need to show combine confirmation
      if (data.needsCombineConfirmation) {
        console.log('Showing combine modal with deliveries:', data.existingDeliveries);
        setApproveWithChangeModal({ isOpen: false, request: null, selectedVehicle: '', isLoading: false });
        setCombineModal({
          isOpen: true,
          request: request,
          existingDeliveries: data.existingDeliveries,
          selectedDeliveryId: data.existingDeliveries[0]?._id || '',
          isLoading: false,
          newVehicle: selectedVehicle,
        });
        return;
      }
      
      const originalVehicle = request.vehicleEquipment;
      const vehicleInfo = vehicles.find(v => v.plateNumber === originalVehicle);
      const newVehicleInfo = vehicles.find(v => v.plateNumber === selectedVehicle);
      
      toast.success(
        data.combined 
          ? `Request combined with delivery ${data.delivery.referenceNo}. Vehicle changed from ${originalVehicle}${vehicleInfo ? ` (${vehicleInfo.model})` : ''} to ${selectedVehicle}${newVehicleInfo ? ` (${newVehicleInfo.model})` : ''}.`
          : `Request approved! Vehicle changed from ${originalVehicle}${vehicleInfo ? ` (${vehicleInfo.model})` : ''} to ${selectedVehicle}${newVehicleInfo ? ` (${newVehicleInfo.model})` : ''}. User will be notified.`
      );
      
      setApproveWithChangeModal({ isOpen: false, request: null, selectedVehicle: '', isLoading: false });
      setDetailsModal({ isOpen: false, request: null });
      
      // Open personnel assignment modal
      setPersonnelModal({
        isOpen: true,
        deliveryId: data.deliveryId,
        request: request,
        driver: request.driver && request.driver.length > 0 ? request.driver : [''],
        helper: request.helper && request.helper.length > 0 ? request.helper : [''],
        totalBudget: '',
        isLoading: false,
      });
      
      await fetchRequests();
    } catch (error) {
      console.error('Error approving with change:', error);
      toast.error(error.response?.data?.message || 'Failed to approve request');
      setApproveWithChangeModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

=======
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
  // Handle decline
  const handleDecline = async () => {
    const { request, reason } = declineModal;
    if (!reason.trim()) {
      toast.error('Decline reason is required');
      return;
    }
    setDeclineModal((prev) => ({ ...prev, isLoading: true }));

    try {
      await axios.put(`/api/delivery-requests/${request._id}/decline`, {
        declineReason: reason,
<<<<<<< HEAD
        reviewedBy: user?.department || 'Logistics Department',
=======
        reviewedBy: 'Admin',
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
      });
      toast.success('Request declined');
      await fetchRequests();
      setDeclineModal({ isOpen: false, request: null, reason: '', isLoading: false });
      setDetailsModal({ isOpen: false, request: null });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to decline request');
      setDeclineModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

<<<<<<< HEAD
  // Handle personnel assignment
  const handleAssignPersonnel = async () => {
    const { deliveryId, driver, helper, totalBudget } = personnelModal;
    
    const filteredDriver = driver.filter(d => d.trim() !== '');
    const filteredHelper = helper.filter(h => h.trim() !== '');
    
    setPersonnelModal((prev) => ({ ...prev, isLoading: true }));

    try {
      await axios.put(`/api/deliveries/${deliveryId}/assign-personnel`, {
        driver: filteredDriver,
        helper: filteredHelper,
        totalBudget: totalBudget ? Number(totalBudget) : 0,
      });
      
      toast.success('Driver, helper, and budget assigned successfully');
      await fetchRequests();
      setPersonnelModal({ isOpen: false, deliveryId: null, request: null, driver: [''], helper: [''], totalBudget: '', isLoading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign personnel');
      setPersonnelModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const addDriverField = () => {
    setPersonnelModal((prev) => ({ ...prev, driver: [...prev.driver, ''] }));
  };

  const addHelperField = () => {
    setPersonnelModal((prev) => ({ ...prev, helper: [...prev.helper, ''] }));
  };

  const removeDriverField = (index) => {
    setPersonnelModal((prev) => ({ ...prev, driver: prev.driver.filter((_, i) => i !== index) }));
  };

  const removeHelperField = (index) => {
    setPersonnelModal((prev) => ({ ...prev, helper: prev.helper.filter((_, i) => i !== index) }));
  };

  const handleDriverChange = (index, value) => {
    setPersonnelModal((prev) => {
      const newDriver = [...prev.driver];
      newDriver[index] = value;
      return { ...prev, driver: newDriver };
    });
  };

  const handleHelperChange = (index, value) => {
    setPersonnelModal((prev) => {
      const newHelper = [...prev.helper];
      newHelper[index] = value;
      return { ...prev, helper: newHelper };
    });
  };

  // Handle combine with existing delivery
  const handleCombineDelivery = async () => {
    const { request, selectedDeliveryId, newVehicle } = combineModal;
    if (!selectedDeliveryId) {
      toast.error('Please select a delivery to combine with');
      return;
    }

    setCombineModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const payload = {
        reviewedBy: user?.department || 'Logistics Department',
        combineWithExisting: true,
        existingDeliveryId: selectedDeliveryId,
      };

      if (newVehicle) {
        payload.vehicleEquipment = newVehicle;
      }

      const { data } = await axios.put(`/api/delivery-requests/${request._id}/approve`, payload);

      toast.success(`Request combined with delivery ${data.delivery.referenceNo}`);
      setCombineModal({ isOpen: false, request: null, existingDeliveries: [], selectedDeliveryId: '', isLoading: false });
      setDetailsModal({ isOpen: false, request: null });

      // Open personnel assignment modal
      setPersonnelModal({
        isOpen: true,
        deliveryId: data.deliveryId,
        request: request,
        driver: request.driver && request.driver.length > 0 ? request.driver : [''],
        helper: request.helper && request.helper.length > 0 ? request.helper : [''],
        totalBudget: '',
        isLoading: false,
      });

      await fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to combine delivery');
      setCombineModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Handle create separate delivery
  const handleCreateSeparate = async () => {
    const { request, newVehicle } = combineModal;
    setCombineModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const payload = {
        reviewedBy: user?.department || 'Logistics Department',
        createSeparate: true,
      };

      if (newVehicle) {
        payload.vehicleEquipment = newVehicle;
      }

      const { data } = await axios.put(`/api/delivery-requests/${request._id}/approve`, payload);

      toast.success('Request approved as separate delivery');
      setCombineModal({ isOpen: false, request: null, existingDeliveries: [], selectedDeliveryId: '', isLoading: false });
      setDetailsModal({ isOpen: false, request: null });

      // Open personnel assignment modal
      setPersonnelModal({
        isOpen: true,
        deliveryId: data.deliveryId,
        request: request,
        driver: request.driver && request.driver.length > 0 ? request.driver : [''],
        helper: request.helper && request.helper.length > 0 ? request.helper : [''],
        totalBudget: '',
        isLoading: false,
      });

      await fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create delivery');
      setCombineModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

=======
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center shrink-0">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Delivery Requests</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Review and manage delivery requests from users
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters & Table Card */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {/* Search & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center border-b border-border p-4 bg-muted/20 shrink-0">
          <div className="relative max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs bg-background pl-8"
            />
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 bg-background">
                <i className='bx bx-check-circle text-sm'></i>
                <span className="text-[10px]">
                  Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </span>
                {statusFilter === 'Pending' && pendingCount > 0 && (
                  <span className="ml-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-[10px]">
              <DropdownMenuLabel className="text-[10px]">Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { key: 'all', label: 'All' },
                { key: 'Pending', label: 'Pending' },
                { key: 'Approved', label: 'Approved' },
<<<<<<< HEAD
                { key: 'Approved with Changes', label: 'Approved with Changes' },
=======
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
                { key: 'Declined', label: 'Declined' },
              ].map((tab) => (
                <DropdownMenuCheckboxItem
                  key={tab.key}
                  className="text-[10px] flex justify-between"
                  checked={statusFilter === tab.key}
                  onCheckedChange={() => setStatusFilter(tab.key)}
                >
                  <span className="flex-1">{tab.label}</span>
                  {tab.key === 'Pending' && pendingCount > 0 && (
                    <span className="ml-2 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {filteredRequests.length > 0 ? (
            <table className="w-full min-w-[800px] border-collapse relative">
              <thead className="sticky top-0 z-10 bg-orange-500 backdrop-blur shadow-sm">
                <tr className="border-b border-orange-600/20">
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Ref No</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Date Submitted</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle">Status</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Delivery Type</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Delivery Date</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Duration</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Purpose</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Activity</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Vehicle</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Destination</th>
<<<<<<< HEAD
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle">Job Order No</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Customer / Supplier</th>
=======
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Driver</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Helper</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle">Job Order No</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Customer / Supplier</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right pr-6 align-middle">Total Budget</th>
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
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
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-tight align-middle">{req.referenceNo || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-muted-foreground align-middle">{formatDate(req.createdAt)}</td>
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
<<<<<<< HEAD
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">
                        {(() => {
                          const plate = req.vehicleEquipment;
                          if (!plate) return '—';
                          const v = vehicles.find((v) => v.plateNumber === plate);
                          return v ? `${v.plateNumber} — ${v.model}` : plate;
                        })()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight align-middle">
                        {(req.destination || []).filter(Boolean).join(', ') || '—'}
                      </td>
=======
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight align-middle">{req.vehicleEquipment || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight align-middle">
                        {(req.destination || []).filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight align-middle">
                        {(req.driver || []).filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight align-middle">
                        {(req.helper || []).filter(Boolean).join(', ') || '—'}
                      </td>
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight text-center align-middle">
                        {(req.jobOrderNo || []).filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight align-middle">
                        {(req.customerSupplier || []).filter(Boolean).join(' / ') || '—'}
                      </td>
<<<<<<< HEAD
=======
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-wider text-right pr-6 align-middle">
                        {req.totalBudget ? Number(req.totalBudget).toLocaleString() : '0'}
                      </td>
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase text-foreground align-middle">{req.requestedBy || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-xs font-semibold text-muted-foreground">No requests found</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                {statusFilter !== 'all' ? `No ${statusFilter.toLowerCase()} requests` : 'No delivery requests have been submitted yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Details Modal ─── */}
      {detailsModal.isOpen && detailsModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
<<<<<<< HEAD
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-lg border border-border bg-card shadow-xl overflow-hidden">
=======
          <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-lg border border-border bg-card shadow-xl overflow-hidden">
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3 shrink-0">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Request Details</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  <span className="font-bold text-primary">{detailsModal.request.referenceNo}</span> • {detailsModal.request.deliveryType} • Submitted {formatDateTime(detailsModal.request.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setDetailsModal({ isOpen: false, request: null })}
                className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Status badge */}
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
                <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Decline Reason</p>
                    <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">{detailsModal.request.declineReason}</p>
                  </div>
                </div>
              )}

              {/* Detail fields */}
              {[
                { label: 'Reference No', value: detailsModal.request.referenceNo },
                { label: 'Delivery Type', value: detailsModal.request.deliveryType },
                { label: 'Date From', value: formatDate(detailsModal.request.dateFrom) },
                { label: 'Date To', value: formatDate(detailsModal.request.dateTo) },
                { label: 'Duration', value: computeDuration(detailsModal.request.dateFrom, detailsModal.request.dateTo) },
<<<<<<< HEAD
                { label: 'Vehicle', value: (() => {
                  const plate = detailsModal.request.vehicleEquipment;
                  if (!plate) return '—';
                  const v = vehicles.find((v) => v.plateNumber === plate);
                  return v ? `${v.plateNumber} — ${v.model}` : plate;
                })() },
=======
                { label: 'Vehicle', value: detailsModal.request.vehicleEquipment },
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
                { label: 'Purpose', value: (detailsModal.request.purpose || []).filter(Boolean).join(' / ') },
                { label: 'Activity', value: (detailsModal.request.activity || []).filter(Boolean).join(' / ') },
                { label: 'Destination', value: (detailsModal.request.destination || []).filter(Boolean).join(' / ') },
                { label: 'Customer / Supplier', value: (detailsModal.request.customerSupplier || []).filter(Boolean).join(' / ') },
<<<<<<< HEAD
                { label: 'Job Order No.', value: (detailsModal.request.jobOrderNo || []).filter(Boolean).join(' / ') },
=======
                { label: 'Driver', value: (detailsModal.request.driver || []).filter(Boolean).join(' / ') },
                { label: 'Helper', value: (detailsModal.request.helper || []).filter(Boolean).join(' / ') },
                { label: 'Job Order No.', value: (detailsModal.request.jobOrderNo || []).filter(Boolean).join(' / ') },
                { label: 'Total Budget', value: detailsModal.request.totalBudget ? `₱${Number(detailsModal.request.totalBudget).toLocaleString()}` : '—' },
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
                { label: 'Requested By', value: detailsModal.request.requestedBy },
              ].map((field) => (
                <div key={field.label} className="flex items-start gap-2 text-[11px]">
                  <span className="w-[130px] shrink-0 font-bold uppercase tracking-wider text-muted-foreground text-[9px] pt-0.5">
                    {field.label}
                  </span>
                  <span className="font-semibold text-foreground uppercase">
                    {field.value || '—'}
                  </span>
                </div>
              ))}

              {detailsModal.request.reviewedBy && (
                <div className="pt-2 border-t border-border space-y-1">
                  <div className="flex items-start gap-2 text-[11px]">
                    <span className="w-[130px] shrink-0 font-bold uppercase tracking-wider text-muted-foreground text-[9px] pt-0.5">Reviewed By</span>
                    <span className="font-semibold text-foreground uppercase">{detailsModal.request.reviewedBy}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px]">
                    <span className="w-[130px] shrink-0 font-bold uppercase tracking-wider text-muted-foreground text-[9px] pt-0.5">Reviewed At</span>
                    <span className="font-semibold text-foreground uppercase">{formatDateTime(detailsModal.request.reviewedAt)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Action Footer for pending requests */}
            {detailsModal.request.requestStatus === 'Pending' && (
              <div className="sticky bottom-0 z-10 border-t border-border bg-card p-4 flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setConfirmDialog({ isOpen: true, request: detailsModal.request, isLoading: false })}
<<<<<<< HEAD
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => setApproveWithChangeModal({ isOpen: true, request: detailsModal.request, selectedVehicle: detailsModal.request.vehicleEquipment || '', isLoading: false })}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Truck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Approve w/ Change</span>
                  <span className="sm:hidden">w/ Change</span>
                </button>
                <button
                  onClick={() => setDeclineModal({ isOpen: true, request: detailsModal.request, reason: '', isLoading: false })}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-red-600 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-red-700 transition-colors shadow-sm"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Decline
=======
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve Request
                </button>
                <button
                  onClick={() => setDeclineModal({ isOpen: true, request: detailsModal.request, reason: '', isLoading: false })}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-red-600 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-red-700 transition-colors shadow-sm"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Decline Request
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Approve Confirmation Dialog ─── */}
      {confirmDialog.isOpen && confirmDialog.request && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card shadow-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">Approve Request</h3>
                <p className="text-[11px] text-muted-foreground">
                  This will create a new delivery from this request.
                </p>
              </div>
            </div>

            <div className="rounded-md bg-muted/30 border border-border p-3 mb-4 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Request Summary</div>
              <div className="text-[11px] font-semibold text-foreground uppercase">
                {confirmDialog.request.deliveryType} — {(confirmDialog.request.destination || []).join(', ') || 'No destination'}
              </div>
              <div className="text-[10px] text-muted-foreground">
                By {confirmDialog.request.requestedBy || '—'} • {formatDate(confirmDialog.request.dateFrom)}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, request: null, isLoading: false })}
                disabled={confirmDialog.isLoading}
                className="px-3 py-1.5 rounded text-[11px] font-semibold text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={confirmDialog.isLoading}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {confirmDialog.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {confirmDialog.isLoading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Decline Modal ─── */}
      {declineModal.isOpen && declineModal.request && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card shadow-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">Decline Request</h3>
                <p className="text-[11px] text-muted-foreground">
                  Please provide a reason for declining this request.
                </p>
              </div>
            </div>

            <div className="rounded-md bg-muted/30 border border-border p-3 mb-4 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Request Summary</div>
              <div className="text-[11px] font-semibold text-foreground uppercase">
                {declineModal.request.deliveryType} — {(declineModal.request.destination || []).join(', ') || 'No destination'}
              </div>
              <div className="text-[10px] text-muted-foreground">
                By {declineModal.request.requestedBy || '—'} • {formatDate(declineModal.request.dateFrom)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                Reason for Decline <span className="text-red-500">*</span>
              </label>
              <textarea
                value={declineModal.reason}
                onChange={(e) => setDeclineModal((prev) => ({ ...prev, reason: e.target.value }))}
                className="block w-full rounded border border-input bg-background px-2.5 py-2 text-[11px] shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none resize-none"
                placeholder="Explain why this request is being declined..."
                rows={4}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeclineModal({ isOpen: false, request: null, reason: '', isLoading: false })}
                disabled={declineModal.isLoading}
                className="px-3 py-1.5 rounded text-[11px] font-semibold text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={declineModal.isLoading || !declineModal.reason.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {declineModal.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {declineModal.isLoading ? 'Declining...' : 'Decline Request'}
              </button>
            </div>
          </div>
        </div>
      )}
<<<<<<< HEAD

      {/* ─── Approve with Change Modal ─── */}
      {approveWithChangeModal.isOpen && approveWithChangeModal.request && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">Approve with Vehicle Change</h3>
                <p className="text-[11px] text-muted-foreground">
                  Select a different vehicle for this delivery.
                </p>
              </div>
            </div>

            <div className="rounded-md bg-muted/30 border border-border p-3 mb-4 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Request Summary</div>
              <div className="text-[11px] font-semibold text-foreground uppercase">
                {approveWithChangeModal.request.deliveryType} — {(approveWithChangeModal.request.destination || []).join(', ') || 'No destination'}
              </div>
              <div className="text-[10px] text-muted-foreground">
                By {approveWithChangeModal.request.requestedBy || '—'} • {formatDate(approveWithChangeModal.request.dateFrom)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                Original Vehicle
              </label>
              <div className="rounded border border-border bg-muted/20 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                {(() => {
                  const plate = approveWithChangeModal.request.vehicleEquipment;
                  if (!plate) return 'No vehicle selected';
                  const v = vehicles.find((v) => v.plateNumber === plate);
                  return v ? `${v.plateNumber} — ${v.model}` : plate;
                })()}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                New Vehicle <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={approveWithChangeModal.selectedVehicle}
                  onChange={(e) => setApproveWithChangeModal((prev) => ({ ...prev, selectedVehicle: e.target.value }))}
                  className="block w-full rounded border border-input bg-background px-3 py-2 text-[11px] font-semibold uppercase shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none appearance-none cursor-pointer"
                  autoFocus
                >
                  <option value="" disabled>Select Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v.plateNumber}>
                      {v.plateNumber} — {v.model}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setApproveWithChangeModal({ isOpen: false, request: null, selectedVehicle: '', isLoading: false })}
                disabled={approveWithChangeModal.isLoading}
                className="px-3 py-1.5 rounded text-[11px] font-semibold text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveWithChange}
                disabled={approveWithChangeModal.isLoading || !approveWithChangeModal.selectedVehicle}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {approveWithChangeModal.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {approveWithChangeModal.isLoading ? 'Approving...' : 'Approve with Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Personnel Assignment Modal ─── */}
      {personnelModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">Assign Driver & Helper</h3>
                <p className="text-[11px] text-muted-foreground">
                  Assign personnel to this approved delivery.
                </p>
              </div>
            </div>

            {/* Driver Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Driver(s)
                </label>
                <button
                  type="button"
                  onClick={addDriverField}
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add Driver
                </button>
              </div>
              <div className="space-y-2">
                {personnelModal.driver.map((dr, index) => (
                  <div key={`driver-${index}`} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={dr}
                        onChange={(e) => handleDriverChange(index, e.target.value)}
                        className="block w-full rounded border border-input bg-background px-3 py-2 text-[11px] font-semibold uppercase shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select Driver</option>
                        {personnels.filter(p => p.position === 'Driver').map((p) => (
                          <option key={p._id} value={`${p.firstname} ${p.lastname}`}>
                            {p.lastname}, {p.firstname}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    {personnelModal.driver.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDriverField(index)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Helper Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Helper(s)
                </label>
                <button
                  type="button"
                  onClick={addHelperField}
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add Helper
                </button>
              </div>
              <div className="space-y-2">
                {personnelModal.helper.map((hl, index) => (
                  <div key={`helper-${index}`} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={hl}
                        onChange={(e) => handleHelperChange(index, e.target.value)}
                        className="block w-full rounded border border-input bg-background px-3 py-2 text-[11px] font-semibold uppercase shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select Helper</option>
                        {personnels.filter(p => p.position === 'Helper').map((p) => (
                          <option key={p._id} value={`${p.firstname} ${p.lastname}`}>
                            {p.lastname}, {p.firstname}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    {personnelModal.helper.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHelperField(index)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Budget Section */}
            <div className="mb-4">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Total Budget
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground/60 select-none">
                  ₱
                </div>
                <input
                  type="number"
                  value={personnelModal.totalBudget}
                  onChange={(e) => setPersonnelModal(prev => ({ ...prev, totalBudget: e.target.value }))}
                  className="block w-full rounded border border-input bg-background pl-7 pr-3 py-2 text-[11px] font-semibold shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                  placeholder="Enter total budget"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button
                onClick={() => setPersonnelModal({ isOpen: false, deliveryId: null, request: null, driver: [''], helper: [''], totalBudget: '', isLoading: false })}
                disabled={personnelModal.isLoading}
                className="px-3 py-1.5 rounded text-[11px] font-semibold text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Skip for Now
              </button>
              <button
                onClick={handleAssignPersonnel}
                disabled={personnelModal.isLoading}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {personnelModal.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {personnelModal.isLoading ? 'Assigning...' : 'Assign Personnel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Combine Delivery Modal ─── */}
      {combineModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">Combine Delivery Plans</h3>
                <p className="text-[11px] text-muted-foreground">
                  There are existing delivery plans with the same vehicle and overlapping dates.
                </p>
              </div>
            </div>

            <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 px-3 py-2 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Current Request</p>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                <span className="font-bold">{combineModal.request?.referenceNo}</span> — {formatDate(combineModal.request?.dateFrom)}
                {combineModal.request?.dateTo && ` to ${formatDate(combineModal.request?.dateTo)}`}
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                Destinations: {(combineModal.request?.destination || []).join(', ')}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Select Existing Delivery to Combine With
              </label>
              <div className="space-y-2">
                {combineModal.existingDeliveries.map((delivery) => (
                  <label
                    key={delivery._id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      combineModal.selectedDeliveryId === delivery._id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <input
                      type="radio"
                      name="existingDelivery"
                      value={delivery._id}
                      checked={combineModal.selectedDeliveryId === delivery._id}
                      onChange={(e) => setCombineModal(prev => ({ ...prev, selectedDeliveryId: e.target.value }))}
                      className="mt-1 h-4 w-4 accent-primary cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-foreground">
                        {delivery.referenceNo} — {formatDate(delivery.dateFrom)}
                        {delivery.dateTo && ` to ${formatDate(delivery.dateTo)}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Destinations: {(delivery.destination || []).join(', ')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Requested by: {delivery.requestedBy}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 px-3 py-2 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                Note
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-300">
                Combining will merge destinations, purposes, activities, and job orders into the selected delivery plan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button
                onClick={() => setCombineModal({ isOpen: false, request: null, existingDeliveries: [], selectedDeliveryId: '', isLoading: false })}
                disabled={combineModal.isLoading}
                className="px-3 py-1.5 rounded text-[11px] font-semibold text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSeparate}
                disabled={combineModal.isLoading}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                {combineModal.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create Separate
              </button>
              <button
                onClick={handleCombineDelivery}
                disabled={combineModal.isLoading || !combineModal.selectedDeliveryId}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {combineModal.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {combineModal.isLoading ? 'Combining...' : 'Combine Deliveries'}
              </button>
            </div>
          </div>
        </div>
      )}
=======
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
    </div>
  );
}

export default RequestPage;
