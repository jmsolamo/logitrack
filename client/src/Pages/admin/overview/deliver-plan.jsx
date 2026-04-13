import { useState, useEffect, useMemo } from 'react';
import companyLogo from '../../../assets/images/logo.png';
import {
  Loader2,
  ClipboardList,
  Plus,
  X,
  ChevronDown,
  Columns,
  RotateCcw,
  Minus,
  Search,
  Eye,
  Printer,
  Pencil,
  Trash2
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../../../components/ui/dropdown-menu';
import { cn } from '../../../lib/utils';

// Column definitions
const tableColumns = [
  { key: 'referenceNo', label: 'Reference no.' },
  { key: 'status', label: 'Status' },
  { key: 'deliveryType', label: 'Delivery Type' },
  { key: 'dateRange', label: 'Date' },
  { key: 'duration', label: 'Duration' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'activity', label: 'Activity' },
  { key: 'vehicleEquipment', label: 'Vehicle' },
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
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [personnelFilter, setPersonnelFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(new Set(allColumnKeys));
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditSubmitLoading, setIsEditSubmitLoading] = useState(false);

  // Details Modal State
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    delivery: null
  });

  // Action Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    actionType: '',
    item: null,
    isLoading: false
  });

  // Status Modal State
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    delivery: null,
    departureDate: '',
    departureTime: '',
    customerSuppliers: [], // Array of {customerSupplier, arrivalDate, arrivalTime, departureDate, departureTime}
    returnDate: '',
    returnTime: '',
    isLoading: false
  });

  // Expenses Modal State
  const [expensesModal, setExpensesModal] = useState({
    isOpen: false,
    delivery: null,
    isLoading: false
  });

  const [expensesFormData, setExpensesFormData] = useState({
    fuel: [],
    tollFee: [],
    pierExpenses: [],
    repairAndMaintenance: [],
    mealExpenses: [],
    loadExpenses: [],
    contingency: []
  });

  const initialFormData = {
    deliveryType: '',
    dateFrom: '',
    dateTo: '',
    purpose: [''],
    activity: [''],
    vehicleEquipment: '',
    tnvsProvider: '',
    destination: [''],
    driver: [''],
    helper: [''],
    jobOrderNo: [''],
    customerSupplier: [''],
    totalBudget: '',
    requestedBy: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [newCustomers, setNewCustomers] = useState({});

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[name]];
      newArray[index] = value;
      return { ...prev, [name]: newArray };
    });
  };

  const addArrayField = (name) => {
    setFormData(prev => ({
      ...prev,
      [name]: [...prev[name], '']
    }));
  };

  const addPurposeAndActivity = () => {
    setFormData(prev => ({
      ...prev,
      purpose: [...prev.purpose, ''],
      activity: [...prev.activity, '']
    }));
  };

  const removeArrayField = (name, index) => {
    setFormData(prev => {
      const newArray = prev[name].filter((_, i) => i !== index);
      return { ...prev, [name]: newArray };
    });
  };

  const openModal = () => {
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormData);
    setNewCustomers({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);

    try {
      const processedCustomerSupplier = [...formData.customerSupplier];
      for (let i = 0; i < processedCustomerSupplier.length; i++) {
        if (processedCustomerSupplier[i] === 'NEW_CUSTOMER' && newCustomers[i]) {
          const newName = newCustomers[i].trim();
          processedCustomerSupplier[i] = newName;
          try {
            await axios.post('/api/destinations', { name: newName });
          } catch (e) {
            // Ignore if already exists
          }
        }
      }

      const payload = {
        deliveryType: formData.deliveryType,
        dateFrom: formData.dateFrom || undefined,
        dateTo: formData.dateTo || undefined,
        purpose: formData.purpose.filter(v => v.trim() !== ''),
        activity: formData.activity.filter(v => v.trim() !== ''),
        vehicleEquipment: formData.vehicleEquipment,
        tnvsProvider: formData.vehicleEquipment === 'RENT_VEHICLE' ? formData.tnvsProvider : undefined,
        destination: formData.destination.filter(v => v.trim() !== ''),
        driver: formData.driver.filter(v => v.trim() !== ''),
        helper: formData.helper.filter(v => v.trim() !== ''),
        jobOrderNo: formData.jobOrderNo.filter(v => v.trim() !== ''),
        customerSupplier: processedCustomerSupplier.filter(v => v.trim() !== ''),
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
    setStatusFilter('Pending');
    setDateFromFilter('');
    setDateToFilter('');
    setPurposeFilter('all');
    setVehicleFilter('all');
    setDestinationFilter('all');
    setPersonnelFilter('all');
    toast.success('Filters cleared');
  };

  // --- Status Update Logic ---
  const getDeliveryProgress = (delivery) => {
    const customerSuppliers = delivery.customerSupplier || [];
    const timeline = delivery.timeline || [];

    if (customerSuppliers.length === 0) return { step: 0, total: 0, isComplete: true };

    // 1 departure from Enertech + 1 arrival per customer/supplier + 1 departure from last + 1 arrival back to Enertech
    const totalSteps = 1 + customerSuppliers.length + 1 + 1;
    const currentStep = timeline.length;

    return {
      step: currentStep,
      total: totalSteps,
      isComplete: currentStep >= totalSteps,
      customerSuppliers
    };
  };

  const getStatusDisplay = (delivery) => {
    const progress = getDeliveryProgress(delivery);
    if (progress.isComplete) return 'Completed';
    if (progress.step === 0) return 'Pending';
    return 'In Transit';
  };

  const openStatusModal = (delivery) => {
    const progress = getDeliveryProgress(delivery);
    if (progress.isComplete) return;

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const localDateTime = now.toISOString().slice(0, 16);
    const [localDate, localTime] = localDateTime.split('T');

    // Initialize customerSuppliers array with empty values
    const customerSuppliersData = (delivery.customerSupplier || []).map(cs => ({
      customerSupplier: cs,
      arrivalDate: localDate,
      arrivalTime: localTime,
      departureDate: localDate,
      departureTime: localTime
    }));

    setStatusModal({
      isOpen: true,
      delivery,
      departureDate: localDate,
      departureTime: localTime,
      customerSuppliers: customerSuppliersData,
      returnDate: localDate,
      returnTime: localTime,
      isLoading: false
    });
  };

  const closeStatusModal = () => {
    setStatusModal({
      isOpen: false,
      delivery: null,
      departureDate: '',
      departureTime: '',
      customerSuppliers: [],
      returnDate: '',
      returnTime: '',
      isLoading: false
    });
  };

  const openDetailsModal = (delivery) => {
    setIsEditingDetails(false);
    setDetailsModal({ isOpen: true, delivery });
  };

  const closeDetailsModal = () => {
    setDetailsModal({ isOpen: false, delivery: null });
  };

  const openEditMode = (delivery) => {
    setFormData({
      deliveryType: delivery.deliveryType || '',
      dateFrom: delivery.dateFrom ? delivery.dateFrom.split('T')[0] : '',
      dateTo: delivery.dateTo ? delivery.dateTo.split('T')[0] : '',
      purpose: delivery.purpose?.length ? delivery.purpose : [''],
      activity: delivery.activity?.length ? delivery.activity : [''],
      vehicleEquipment: delivery.vehicleEquipment || '',
      tnvsProvider: delivery.tnvsProvider || '',
      destination: delivery.destination?.length ? delivery.destination : [''],
      driver: delivery.driver?.length ? delivery.driver : [''],
      helper: delivery.helper?.length ? delivery.helper : [''],
      jobOrderNo: delivery.jobOrderNo?.length ? delivery.jobOrderNo : [''],
      customerSupplier: delivery.customerSupplier?.length ? delivery.customerSupplier : [''],
      totalBudget: delivery.totalBudget || '',
      requestedBy: delivery.requestedBy || ''
    });
    setIsEditingDetails(true);
    setDetailsModal({ isOpen: true, delivery });
  };

  const handleDelete = (delivery) => {
    setConfirmDialog({
      isOpen: true,
      title: 'DELETE DELIVERY',
      description: `Are you sure you want to delete delivery ${delivery.referenceNo}? This action cannot be undone.`,
      actionType: 'delete',
      item: delivery,
      isLoading: false
    });
  };

  const confirmDelete = async () => {
    const delivery = confirmDialog.item;
    setConfirmDialog(prev => ({ ...prev, isLoading: true }));
    try {
      await axios.delete(`/api/deliveries/${delivery._id}`);
      toast.success(`Delivery ${delivery.referenceNo} deleted successfully`);
      const response = await axios.get('/api/deliveries');
      setDeliveries(response.data);
      setConfirmDialog({ isOpen: false, title: '', description: '', actionType: '', item: null, isLoading: false });
    } catch (error) {
      console.error('Error deleting delivery:', error);
      toast.error(error.response?.data?.message || 'Failed to delete delivery');
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  // --- Field Trip Report Print ---
  const printFieldTripReport = (delivery) => {
    const date = delivery.dateFrom
      ? new Date(delivery.dateFrom).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
      : '_________________';

    const employees = [
      ...(delivery.driver || []),
      ...(delivery.helper || [])
    ].filter(Boolean);

    const plate = delivery.vehicleEquipment || '';
    const vObj = vehicles.find(v => v.plateNumber === plate);
    const vehicleStr = vObj ? `${plate} - ${vObj.model}` : plate;

    const dests = delivery.destination || [];
    const supps = delivery.customerSupplier || [];
    const jobs = delivery.jobOrderNo || [];
    const acts = delivery.activity || [];
    const rows = Math.max(dests.length, supps.length, jobs.length, acts.length, 1);

    // Build employee rows — first 4 share rows with guard/driver info, rest are extra
    const rightColInfo = [
      `<td colspan="2" class="no-border italic">To be filled up by Guard on Duty:</td><td colspan="3" class="no-border bold italic">For Drivers Only:</td>`,
      `<td colspan="2" class="no-border indent no-wrap">Time Out (From Shop):</td><td colspan="3" class="no-border">Vehicle: ${vehicleStr.toUpperCase()}</td>`,
      `<td colspan="2" class="no-border indent no-wrap">Time In (Back to Shop):</td><td colspan="3" class="no-border no-wrap">Gas Gauge: Out: ________ In: ________</td>`,
      `<td colspan="2" class="no-border">&nbsp;</td><td colspan="3" class="no-border no-wrap">Km. Reading: Start ________ End ________</td>`,
    ];

    const totalEmpRows = Math.max(employees.length, 4);
    let employeeRowsHtml = `<tr>
      <td colspan="2" class="no-border no-wrap">Name of Employee(s):</td>
      <td colspan="2" class="no-border">&nbsp;</td>
      <td colspan="3" class="no-border right no-wrap">Date: ${date}</td>
    </tr>`;

    for (let i = 0; i < totalEmpRows; i++) {
      const empLabel = employees[i] ? `${i + 1}. ${employees[i].toUpperCase()}` : `${i + 1}.`;
      const rightCol = rightColInfo[i] || `<td colspan="2" class="no-border">&nbsp;</td><td colspan="3" class="no-border">&nbsp;</td>`;
      const isLast = i === totalEmpRows - 1;
      employeeRowsHtml += `<tr>
        <td colspan="2" class="no-border" ${isLast ? 'style="padding-bottom:8px"' : ''}>${empLabel}</td>
        ${rightCol}
      </tr>`;
    }

    let detailRows = '';
    for (let i = 0; i < rows; i++) {
      detailRows += `<tr>
        <td>&nbsp;${(dests[i] || '').toUpperCase()}</td>
        <td>&nbsp;${(supps[i] || '').toUpperCase()}</td>
        <td>&nbsp;${(jobs[i] || '').toUpperCase()}</td>
        <td>&nbsp;${(acts[i] || '').toUpperCase()}</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
      </tr>`;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Field Trip Report</title>
<style>
  @page { margin: 0.25cm; }
  body { font-family: "Times New Roman", serif; font-size: 10pt; margin: 0.25cm; color: black; line-height: 1.15; display: flex; flex-direction: column; align-items: center; }
  .header { text-align: center; margin-bottom: 5px; width: 100%; }
  .header b { display: block; font-size: 10pt; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0 auto; }
  td { border: 1px solid black; padding: 4px 5px; vertical-align: top; font-size: 10pt; word-wrap: break-word; height: auto; }
  .no-border { border: none !important; }
  .table-header td { text-align: center; vertical-align: middle; font-weight: bold; white-space: nowrap; }
  .no-wrap { white-space: nowrap; }
  .right { text-align: right; }
  .italic { font-style: italic; }
  .bold { font-weight: bold; }
  .indent { padding-left: 20px; }
  .signature-label-top { text-align: left; vertical-align: top; padding-top: 5px; padding-bottom: 15px; }
  .signature-title-row td { text-align: left; vertical-align: top; padding-top: 2px; padding-bottom: 5px; }
  .sig-line { border-top: 1px solid black; width: 67.5%; display: block; margin-bottom: 2px; }
</style>
</head>
<body>
<div class="header">
  <b>ENERTECH SYSTEMS INDUSTRIES, INC.</b>
  <span>3855 Technology Rd., Prenza II, Marilao, Bulacan</span><br>
  <b>FIELD TRIP REPORT</b>
</div>
<table>
  <colgroup>
    <col style="width:15%"><col style="width:18%"><col style="width:8%">
    <col style="width:25%"><col style="width:8%"><col style="width:8%"><col style="width:18%">
  </colgroup>
  ${employeeRowsHtml}
  <tr class="table-header">
    <td rowspan="2">Destination</td>
    <td rowspan="2">Supplier / Customer</td>
    <td rowspan="2">J.O. #</td>
    <td rowspan="2">Purpose / Job Assignment</td>
    <td colspan="2">Time</td>
    <td rowspan="2">Remarks</td>
  </tr>
  <tr class="table-header"><td>IN</td><td>OUT</td></tr>
  ${detailRows}
  <tr>
    <td colspan="2" class="no-border signature-label-top">Prepared by:</td>
    <td colspan="2" class="no-border signature-label-top">Approved by:</td>
    <td colspan="3" class="no-border signature-label-top">Noted by:</td>
  </tr>
  <tr class="signature-title-row">
    <td colspan="2" class="no-border"><span class="sig-line"></span>Employee</td>
    <td colspan="2" class="no-border"><span class="sig-line"></span>Department Head</td>
    <td colspan="3" class="no-border"><span class="sig-line"></span>HRD</td>
  </tr>
</table>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.onload = () => { w.focus(); w.print(); };
    }
  };
  // --- End Field Trip Report Print ---

  // --- Print Logic ---
  const handlePrint = (delivery) => {
    if (!delivery) return;

    if (delivery.deliveryType === 'Field Trip') {
      printFieldTripReport(delivery);
      return;
    }

    const toBase64 = (url) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext('2d').drawImage(img, 0, 0);
          resolve(c.toDataURL('image/png'));
        };
        img.onerror = () => resolve('');
        img.src = url;
      });

    toBase64(companyLogo).then((logoB64) => {
      // --- Data ---
      const date = delivery.dateFrom
        ? new Date(delivery.dateFrom).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
        : '';
      const driverName = (delivery.driver || []).filter(Boolean).map(n => n.toUpperCase()).join(' / ');
      const helperName = (delivery.helper || []).filter(Boolean).map(n => n.toUpperCase()).join(' / ');
      const plate = delivery.vehicleEquipment || '';
      const vObj = vehicles.find(v => v.plateNumber === plate);
      const vehicleStr = vObj ? `${plate} - ${vObj.model}`.toUpperCase() : plate.toUpperCase();
      const budget = delivery.totalBudget ? Number(delivery.totalBudget).toLocaleString() : '';
      const reqBy = (delivery.requestedBy || '').toUpperCase();

      const dests = delivery.destination || [];
      const supps = delivery.customerSupplier || [];
      const jobs = delivery.jobOrderNo || [];
      const purps = delivery.purpose || [];
      const acts = delivery.activity || [];
      const rows = Math.max(dests.length, supps.length, jobs.length, purps.length, acts.length, 4);

      let detailRows = '';
      const formatTs = (ts) => {
        if (!ts) return { top: '', bottom: '' };
        const d = new Date(ts);
        return {
          top: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
          bottom: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        };
      };

      for (let i = 0; i < rows; i++) {
        let etdTop = '', etdBottom = '';
        let etaTop = '', etaBottom = '';

        if (delivery.timeline && delivery.timeline.length > 0) {
          let depEvent, arrEvent;

          if (i === 0) {
            // Outbound: Enertech → First destination
            depEvent = delivery.timeline.find(t => t.type === 'departure' && t.destinationIndex === -1);
            arrEvent = delivery.timeline.find(t => t.type === 'arrival' && t.destinationIndex === 0);
          } else if (i > 0 && i < dests.length) {
            // Intermediate/subsequent destination: show arrival AT and departure FROM this destination
            depEvent = delivery.timeline.find(t => t.type === 'departure' && t.destinationIndex === i);
            arrEvent = delivery.timeline.find(t => t.type === 'arrival' && t.destinationIndex === i);
          } else if (i === dests.length) {
            // Return row: arrive back at Enertech
            // Only show departure if single destination (otherwise it was already shown on the last dest row)
            if (dests.length === 1) {
              depEvent = delivery.timeline.find(t => t.type === 'departure' && t.destinationIndex === 0);
            }
            arrEvent = delivery.timeline.find(t => t.type === 'arrival' && t.destinationIndex === -1);
          }

          if (depEvent) {
            const f = formatTs(depEvent.timestamp);
            etdTop = f.top; etdBottom = f.bottom;
          }
          if (arrEvent) {
            const f = formatTs(arrEvent.timestamp);
            etaTop = f.top; etaBottom = f.bottom;
          }
        }

        detailRows += `<tr>
          <td style="width:3.12cm;text-align:center;vertical-align:middle;">${(dests[i] || '').toUpperCase()}</td>
          <td style="width:3.5cm;text-align:center;vertical-align:middle;">${(supps[i] || '').toUpperCase()}</td>
          <td style="width:1.64cm;text-align:center;vertical-align:middle;">${(jobs[i] || '').toUpperCase()}</td>
          <td style="width:4.76cm;text-align:center;vertical-align:middle;">
            ${(acts[i] || '').toUpperCase()}
          </td>
          <td style="width:1.27cm;padding:0;text-align:center;vertical-align:middle;">
             <div style="height:0.5cm; display:flex; align-items:center; justify-content:center;">${etdTop}</div>
             <div style="height:0.5cm; display:flex; align-items:center; justify-content:center;">${etdBottom}</div>
          </td>
          <td style="width:1.27cm;padding:0;text-align:center;vertical-align:middle;">
             <div style="height:0.5cm; display:flex; align-items:center; justify-content:center;">${etaTop}</div>
             <div style="height:0.5cm; display:flex; align-items:center; justify-content:center;">${etaBottom}</div>
          </td>
          <td style="width:1.31cm;text-align:center;vertical-align:middle;"></td>
          <td style="width:2.49cm;text-align:center;vertical-align:middle;"></td>
        </tr>`;
      }

      // --- HTML Document ---
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Driver's Delivery Plan</title>
<style>
  @page {
    size: 8.5in 11in;
    margin: 0.5cm;
  }
  @media print {
    html, body { margin: 0; padding: 0; }
    .no-print { display: none !important; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9pt;
    color: #000;
    background: #fff;
  }

  /* ---------- HEADER ---------- */
  .doc-header {
    text-align: center;
    padding-bottom: 4pt;
  }
  .doc-header img {
    width: 6.24cm;
    height: 1.32cm;
    object-fit: contain;
    display: inline-block;
  }
  .doc-header .title {
    font-size: 9pt;
    font-weight: bold;
    line-height: 1.5;
  }

  /* ---------- TABLES ---------- */
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  /* Info section */
  .info-tbl td {
    border: 1pt solid #000;
    height: 1cm;
    padding: 1pt 4pt;
    font-size: 9pt;
    vertical-align: top;
    overflow: hidden;
  }
  .lbl {
    font-weight: bold;
    font-size: 9pt;
  }
  .val {
    font-weight: bold;
    font-size: 9pt;
  }

  /* Detail section */
  .detail-tbl { margin-top: -1pt; }
  .detail-tbl th {
    border: 1pt solid #000;
    height: 1cm;
    padding: 1pt 2pt;
    font-size: 9pt;
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
  }
  .detail-tbl td {
    border: 1pt solid #000;
    height: 1cm;
    padding: 1pt 2pt;
    font-size: 9pt;
    font-weight: bold;
    vertical-align: middle;
  }
</style>
</head>
<body>

<div class="doc-header">
  ${logoB64 ? `<img src="${logoB64}" alt="Enertech Logo"><br>` : ''}
  <div class="title">LOGISTICS DEPARTMENT</div>
  <div class="title">DRIVER'S DELIVERY PLAN</div>
</div>

<!-- Row 1: Delivery Date | Name of Driver | Name of Helper -->
<table class="info-tbl">
  <colgroup>
    <col style="width:5.4cm">
    <col style="width:7.3cm">
    <col style="width:6.66cm">
  </colgroup>
  <tr>
    <td><span class="lbl">Delivery Date:</span><br><span class="val">${date}</span></td>
    <td><span class="lbl">Name of Driver:</span><br><span class="val">${driverName}</span></td>
    <td><span class="lbl">Name of Helper:</span><br><span class="val">${helperName}</span></td>
  </tr>
</table>

<!-- Row 2: Vehicle | Gauge In | Gauge Out | Total Budget | Request by -->
<table class="info-tbl" style="margin-top:-1pt">
  <colgroup>
    <col style="width:5.4cm">
    <col style="width:2.54cm">
    <col style="width:2.54cm">
    <col style="width:4.12cm">
    <col style="width:4.76cm">
  </colgroup>
  <tr>
    <td><span class="lbl">Vehicle:</span><br><span class="val">${vehicleStr}</span></td>
    <td><span class="lbl">Gauge In:</span></td>
    <td><span class="lbl">Gauge Out:</span></td>
    <td><span class="lbl">Total Budget:</span><br><span class="val">${budget}</span></td>
    <td><span class="lbl">Request by:</span><br><span class="val">${reqBy}</span></td>
  </tr>
</table>

<!-- Detail table -->
<table class="detail-tbl" style="margin-top:-1pt">
  <colgroup>
    <col style="width:3.12cm">
    <col style="width:3.5cm">
    <col style="width:1.64cm">
    <col style="width:4.76cm">
    <col style="width:1.27cm">
    <col style="width:1.27cm">
    <col style="width:1.31cm">
    <col style="width:2.49cm">
  </colgroup>
  <thead>
    <tr>
      <th>Destination</th>
      <th>Supplier/Customer</th>
      <th>JO#</th>
      <th>Purpose</th>
      <th>ETD</th>
      <th>ETA</th>
      <th>Total Km.</th>
      <th>DE#</th>
    </tr>
  </thead>
  <tbody>
    ${detailRows}
  </tbody>
</table>

<!-- SIGNATURE BLOCK -->
<div style="margin-top: 0.5cm; display: flex; justify-content: space-between; font-weight: bold; font-size: 9pt;">
  
  <!-- Prepared by -->
  <div style="width: 4.5cm;">
    <div style="text-align: left; margin-bottom: 1cm;">Prepared by:</div>
    <div style="border-top: 1px solid #000; padding-top: 4pt; text-align: center;">Dispatcher</div>
  </div>
  
  <!-- Acknowledge by -->
  <div>
    <div style="text-align: center; margin-bottom: 1cm;">Acknowledge by:</div>
    <div style="display: flex; gap: 1cm;">
      <div style="width: 4cm; border-top: 1px solid #000; padding-top: 4pt; text-align: center;">Driver</div>
      <div style="width: 4cm; border-top: 1px solid #000; padding-top: 4pt; text-align: center;">Helper</div>
    </div>
  </div>

  <!-- Approved by -->
  <div style="width: 5.5cm;">
    <div style="text-align: left; margin-bottom: 1cm;">Approved by:</div>
    <div style="border-top: 1px solid #000; padding-top: 4pt; text-align: center;">Department Manager</div>
  </div>

</div>

</body>
</html>`;

      const w = window.open('', '_blank', 'width=900,height=700');
      if (w) {
        w.document.write(html);
        w.document.close();
        w.onload = () => { w.focus(); w.print(); };
      }
    });
  };
  // --- End Print Logic ---

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    const { delivery, departureDate, departureTime, customerSuppliers, returnDate, returnTime } = statusModal;

    if (!departureDate || !departureTime) {
      toast.error('Departure date and time are required');
      return;
    }

    // Validate all customer/supplier times
    for (let i = 0; i < customerSuppliers.length; i++) {
      if (!customerSuppliers[i].arrivalDate || !customerSuppliers[i].arrivalTime) {
        toast.error(`Arrival date and time for ${customerSuppliers[i].customerSupplier} are required`);
        return;
      }
      if (!customerSuppliers[i].departureDate || !customerSuppliers[i].departureTime) {
        toast.error(`Departure date and time for ${customerSuppliers[i].customerSupplier} are required`);
        return;
      }
    }

    if (!returnDate || !returnTime) {
      toast.error('Return date and time are required');
      return;
    }

    setStatusModal(prev => ({ ...prev, isLoading: true }));

    try {
      const timeline = [];

      // 1. Departure from Enertech
      timeline.push({
        type: 'departure',
        customerSupplier: 'Enertech',
        destination: 'Enertech',
        timestamp: new Date(`${departureDate}T${departureTime}`).toISOString(),
        customerSupplierIndex: -1,
        destinationIndex: -1
      });

      // 2. Arrivals and departures for each customer/supplier
      customerSuppliers.forEach((cs, index) => {
        // Arrival at customer/supplier
        timeline.push({
          type: 'arrival',
          customerSupplier: cs.customerSupplier,
          destination: cs.customerSupplier,
          timestamp: new Date(`${cs.arrivalDate}T${cs.arrivalTime}`).toISOString(),
          customerSupplierIndex: index,
          destinationIndex: index
        });

        // Departure from customer/supplier (only add if not the last one)
        if (index === customerSuppliers.length - 1) {
          timeline.push({
            type: 'departure',
            customerSupplier: cs.customerSupplier,
            destination: cs.customerSupplier,
            timestamp: new Date(`${cs.departureDate}T${cs.departureTime}`).toISOString(),
            customerSupplierIndex: index,
            destinationIndex: index
          });
        }
      });

      // 3. Return to Enertech
      timeline.push({
        type: 'arrival',
        customerSupplier: 'Enertech',
        destination: 'Enertech',
        timestamp: new Date(`${returnDate}T${returnTime}`).toISOString(),
        customerSupplierIndex: -1,
        destinationIndex: -1
      });

      const payload = {
        timeline,
        status: 'Completed'
      };

      await axios.put(`/api/deliveries/${delivery._id}`, payload);

      toast.success('Delivery timeline completed successfully');
      closeStatusModal();

      // Open expenses modal with existing data or empty arrays
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

      const processArray = (arr, defaultItem) => {
        if (!arr || !Array.isArray(arr) || arr.length === 0) return [defaultItem];
        return arr.map(item => ({
          ...item,
          date: item.date ? formatDateForInput(item.date) : ''
        }));
      };

      setExpensesFormData({
        fuel: processArray(delivery.fuel, { amount: 0, liters: 0, gasStation: '', invoiceNo: '', paymentType: '', date: '' }),
        tollFee: processArray(delivery.tollFee, { details: '', amt: 0, date: '' }),
        pierExpenses: processArray(delivery.pierExpenses, { details: '', amt: 0, date: '' }),
        repairAndMaintenance: processArray(delivery.repairAndMaintenance, { details: '', amt: 0, date: '' }),
        mealExpenses: processArray(delivery.mealExpenses, { details: '', amt: 0, date: '' }),
        loadExpenses: processArray(delivery.loadExpenses, { details: '', amt: 0, date: '' }),
        contingency: processArray(delivery.contingency, { details: '', amt: 0, date: '' })
      });

      setExpensesModal({
        isOpen: true,
        delivery: delivery,
        isLoading: false
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
      setStatusModal(prev => ({ ...prev, isLoading: false }));
    }
  };
  // ---------------------------

  const handleExpenseChange = (category, index, field, value) => {
    setExpensesFormData(prev => {
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
    setExpensesFormData(prev => ({ ...prev, [category]: [...prev[category], defaultItem] }));
  };

  const removeExpenseItem = (category, index) => {
    setExpensesFormData(prev => ({ ...prev, [category]: prev[category].filter((_, i) => i !== index) }));
  };

  // Handle expenses submission
  const handleExpensesSubmit = async (e) => {
    e.preventDefault();
    const { delivery } = expensesModal;
    setExpensesModal(prev => ({ ...prev, isLoading: true }));

    try {
      const cleanItems = (arr) => (arr || []).map(item => {
        const cleaned = { ...item };
        if (cleaned.id) delete cleaned.id;
        if (cleaned.date === null || cleaned.date === undefined || cleaned.date === '') {
          delete cleaned.date;
        }
        return cleaned;
      });

      const payload = {
        fuel: cleanItems(expensesFormData.fuel),
        tollFee: cleanItems(expensesFormData.tollFee),
        pierExpenses: cleanItems(expensesFormData.pierExpenses),
        repairAndMaintenance: cleanItems(expensesFormData.repairAndMaintenance),
        mealExpenses: cleanItems(expensesFormData.mealExpenses),
        loadExpenses: cleanItems(expensesFormData.loadExpenses),
        contingency: cleanItems(expensesFormData.contingency)
      };

      await axios.put(`/api/deliveries/${delivery._id}`, payload);

      toast.success('Expenses saved successfully');
      const response = await axios.get('/api/deliveries');
      setDeliveries(response.data);
      setExpensesModal({ isOpen: false, delivery: null, isLoading: false });
      setExpensesFormData({
        fuel: [], tollFee: [], pierExpenses: [], repairAndMaintenance: [],
        mealExpenses: [], loadExpenses: [], contingency: []
      });
    } catch (error) {
      console.error('Error saving expenses:', error);
      toast.error(error.response?.data?.message || 'Failed to save expenses');
      setExpensesModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle skip expenses
  const handleSkipExpenses = async () => {
    const response = await axios.get('/api/deliveries');
    setDeliveries(response.data);
    setExpensesModal({ isOpen: false, delivery: null, isLoading: false });
    setExpensesFormData({
      fuel: [], tollFee: [], pierExpenses: [], repairAndMaintenance: [],
      mealExpenses: [], loadExpenses: [], contingency: []
    });
  };

  // Helper: join array values with slash
  const joinArray = (arr) => {
    if (!arr || !Array.isArray(arr)) return '—';
    const filtered = arr.filter(Boolean);
    return filtered.length > 0 ? filtered.join(' / ') : '—';
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
    return filtered.length > 0 ? filtered.map(formatName).join(' / ') : '—';
  };

  // Helper: format date as MM/DD/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

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

      const statusMatch = statusFilter === 'all' || getStatusDisplay(d) === statusFilter;

      const dateFromMatch = !dateFromFilter || (d.dateFrom && new Date(d.dateFrom) >= new Date(dateFromFilter));
      const dateToMatch = !dateToFilter || (d.dateFrom && new Date(d.dateFrom) <= new Date(dateToFilter));

      const purposeMatch = purposeFilter === 'all' || (d.purpose || []).includes(purposeFilter);

      const vehicleMatch = vehicleFilter === 'all' || d.vehicleEquipment === vehicleFilter;

      const destinationMatch = destinationFilter === 'all' || (d.destination || []).includes(destinationFilter);

      const personnelMatch = personnelFilter === 'all' ||
        (d.driver || []).includes(personnelFilter) ||
        (d.helper || []).includes(personnelFilter);

      return searchMatch && typeMatch && statusMatch && dateFromMatch && dateToMatch &&
        purposeMatch && vehicleMatch && destinationMatch && personnelMatch;
    });
  }, [deliveries, searchQuery, typeFilter, statusFilter, dateFromFilter, dateToFilter,
    purposeFilter, vehicleFilter, destinationFilter, personnelFilter]);

  const drivers = personnels.filter(p => p.position === 'Driver');
  const helpers = personnels.filter(p => p.position === 'Helper');

  const inputFormClass = "block h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto";
  const selectClass = `${inputFormClass} appearance-none cursor-pointer`;

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setConfirmDialog({
      isOpen: true,
      title: 'SAVE CHANGES',
      description: `Are you sure you want to save the changes for delivery ${detailsModal.delivery.referenceNo}?`,
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
      const processedCustomerSupplier = [...formData.customerSupplier];
      for (let i = 0; i < processedCustomerSupplier.length; i++) {
        if (processedCustomerSupplier[i] === 'NEW_CUSTOMER' && newCustomers[i]) {
          const newName = newCustomers[i].trim();
          processedCustomerSupplier[i] = newName;
          try {
            await axios.post('/api/destinations', { name: newName });
          } catch (e) {
            // Ignore safely
          }
        }
      }

      const payload = {
        deliveryType: formData.deliveryType,
        dateFrom: formData.dateFrom || undefined,
        dateTo: formData.dateTo || undefined,
        purpose: formData.purpose.filter(v => v.trim() !== ''),
        activity: formData.activity.filter(v => v.trim() !== ''),
        vehicleEquipment: formData.vehicleEquipment,
        tnvsProvider: formData.vehicleEquipment === 'RENT_VEHICLE' ? formData.tnvsProvider : undefined,
        destination: formData.destination.filter(v => v.trim() !== ''),
        driver: formData.driver.filter(v => v.trim() !== ''),
        helper: formData.helper.filter(v => v.trim() !== ''),
        jobOrderNo: formData.jobOrderNo.filter(v => v.trim() !== ''),
        customerSupplier: processedCustomerSupplier.filter(v => v.trim() !== ''),
        totalBudget: formData.totalBudget ? Number(formData.totalBudget) : 0,
        requestedBy: formData.requestedBy
      };

      await axios.put(`/api/deliveries/${delivery._id}`, payload);
      toast.success('Delivery updated successfully');

      const response = await axios.get('/api/deliveries');
      setDeliveries(response.data);

      const updatedDelivery = response.data.find(d => d._id === delivery._id);
      if (updatedDelivery) {
        setDetailsModal(prev => ({ ...prev, delivery: updatedDelivery }));
      }
      setIsEditingDetails(false);
      setConfirmDialog({ isOpen: false, title: '', description: '', actionType: '', item: null, isLoading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update delivery');
    } finally {
      setIsEditSubmitLoading(false);
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const renderDeliveryForm = (onSubmitHandler, formId) => (
    <form onSubmit={onSubmitHandler} className="space-y-3" id={formId}>
      {/* Delivery Type - Radio */}
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

      {/* Date From / Date To */}
      <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm min-w-0">
        <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Schedule</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Date From</label>
            <input
              name="dateFrom"
              type="date"
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
              value={formData.dateTo}
              onChange={handleInputChange}
              className={inputFormClass}
            />
          </div>
        </div>
      </fieldset>

      {/* Vehicle / Equipment */}
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
            <option value="RENT_VEHICLE" className="font-bold">Rent Vehicle</option>
            {[...vehicles].sort((a, b) => a.plateNumber.localeCompare(b.plateNumber)).map(v => (
              <option key={v._id} value={v.plateNumber} className="font-bold">{v.plateNumber} — {v.model}</option>
            ))}
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
            {/* Purpose */}
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

            {/* Activity */}
            <div className="flex-1">
              <input
                value={formData.activity[index] || ''}
                onChange={(e) => handleArrayChange('activity', index, e.target.value)}
                className={inputFormClass}
                placeholder="Activity"
              />
            </div>

            {/* Buttons */}
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
                                  {!cs ? "Select Customer / Supplier" : (cs === 'NEW_CUSTOMER' ? '-- New Customer / Supplier --' : destinations.find(d => d.name === cs)?.name || cs)}
                                </span>
                                <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="z-[200] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px] max-h-56 overflow-y-auto" align="start">
                              <DropdownMenuRadioGroup value={cs} onValueChange={(val) => handleArrayChange('customerSupplier', index, val)}>
                                {destinations.map(d => (
                                  <DropdownMenuRadioItem key={d._id} value={d.name} className="font-bold text-[11px] uppercase tracking-wider py-2 cursor-pointer">
                                    {d.name}
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

      {/* Driver */}
      <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-2 min-w-0">
        <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1 flex items-center gap-2">
          Driver
        </legend>
        {formData.driver.map((dr, index) => (
          <div key={`driver-${index}`}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={dr}
                  onChange={(e) => handleArrayChange('driver', index, e.target.value)}
                  className={selectClass}
                >
                  <option value="" disabled>Select Driver</option>
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
              {index === 0 && (
                <button type="button" onClick={() => addArrayField('driver')} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              )}
              {index > 0 && (
                <button type="button" onClick={() => removeArrayField('driver', index)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </fieldset>

      {/* Helper */}
      <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-2 min-w-0">
        <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1 flex items-center gap-2">
          Helper
        </legend>
        {formData.helper.map((hl, index) => (
          <div key={`helper-${index}`}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={hl}
                  onChange={(e) => handleArrayChange('helper', index, e.target.value)}
                  className={selectClass}
                >
                  <option value="" disabled>Select Helper</option>
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
              {index === 0 && (
                <button type="button" onClick={() => addArrayField('helper')} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              )}
              {index > 0 && (
                <button type="button" onClick={() => removeArrayField('helper', index)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
              )}
            </div>
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
        {formData.destination.map((dItem, index) => (
          <div key={`dest-${index}`}>
            <div className="flex items-center gap-2">
              <input
                value={dItem}
                onChange={(e) => handleArrayChange('destination', index, e.target.value)}
                className={`${inputFormClass} flex-1`}
                placeholder="Destination"
              />
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
          </div>
        ))}
      </fieldset>

      {/* Total Budget */}
      <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
        <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Total Budget</legend>
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground/60 select-none">
            ₱
          </div>
          <input
            name="totalBudget"
            type="number"
            value={formData.totalBudget}
            onChange={handleInputChange}
            className={`${inputFormClass} pl-7`}
            placeholder="Total Budget"
          />
        </div>
      </fieldset>

      {/* Requested By */}
      <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
        <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Requested By</legend>
        <input
          name="requestedBy"
          value={formData.requestedBy}
          onChange={handleInputChange}
          className={inputFormClass}
          placeholder="Requested By"
        />
      </fieldset>

    </form>
  );

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
          <div className="flex flex-1 gap-2 flex-wrap">
            <div className="relative max-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search deliveries..."
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
                  <span className="text-[10px]">Status</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-[10px]">
                <DropdownMenuLabel className="text-[10px]">Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem className="text-[10px]" checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>All</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem className="text-[10px]" checked={statusFilter === 'Pending'} onCheckedChange={() => setStatusFilter('Pending')}>Pending</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem className="text-[10px]" checked={statusFilter === 'Completed'} onCheckedChange={() => setStatusFilter('Completed')}>Completed</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 bg-background">
                  <i className='bx bx-category text-sm'></i>
                  <span className="text-[10px]">Delivery Type</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-[10px]">
                <DropdownMenuLabel className="text-[10px]">Filter by Delivery Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem className="text-[10px]" checked={typeFilter === 'all'} onCheckedChange={() => setTypeFilter('all')}>All</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem className="text-[10px]" checked={typeFilter === 'Field Trip'} onCheckedChange={() => setTypeFilter('Field Trip')}>Field Trip</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem className="text-[10px]" checked={typeFilter === 'Itinerary'} onCheckedChange={() => setTypeFilter('Itinerary')}>Itinerary</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date Range Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 bg-background">
                  <i className='bx bx-calendar text-sm'></i>
                  <span className="text-[10px]">Date Range</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="p-3 space-y-2">
                <DropdownMenuLabel className="text-[10px]">Filter by Date Range</DropdownMenuLabel>
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

            {/* Purpose Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 bg-background">
                  <i className='bx bx-target-lock text-sm'></i>
                  <span className="text-[10px]">Purpose</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-[10px] max-h-[200px] overflow-y-auto">
                <DropdownMenuLabel className="text-[10px]">Filter by Purpose</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem className="text-[10px]" checked={purposeFilter === 'all'} onCheckedChange={() => setPurposeFilter('all')}>All</DropdownMenuCheckboxItem>
                {['Delivery', 'Pick Up', 'Rescue', 'Pull Out', 'Service Manpower', 'Assign to Project', 'Purchase'].map((purpose) => (
                  <DropdownMenuCheckboxItem key={purpose} className="text-[10px]" checked={purposeFilter === purpose} onCheckedChange={() => setPurposeFilter(purpose)}>{purpose}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Vehicle Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 bg-background">
                  <i className='bx bx-car text-sm'></i>
                  <span className="text-[10px]">Vehicle</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-[10px] max-h-[200px] overflow-y-auto">
                <DropdownMenuLabel className="text-[10px]">Filter by Vehicle</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem className="text-[10px]" checked={vehicleFilter === 'all'} onCheckedChange={() => setVehicleFilter('all')}>All</DropdownMenuCheckboxItem>
                {vehicles.map((v) => (
                  <DropdownMenuCheckboxItem key={v._id} className="text-[10px]" checked={vehicleFilter === v.plateNumber} onCheckedChange={() => setVehicleFilter(v.plateNumber)}>{v.plateNumber} — {v.model}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Destination Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 bg-background">
                  <i className='bx bx-map text-sm'></i>
                  <span className="text-[10px]">Destination</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-[10px] max-h-[200px] overflow-y-auto">
                <DropdownMenuLabel className="text-[10px]">Filter by Destination</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem className="text-[10px]" checked={destinationFilter === 'all'} onCheckedChange={() => setDestinationFilter('all')}>All</DropdownMenuCheckboxItem>
                {destinations.map((d) => (
                  <DropdownMenuCheckboxItem key={d._id} className="text-[10px]" checked={destinationFilter === d.name} onCheckedChange={() => setDestinationFilter(d.name)}>{d.name}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Personnel Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 bg-background">
                  <i className='bx bx-user text-sm'></i>
                  <span className="text-[10px]">Personnel</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-[10px] max-h-[200px] overflow-y-auto">
                <DropdownMenuLabel className="text-[10px]">Filter by Personnel</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem className="text-[10px]" checked={personnelFilter === 'all'} onCheckedChange={() => setPersonnelFilter('all')}>All</DropdownMenuCheckboxItem>
                {personnels.map((p) => (
                  <DropdownMenuCheckboxItem key={p._id} className="text-[10px] uppercase" checked={personnelFilter === `${p.firstname} ${p.lastname}`} onCheckedChange={() => setPersonnelFilter(`${p.firstname} ${p.lastname}`)}>{p.firstname} {p.lastname}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {(searchQuery || typeFilter !== 'all' || statusFilter !== 'Pending' || dateFromFilter || dateToFilter || purposeFilter !== 'all' || vehicleFilter !== 'all' || destinationFilter !== 'all' || personnelFilter !== 'all') && (
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
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 h-8 px-2.5 pb-0 bg-background">
                  <Columns className="h-3 w-3" />
                  <span className="text-[10px] font-medium">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs max-h-[242px] overflow-y-auto">
                <DropdownMenuLabel className="text-[10px]">Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tableColumns.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    className="capitalize text-[10px]"
                    checked={visibleColumns.has(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Create Button */}
            <Button size="sm" className="h-8 w-8 rounded-full p-0 text-white" onClick={openModal}>
              <Plus className="h-4 w-4" />
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
                        col.key === 'jobOrderNo' ? "text-center align-middle" : col.key === 'totalBudget' ? "text-right pr-6 align-middle" : col.key === 'status' ? "text-center align-middle" : "text-left align-middle"
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle sticky right-0 bg-orange-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((item, index) => (
                  <tr
                    key={item._id}
                    className={`border-b border-border/50 transition-colors hover:bg-muted/30 cursor-pointer ${index % 2 === 0 ? 'bg-card/30' : ''}`}
                    onClick={() => openDetailsModal(item)}
                  >
                    {visibleColumns.has('referenceNo') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-tight">{item.referenceNo}</td>
                    )}
                    {visibleColumns.has('status') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold tracking-tight align-middle">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            openStatusModal(item);
                          }}
                          className={cn(
                            "px-2 py-1 rounded-full text-[8px] uppercase tracking-widest font-bold",
                            getStatusDisplay(item) === 'Completed' ? "bg-green-500/10 text-green-600" :
                              getStatusDisplay(item) === 'In Transit' ? "bg-blue-500/10 text-blue-600 cursor-pointer hover:bg-blue-500/20 transition-colors" :
                                "bg-yellow-500/10 text-yellow-600 cursor-pointer hover:bg-yellow-500/20 transition-colors"
                          )}>
                          {getStatusDisplay(item)}
                        </span>
                      </td>
                    )}
                    {visibleColumns.has('deliveryType') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight">{item.deliveryType || '—'}</td>
                    )}
                    {visibleColumns.has('dateRange') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight">
                        {item.dateFrom && item.dateTo ? `${formatDate(item.dateFrom)} - ${formatDate(item.dateTo)}` : formatDate(item.dateFrom)}
                      </td>
                    )}
                    {visibleColumns.has('duration') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-muted-foreground tracking-tight">{computeDuration(item.dateFrom, item.dateTo)}</td>
                    )}
                    {visibleColumns.has('purpose') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{joinArray(item.purpose)}</td>
                    )}
                    {visibleColumns.has('activity') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{joinArray(item.activity)}</td>
                    )}
                    {visibleColumns.has('vehicleEquipment') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-foreground uppercase tracking-tight">
                        {(() => {
                          const plate = item.vehicleEquipment;
                          if (!plate) return '—';
                          if (plate === 'RENT_VEHICLE') return `Rent Vehicle${item.tnvsProvider ? ` - ${item.tnvsProvider}` : ''}`;
                          const v = vehicles.find((v) => v.plateNumber === plate);
                          return v ? `${v.plateNumber} — ${v.model}` : plate;
                        })()}
                      </td>
                    )}
                    {visibleColumns.has('destination') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{joinArray(item.destination)}</td>
                    )}
                    {visibleColumns.has('driver') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{joinNames(item.driver)}</td>
                    )}
                    {visibleColumns.has('helper') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{joinNames(item.helper)}</td>
                    )}
                    {visibleColumns.has('jobOrderNo') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight text-center">{joinArray(item.jobOrderNo)}</td>
                    )}
                    {visibleColumns.has('customerSupplier') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{joinArray(item.customerSupplier)}</td>
                    )}
                    {visibleColumns.has('totalBudget') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-wider text-right pr-6">{Number(item.totalBudget || 0).toLocaleString()}</td>
                    )}
                    {visibleColumns.has('requestedBy') && (
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{item.requestedBy || '—'}</td>
                    )}
                    <td className="whitespace-nowrap px-3 py-1.5 text-center sticky right-0 bg-card border-l border-border/30" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditMode(item)}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
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

      {/* Create Delivery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[700px] max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border p-5 pb-3.5 rounded-t-xl">
              <div className="flex items-center justify-between">
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
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-5 pt-3">
              {renderDeliveryForm(handleSubmit, 'delivery-form')}
            </div>

            {/* Sticky Footer with Submit Button */}
            <div className="sticky bottom-0 z-10 bg-card border-t border-border p-5 pt-3 rounded-b-xl">
              <div className="flex justify-end">
                <Button
                  type="submit"
                  form="delivery-form"
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
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModal.isOpen && detailsModal.delivery && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[700px] max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border p-5 pb-3.5 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                    <Eye className="h-3 w-3" />
                  </div>
                  <h2 className="text-[12px] font-bold text-foreground uppercase tracking-tight">
                    DELIVERY DETAILS: {detailsModal.delivery.referenceNo}
                  </h2>
                </div>
                {isEditingDetails ? (
                  <button
                    onClick={() => setIsEditingDetails(false)}
                    className="rounded-full flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setFormData({
                          deliveryType: detailsModal.delivery.deliveryType || '',
                          dateFrom: detailsModal.delivery.dateFrom ? detailsModal.delivery.dateFrom.split('T')[0] : '',
                          dateTo: detailsModal.delivery.dateTo ? detailsModal.delivery.dateTo.split('T')[0] : '',
                          purpose: detailsModal.delivery.purpose?.length ? detailsModal.delivery.purpose : [''],
                          activity: detailsModal.delivery.activity?.length ? detailsModal.delivery.activity : [''],
                          vehicleEquipment: detailsModal.delivery.vehicleEquipment || '',
                          tnvsProvider: detailsModal.delivery.tnvsProvider || '',
                          destination: detailsModal.delivery.destination?.length ? detailsModal.delivery.destination : [''],
                          driver: detailsModal.delivery.driver?.length ? detailsModal.delivery.driver : [''],
                          helper: detailsModal.delivery.helper?.length ? detailsModal.delivery.helper : [''],
                          jobOrderNo: detailsModal.delivery.jobOrderNo?.length ? detailsModal.delivery.jobOrderNo : [''],
                          customerSupplier: detailsModal.delivery.customerSupplier?.length ? detailsModal.delivery.customerSupplier : [''],
                          totalBudget: detailsModal.delivery.totalBudget || '',
                          requestedBy: detailsModal.delivery.requestedBy || ''
                        });
                        setIsEditingDetails(true);
                      }}
                      className="rounded-full flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handlePrint(detailsModal.delivery)}
                      className="rounded-full flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 pt-3">
              {isEditingDetails ? (
                renderDeliveryForm(handleEditSubmit, 'edit-form')
              ) : (
                <div className="space-y-3">
                  {/* Status Badge - Prominent */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Current Status</p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold shadow-sm",
                          getStatusDisplay(detailsModal.delivery) === 'Completed' ? "bg-green-500 text-white" :
                            getStatusDisplay(detailsModal.delivery) === 'In Transit' ? "bg-blue-500 text-white" :
                              "bg-yellow-500 text-white"
                        )}>
                        {getStatusDisplay(detailsModal.delivery)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Reference No.</p>
                      <p className="text-[13px] font-bold text-primary">{detailsModal.delivery.referenceNo}</p>
                    </div>
                  </div>

                  {/* Delivery Type & Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Delivery Type</p>
                      <p className="text-[12px] font-bold text-foreground uppercase">{detailsModal.delivery.deliveryType || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Duration</p>
                      <p className="text-[12px] font-bold text-foreground">{computeDuration(detailsModal.delivery.dateFrom, detailsModal.delivery.dateTo)}</p>
                    </div>
                  </div>

                  {/* Date Range - Full Width */}
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Schedule</p>
                    <p className="text-[12px] font-bold text-foreground">
                      {detailsModal.delivery.dateFrom && detailsModal.delivery.dateTo
                        ? `${formatDate(detailsModal.delivery.dateFrom)} - ${formatDate(detailsModal.delivery.dateTo)}`
                        : formatDate(detailsModal.delivery.dateFrom)}
                    </p>
                  </div>

                  {/* Purpose & Activity */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Purpose</p>
                      <p className="text-[11px] font-bold text-foreground uppercase leading-relaxed">{joinArray(detailsModal.delivery.purpose)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Activity</p>
                      <p className="text-[11px] font-bold text-foreground uppercase leading-relaxed">{joinArray(detailsModal.delivery.activity)}</p>
                    </div>
                  </div>

                  {/* Vehicle - Highlighted */}
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-[9px] text-primary/70 uppercase tracking-widest mb-1.5 font-bold">Vehicle / Equipment</p>
                    <p className="text-[13px] font-bold text-primary uppercase">
                      {detailsModal.delivery.vehicleEquipment === 'RENT_VEHICLE'
                        ? `Rent Vehicle${detailsModal.delivery.tnvsProvider ? ` - ${detailsModal.delivery.tnvsProvider}` : ''}`
                        : detailsModal.delivery.vehicleEquipment
                          ? `${detailsModal.delivery.vehicleEquipment} — ${vehicles.find(v => v.plateNumber === detailsModal.delivery.vehicleEquipment)?.model || ''}`
                          : '—'}
                    </p>
                  </div>

                  {/* Customer / Supplier */}
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Customer / Supplier</p>
                    <p className="text-[11px] font-bold text-foreground uppercase leading-relaxed">{joinArray(detailsModal.delivery.customerSupplier)}</p>
                  </div>

                  {/* Personnel - Side by Side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Driver</p>
                      <p className="text-[11px] font-bold text-foreground uppercase leading-relaxed">{joinArray(detailsModal.delivery.driver)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Helper</p>
                      <p className="text-[11px] font-bold text-foreground uppercase leading-relaxed">{joinArray(detailsModal.delivery.helper)}</p>
                    </div>
                  </div>

                  {/* Job Order & Destination - Side by Side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Job Order No.</p>
                      <p className="text-[11px] font-bold text-foreground leading-relaxed">{joinArray(detailsModal.delivery.jobOrderNo)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Destination</p>
                      <p className="text-[11px] font-bold text-foreground uppercase leading-relaxed">{joinArray(detailsModal.delivery.destination)}</p>
                    </div>
                  </div>

                  {/* Budget & Requested By */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <p className="text-[9px] text-green-600/70 uppercase tracking-widest mb-1.5 font-bold">Total Budget</p>
                      <p className="text-[14px] font-bold text-green-600">₱ {Number(detailsModal.delivery.totalBudget || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Requested By</p>
                      <p className="text-[11px] font-bold text-foreground uppercase">{detailsModal.delivery.requestedBy || '—'}</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  {detailsModal.delivery.timeline && detailsModal.delivery.timeline.length > 0 && (
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-3 font-bold">Delivery Timeline</p>
                      <div className="space-y-2.5">
                        {detailsModal.delivery.timeline.map((event, idx) => {
                          // Get the location name - check both new and old field names
                          let locationName = event.customerSupplier || event.destination || '—';

                          // If it's not Enertech/Company and we have an index, try to get from delivery data
                          const eventIndex = event.customerSupplierIndex ?? event.destinationIndex;
                          if (eventIndex >= 0 && locationName !== 'Enertech' && locationName !== 'Company') {
                            // Try to get from customerSupplier array first, then destination array
                            const fromCustomerSupplier = detailsModal.delivery.customerSupplier?.[eventIndex];
                            const fromDestination = detailsModal.delivery.destination?.[eventIndex];
                            locationName = fromCustomerSupplier || fromDestination || locationName;
                          }

                          return (
                            <div key={idx} className="flex items-start gap-3 rounded-lg bg-card p-3 border border-border/50 shadow-sm">
                              <div className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm",
                                event.type === 'departure' ? "bg-orange-500 text-white" : "bg-green-500 text-white"
                              )}>
                                <i className={cn(
                                  "text-[14px]",
                                  event.type === 'departure' ? "bx bx-log-out" : "bx bx-map-pin"
                                )}></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-foreground uppercase leading-tight">
                                  {event.type === 'departure' ? 'Departed from' : 'Arrived at'} {locationName}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {new Date(event.timestamp).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 bg-card border-t border-border p-5 pt-3 rounded-b-xl">
              <div className="flex justify-end">
                {isEditingDetails ? (
                  <Button
                    type="submit"
                    form="edit-form"
                    disabled={isEditSubmitLoading}
                    size="sm"
                    className="min-w-[90px] h-8 text-[10px] uppercase tracking-wider"
                  >
                    {isEditSubmitLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'SAVE CHANGES'
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={closeDetailsModal}
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] uppercase tracking-wider"
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusModal.isOpen && statusModal.delivery && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border p-5 pb-3.5 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10 text-blue-600">
                    <RotateCcw className="h-3 w-3" />
                  </div>
                  <h2 className="text-[12px] font-bold text-foreground uppercase tracking-tight">
                    COMPLETE DELIVERY: {statusModal.delivery.referenceNo}
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
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-5 pt-3">
              <form onSubmit={handleStatusUpdate} className="space-y-4" id="status-form">
                {/* Departure from Enertech */}
                <div className="rounded-lg bg-orange-500/5 p-3 border border-orange-500/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-2">
                    1. Departure from Enertech
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Date</label>
                      <input
                        type="date"
                        required
                        value={statusModal.departureDate}
                        onChange={(e) => setStatusModal(prev => ({ ...prev, departureDate: e.target.value }))}
                        disabled={statusModal.isLoading}
                        className="block h-8 w-full rounded border border-input bg-background px-2 text-[11px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Time</label>
                      <input
                        type="time"
                        required
                        value={statusModal.departureTime}
                        onChange={(e) => setStatusModal(prev => ({ ...prev, departureTime: e.target.value }))}
                        disabled={statusModal.isLoading}
                        className="block h-8 w-full rounded border border-input bg-background px-2 text-[11px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Customer/Suppliers */}
                {statusModal.customerSuppliers.map((cs, index) => (
                  <div key={index} className="rounded-lg bg-green-500/5 p-3 border border-green-500/20 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">
                      {index + 2}. {cs.customerSupplier}
                    </p>

                    {/* Arrival */}
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Arrival</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-muted-foreground">Date</label>
                          <input
                            type="date"
                            required
                            value={cs.arrivalDate}
                            onChange={(e) => {
                              const newCS = [...statusModal.customerSuppliers];
                              newCS[index].arrivalDate = e.target.value;
                              setStatusModal(prev => ({ ...prev, customerSuppliers: newCS }));
                            }}
                            disabled={statusModal.isLoading}
                            className="block h-8 w-full rounded border border-input bg-background px-2 text-[11px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-muted-foreground">Time</label>
                          <input
                            type="time"
                            required
                            value={cs.arrivalTime}
                            onChange={(e) => {
                              const newCS = [...statusModal.customerSuppliers];
                              newCS[index].arrivalTime = e.target.value;
                              setStatusModal(prev => ({ ...prev, customerSuppliers: newCS }));
                            }}
                            disabled={statusModal.isLoading}
                            className="block h-8 w-full rounded border border-input bg-background px-2 text-[11px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Departure (only for last customer/supplier) */}
                    {index === statusModal.customerSuppliers.length - 1 && (
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Departure</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-widest text-muted-foreground">Date</label>
                            <input
                              type="date"
                              required
                              value={cs.departureDate}
                              onChange={(e) => {
                                const newCS = [...statusModal.customerSuppliers];
                                newCS[index].departureDate = e.target.value;
                                setStatusModal(prev => ({ ...prev, customerSuppliers: newCS }));
                              }}
                              disabled={statusModal.isLoading}
                              className="block h-8 w-full rounded border border-input bg-background px-2 text-[11px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-widest text-muted-foreground">Time</label>
                            <input
                              type="time"
                              required
                              value={cs.departureTime}
                              onChange={(e) => {
                                const newCS = [...statusModal.customerSuppliers];
                                newCS[index].departureTime = e.target.value;
                                setStatusModal(prev => ({ ...prev, customerSuppliers: newCS }));
                              }}
                              disabled={statusModal.isLoading}
                              className="block h-8 w-full rounded border border-input bg-background px-2 text-[11px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Return to Enertech */}
                <div className="rounded-lg bg-blue-500/5 p-3 border border-blue-500/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">
                    {statusModal.customerSuppliers.length + 2}. Return to Enertech
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Date</label>
                      <input
                        type="date"
                        required
                        value={statusModal.returnDate}
                        onChange={(e) => setStatusModal(prev => ({ ...prev, returnDate: e.target.value }))}
                        disabled={statusModal.isLoading}
                        className="block h-8 w-full rounded border border-input bg-background px-2 text-[11px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Time</label>
                      <input
                        type="time"
                        required
                        value={statusModal.returnTime}
                        onChange={(e) => setStatusModal(prev => ({ ...prev, returnTime: e.target.value }))}
                        disabled={statusModal.isLoading}
                        className="block h-8 w-full rounded border border-input bg-background px-2 text-[11px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-10 bg-card border-t border-border p-5 pt-3 rounded-b-xl">
              <div className="flex gap-2">
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
                  form="status-form"
                  disabled={statusModal.isLoading}
                  className="flex-1 text-[11px] h-8 uppercase tracking-wider font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {statusModal.isLoading ? (
                    <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Updating...</>
                  ) : (
                    'Complete Delivery'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[400px] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  confirmDialog.actionType === 'delete' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                )}>
                  {confirmDialog.actionType === 'delete' ? <Trash2 className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-[14px] font-bold uppercase tracking-tight text-foreground">{confirmDialog.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1">{confirmDialog.description}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  disabled={confirmDialog.isLoading}
                  className="h-8 text-[10px] uppercase tracking-wider"
                >
                  CANCEL
                </Button>
                <Button
                  variant={confirmDialog.actionType === 'delete' ? "destructive" : "default"}
                  size="sm"
                  onClick={confirmDialog.actionType === 'delete' ? confirmDelete : confirmEdit}
                  disabled={confirmDialog.isLoading}
                  className="min-w-[80px] h-8 text-[10px] uppercase tracking-wider"
                >
                  {confirmDialog.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'CONFIRM'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Modal */}
      {expensesModal.isOpen && expensesModal.delivery && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[1100px] max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border p-5 pb-3.5 rounded-t-xl shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-green-500/10 text-green-600">
                    <i className="bx bx-money text-sm"></i>
                  </div>
                  <h2 className="text-[12px] font-bold text-foreground uppercase tracking-tight">
                    ADD EXPENSES: {expensesModal.delivery.referenceNo}
                  </h2>
                </div>
                <button
                  onClick={handleSkipExpenses}
                  disabled={expensesModal.isLoading}
                  className="rounded-full flex h-5.5 w-5.5 items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-5 pt-3">
              <form id="expenses-form" onSubmit={handleExpensesSubmit} className="space-y-3">
                {/* Fuel Expenses */}
                <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-2 min-w-0">
                  <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1 flex items-center gap-2">
                    Fuel Expenses
                  </legend>
                  {expensesFormData.fuel.map((f, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2">
                      <Input type="date" value={f.date || ''} onChange={(e) => handleExpenseChange('fuel', idx, 'date', e.target.value)} className="w-[140px] h-8 text-[11px] font-bold uppercase tracking-wider bg-background px-2.5" />
                      <select value={f.paymentType || ''} onChange={(e) => handleExpenseChange('fuel', idx, 'paymentType', e.target.value)} className="w-[150px] h-8 text-[11px] font-bold uppercase tracking-wider bg-background px-2.5 rounded border border-input shadow-sm">
                        <option value="">PAYMENT</option>
                        <option value="PURCHASE ORDER">PURCHASE ORDER</option>
                        <option value="CASH">CASH</option>
                      </select>
                      <Input placeholder="Gas Station" value={f.gasStation || ''} onChange={(e) => handleExpenseChange('fuel', idx, 'gasStation', e.target.value)} className="flex-1 h-8 text-[11px] font-bold uppercase tracking-wider bg-background" />
                      <Input type="number" placeholder="Liters" value={f.liters || ''} onChange={(e) => handleExpenseChange('fuel', idx, 'liters', e.target.value)} className="w-[80px] h-8 text-[11px] font-bold uppercase tracking-wider bg-background px-2.5" />
                      <Input type="number" placeholder="Amount" value={f.amount || ''} onChange={(e) => handleExpenseChange('fuel', idx, 'amount', e.target.value)} className="w-[100px] h-8 text-[11px] font-bold uppercase tracking-wider bg-background px-2.5" />
                      <Input placeholder="Invoice No." value={f.invoiceNo || ''} onChange={(e) => handleExpenseChange('fuel', idx, 'invoiceNo', e.target.value)} className="w-[130px] h-8 text-[11px] font-bold uppercase tracking-wider bg-background" />
                      {idx === 0 && (
                        <button type="button" onClick={() => addExpenseItem('fuel', { amount: 0, liters: 0, gasStation: '', invoiceNo: '', paymentType: '', date: '' })} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                      {idx > 0 && (
                        <button type="button" onClick={() => removeExpenseItem('fuel', idx)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </fieldset>

                {/* Other Expense Categories */}
                {[
                  { key: 'tollFee', label: 'Toll Fee' },
                  { key: 'pierExpenses', label: 'Pier Expenses' },
                  { key: 'repairAndMaintenance', label: 'Repair & Maintenance' },
                  { key: 'mealExpenses', label: 'Meal Expenses' },
                  { key: 'loadExpenses', label: 'Load Expenses' },
                  { key: 'contingency', label: 'Contingency' }
                ].map(cat => (
                  <fieldset key={cat.key} className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-2 min-w-0">
                    <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1 flex items-center gap-2">
                      {cat.label}
                    </legend>
                    {expensesFormData[cat.key].map((item, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2">
                        <Input type="date" value={item.date || ''} onChange={(e) => handleExpenseChange(cat.key, idx, 'date', e.target.value)} className="w-[140px] h-8 text-[11px] font-bold uppercase tracking-wider bg-background px-2.5" />
                        <Input placeholder="Description details..." value={item.details || ''} onChange={(e) => handleExpenseChange(cat.key, idx, 'details', e.target.value)} className="flex-1 min-w-[200px] h-8 text-[11px] font-bold uppercase tracking-wider bg-background" />
                        <Input type="number" placeholder="Amount" value={item.amt || ''} onChange={(e) => handleExpenseChange(cat.key, idx, 'amt', e.target.value)} className="w-[120px] h-8 text-[11px] font-bold uppercase tracking-wider bg-background px-2.5" />
                        {idx === 0 && (
                          <button type="button" onClick={() => addExpenseItem(cat.key, { details: '', amt: 0, date: '' })} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                        {idx > 0 && (
                          <button type="button" onClick={() => removeExpenseItem(cat.key, idx)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </fieldset>
                ))}
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-10 bg-card border-t border-border p-5 pt-3 rounded-b-xl shrink-0">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkipExpenses}
                  disabled={expensesModal.isLoading}
                  className="flex-1 text-[11px] h-8 uppercase tracking-wider font-bold"
                >
                  Skip
                </Button>
                <Button
                  type="submit"
                  form="expenses-form"
                  disabled={expensesModal.isLoading}
                  className="flex-1 text-[11px] h-8 uppercase tracking-wider font-bold bg-green-600 hover:bg-green-700 text-white"
                >
                  {expensesModal.isLoading ? (
                    <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...</>
                  ) : (
                    'Save Expenses'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryPlan;
