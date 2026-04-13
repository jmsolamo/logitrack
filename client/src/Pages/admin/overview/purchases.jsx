import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  RotateCcw,
  ShoppingBag,
  Printer,
  Minus,
  ChevronDown
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import axios from 'axios';
import { useAppToast } from '../../../components/ui/alert-toast-provider';
import AlertDialog from '../../../components/ui/alert-dialog';

function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [personnels, setPersonnels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [printType, setPrintType] = useState('purchases');
  const [viewModal, setViewModal] = useState({ isOpen: false, purchase: null });

  const initialFormData = {
    category: '',
    items: [''],
    qty: [''],
    amount: [''],
    supplier: [''],
    invoiceNo: [''],
    date: [''],
    purchasedBy: '',
    budget: '',
    usedForNote: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const toast = useAppToast();
  
  const mainTableRef = useRef(null);
  const footerTableRef = useRef(null);

  useEffect(() => {
    fetchPurchases();
    fetchVehicles();
    fetchPersonnels();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await axios.get('/api/purchases');
      setPurchases(response.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to load purchases');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('/api/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchPersonnels = async () => {
    try {
      const response = await axios.get('/api/personnels');
      setPersonnels(response.data);
    } catch (error) {
      console.error('Error fetching personnels:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name, index, value) => {
    setFormData(prev => {
      const arr = [...prev[name]];
      arr[index] = value;
      return { ...prev, [name]: arr };
    });
  };

  const addArrayField = (name) => {
    setFormData(prev => ({ ...prev, [name]: [...prev[name], ''] }));
  };

  const removeArrayField = (name, index) => {
    setFormData(prev => ({ ...prev, [name]: prev[name].filter((_, i) => i !== index) }));
  };

  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, ''],
      qty: [...prev.qty, ''],
      amount: [...prev.amount, ''],
      supplier: [...prev.supplier, ''],
      invoiceNo: [...prev.invoiceNo, ''],
      date: [...prev.date, '']
    }));
  };

  const removeItemRow = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      qty: prev.qty.filter((_, i) => i !== index),
      amount: prev.amount.filter((_, i) => i !== index),
      supplier: prev.supplier.filter((_, i) => i !== index),
      invoiceNo: prev.invoiceNo.filter((_, i) => i !== index),
      date: prev.date.filter((_, i) => i !== index)
    }));
  };

  const openModal = (purchase = null) => {
    if (purchase) {
      const splitField = (val) => val ? String(val).split(',').map(s => s.trim()) : [''];
      setFormData({
        category: purchase.category || '',
        items: splitField(purchase.items),
        qty: splitField(purchase.qty),
        amount: splitField(purchase.amount),
        supplier: splitField(purchase.supplier),
        invoiceNo: splitField(purchase.invoiceNo),
        date: splitField(purchase.date).map(d => {
          if (!d) return '';
          try { return new Date(d).toISOString().split('T')[0]; } catch { return d; }
        }),
        purchasedBy: purchase.purchasedBy || '',
        budget: purchase.budget || '',
        usedForNote: purchase.usedForNote || ''
      });
      setEditingId(purchase._id);
    } else {
      setFormData({
        category: '',
        items: [''],
        qty: [''],
        amount: [''],
        supplier: [''],
        invoiceNo: [''],
        date: [new Date().toISOString().split('T')[0]],
        purchasedBy: '',
        budget: '',
        usedForNote: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      category: '',
      items: [''],
      qty: [''],
      amount: [''],
      supplier: [''],
      invoiceNo: [''],
      date: [''],
      purchasedBy: '',
      budget: '',
      usedForNote: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);

    try {
      const payload = {
        date: formData.date.filter(v => v.trim() !== '').join(', '),
        category: formData.category,
        items: formData.items.filter(v => v.trim() !== '').join(', '),
        qty: formData.qty.filter(v => String(v).trim() !== '').join(', '),
        amount: formData.amount.filter(v => String(v).trim() !== '').join(', '),
        supplier: formData.supplier.filter(v => v.trim() !== '').join(', '),
        invoiceNo: formData.invoiceNo.filter(v => v.trim() !== '').join(', '),
        purchasedBy: formData.purchasedBy,
        budget: formData.budget ? Number(formData.budget) : 0,
        usedForNote: formData.usedForNote
      };

      if (editingId) {
        await axios.put(`/api/purchases/${editingId}`, payload);
        toast.success('Purchase updated successfully');
      } else {
        await axios.post('/api/purchases', payload);
        toast.success('Purchase added successfully');
      }

      fetchPurchases();
      closeModal();
    } catch (error) {
      console.error('Error saving purchase:', error);
      toast.error(error.response?.data?.message || 'Failed to save purchase');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = (id) => {
    setPurchaseToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!purchaseToDelete) return;

    try {
      await axios.delete(`/api/purchases/${purchaseToDelete}`);
      toast.success('Purchase deleted successfully');
      fetchPurchases();
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Failed to delete purchase');
    } finally {
      setPurchaseToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setCategoryFilter('');
    toast.success('Filters cleared');
  };

  const filteredPurchases = purchases.filter(p => {
    const searchString = `${p.category} ${p.items} ${p.supplier} ${p.invoiceNo} ${p.purchasedBy} ${p.usedForNote}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPurchases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPurchases.map(p => p._id)));
    }
  };

  const toggleSelectRow = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const uniqueCategories = [...new Set(purchases.map(p => p.category).filter(Boolean))].sort();

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const generateFiltersText = () => {
    const f = [];
    if (searchQuery) f.push(`Search: ${searchQuery}`);
    if (categoryFilter) f.push(`Category: ${categoryFilter}`);
    return f.length ? f.join(' | ') : 'None';
  };

  const totalAmount = filteredPurchases.reduce((sum, p) => sum + String(p.amount || '').split(',').reduce((s, v) => s + Number(v.trim() || 0), 0), 0);

  // Sync columns lengths between top table and footer exactly
  useLayoutEffect(() => {
    if (!mainTableRef.current || !footerTableRef.current) return;
    
    const syncWidths = () => {
      if (!mainTableRef.current || !footerTableRef.current) return;
      const topThs = mainTableRef.current.querySelectorAll('thead th');
      const footerTrs = footerTableRef.current.querySelectorAll('tr');
      if (topThs.length === 0 || footerTrs.length === 0) return;
      
      const targetCells = footerTrs[0].querySelectorAll('td');

      topThs.forEach((th, idx) => {
        // Use getComputedStyle to get exactly the rendered width including any subpixel values
        const style = window.getComputedStyle(th);
        const width = style.width;
        
        if (targetCells[idx]) {
          targetCells[idx].style.minWidth = width;
          targetCells[idx].style.maxWidth = width;
          targetCells[idx].style.width = width;
        }
      });
    };

    // Run once initially
    syncWidths();

    // Use ResizeObserver to update if columns shift size
    const observer = new ResizeObserver(syncWidths);
    observer.observe(mainTableRef.current);
    
    return () => observer.disconnect();
  }, [filteredPurchases]);

  const getCategoryFullName = (categoryVal) => {
    if (!categoryVal) return '-';
    const vehicle = vehicles.find(v => v.plateNumber === categoryVal);
    if (vehicle) {
      return `${vehicle.plateNumber.toUpperCase()} - ${vehicle.model.toUpperCase()}`;
    }
    return categoryVal.toUpperCase();
  };

  return (
    <>
      <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500 print:hidden">
        {/* Header */}
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Purchases</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Manage inventory and expenses</p>
          </div>
        </div>

        {/* Unified Search & Actions Header */}
        <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
          <div className="relative w-full max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-8 w-full rounded border border-input bg-card/50 px-2.5 py-1 pl-8 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex h-8 w-auto min-w-[160px] max-w-[220px] rounded border border-input bg-card/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none cursor-pointer"
          >
            <option value="">ALL CATEGORIES</option>
            {uniqueCategories.map(cat => (
              <option key={`filter-${cat}`} value={cat}>{cat.toUpperCase()}</option>
            ))}
          </select>

          {(searchQuery || categoryFilter) && (
            <button
              onClick={handleReset}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded px-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-primary active:scale-95"
              title="Clear search"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <select
              value={printType}
              onChange={(e) => setPrintType(e.target.value)}
              className="flex h-8 w-auto rounded border border-input bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none cursor-pointer"
            >
              <option value="purchases">PURCHASES REPORT</option>
              <option value="expenses">EXPENSES REPORT</option>
            </select>
            <Button size="sm" onClick={() => window.print()} className="h-8 gap-1.5 text-[10px] uppercase font-bold tracking-wider">
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <button
              onClick={() => openModal()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              title="Add Purchase"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table Layout */}
        <div className="flex-1 min-h-0 flex flex-col border border-border rounded-md overflow-hidden bg-background">
          <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Loading purchases...</span>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
              <ShoppingBag className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-[12px] font-bold uppercase tracking-tight text-foreground">No purchases found</p>
              <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">Try adjusting your search or add a new record.</p>
            </div>
          ) : (
              <table ref={mainTableRef} className="w-full min-w-[max-content] border-collapse relative">
                <thead className="sticky top-0 z-10 bg-orange-500 backdrop-blur shadow-sm">
                  <tr className="border-b border-orange-600/20">
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle w-[36px]">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={filteredPurchases.length > 0 && selectedIds.size === filteredPurchases.length}
                          onChange={toggleSelectAll}
                          className="h-3 w-3 rounded border-white text-white focus:ring-white bg-transparent"
                        />
                      </div>
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Date</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Category</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Items</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Qty</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Supplier</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Invoice No.</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Purchased By</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Note</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Amount</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle w-[60px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase._id} onClick={() => setViewModal({ isOpen: true, purchase })} className="cursor-pointer border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="px-3 py-2 align-middle text-[10px] w-[36px]" onClick={(e) => { e.stopPropagation(); toggleSelectRow(purchase._id); }}>
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            readOnly
                            checked={selectedIds.has(purchase._id)}
                            className="h-3 w-3 rounded border-muted-foreground/30 text-primary focus:ring-primary pointer-events-none"
                          />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground tracking-tight">
                        {String(purchase.date || '').split(',')[0].trim() ? formatDate(String(purchase.date || '').split(',')[0].trim()) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{getCategoryFullName(purchase.category)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{purchase.items}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{purchase.qty}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{purchase.supplier || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{purchase.invoiceNo || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{purchase.purchasedBy || '-'}</td>
                      <td className="px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-tight max-w-[200px] truncate" title={purchase.usedForNote}>
                        {purchase.usedForNote ? purchase.usedForNote.length > 30 ? purchase.usedForNote.substring(0, 30) + '...' : purchase.usedForNote : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-tight text-right">₱{String(purchase.amount || '').split(',').reduce((s, v) => s + Number(v.trim() || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1 transition-opacity">
                          <button
                            onClick={() => openModal(purchase)}
                            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(purchase._id)}
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
          
          {/* Separated True Footer - Absolutely at bottom of card */}
          {!isLoading && filteredPurchases.length > 0 && (
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
              <table ref={footerTableRef} className="w-[max-content] border-collapse bg-card hidden sm:table">
                <tbody>
                  <tr>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[9px] w-[36px] bg-card border-t border-border"></td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border"></td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border"></td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border"></td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border"></td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border"></td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border"></td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border"></td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-foreground text-right align-middle bg-card border-t border-border">
                      Total ({filteredPurchases.length} {filteredPurchases.length === 1 ? 'record' : 'records'})
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[10px] font-black text-primary text-right align-middle bg-muted/30 border-t border-border tracking-wider">
                      ₱ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[9px] w-[60px] bg-card border-t border-border text-center sticky right-0 z-[30]"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-[1100px] max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">

              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-card border-b border-border p-5 pb-3.5 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                      {editingId ? <Edit className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    </div>
                    <h2 className="text-[12px] font-bold text-foreground uppercase tracking-tight">
                      {editingId ? 'EDIT PURCHASE' : 'NEW PURCHASE'}
                    </h2>
                  </div>
                  <button onClick={closeModal} className="rounded-full flex h-5.5 w-5.5 items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Scrollable Form */}
              <div className="flex-1 overflow-y-auto p-5 pt-3">
                <form onSubmit={handleSubmit} className="space-y-3" id="purchase-form">

                  {/* Date — top level removed, now per-row */}

                  {/* Category */}
                  <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
                    <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Category</legend>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="block h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select Category</option>
                        <option value="00012 - MOTORPOOL">00012 - MOTORPOOL</option>
                        <option value="4078 - PLANT & FACILITIES">4078 - PLANT & FACILITIES</option>
                        <option value="100E - MAINTENANCE">100E - MAINTENANCE</option>
                        {vehicles.map(v => (
                          <option key={v._id} value={v.plateNumber}>{v.plateNumber.toUpperCase()} - {v.model.toUpperCase()}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </div>
                  </fieldset>

                  {/* Items */}
                  <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-2 min-w-0">
                    <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Date / Items / Qty / Amount / Supplier / Invoice No.</legend>
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 flex-wrap">
                        <input
                          type="date"
                          value={formData.date[index] || ''}
                          onChange={(e) => handleArrayChange('date', index, e.target.value)}
                          required
                          className="block h-8 w-[140px] rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto"
                        />
                        <input
                          value={item}
                          onChange={(e) => handleArrayChange('items', index, e.target.value)}
                          placeholder="Item"
                          required
                          className="block h-8 flex-1 min-w-[120px] rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                        />
                        <input
                          value={formData.qty[index] || ''}
                          onChange={(e) => handleArrayChange('qty', index, e.target.value)}
                          placeholder="Qty"
                          required
                          className="block h-8 w-[70px] rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                        />
                        <input
                          type="number"
                          step="any"
                          value={formData.amount[index] || ''}
                          onChange={(e) => handleArrayChange('amount', index, e.target.value)}
                          placeholder="Amount"
                          required
                          className="block h-8 w-[100px] rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                        />
                        <input
                          value={formData.supplier[index] || ''}
                          onChange={(e) => handleArrayChange('supplier', index, e.target.value)}
                          placeholder="Supplier"
                          className="block h-8 flex-1 min-w-[100px] rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                        />
                        <input
                          value={formData.invoiceNo[index] || ''}
                          onChange={(e) => handleArrayChange('invoiceNo', index, e.target.value)}
                          placeholder="Invoice No."
                          className="block h-8 w-[110px] rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                        />
                        {index === 0 ? (
                          <button type="button" onClick={addItemRow} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <Plus className="h-4 w-4" />
                          </button>
                        ) : (
                          <button type="button" onClick={() => removeItemRow(index)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </fieldset>

                  {/* Purchased By */}
                  <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
                    <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Purchased By</legend>
                    <div className="relative">
                      <select
                        name="purchasedBy"
                        value={formData.purchasedBy}
                        onChange={handleInputChange}
                        className="block h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select Personnel</option>
                        {personnels.map(p => (
                          <option key={p._id} value={`${p.firstname} ${p.lastname}`}>{p.firstname.toUpperCase()} {p.lastname.toUpperCase()}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </div>
                  </fieldset>

                  {/* Budget */}
                  <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
                    <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Budget</legend>
                    <div className="relative">
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground/60 select-none">₱</div>
                      <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleInputChange}
                        placeholder="Budget"
                        className="block h-8 w-full rounded border border-input bg-background pl-7 pr-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                      />
                    </div>
                  </fieldset>

                  {/* Used For / Note */}
                  <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
                    <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Used For / Note</legend>
                    <input
                      name="usedForNote"
                      value={formData.usedForNote}
                      onChange={handleInputChange}
                      placeholder="Note"
                      className="block h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                    />
                  </fieldset>

                </form>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-10 bg-card border-t border-border p-5 pt-3 rounded-b-xl">
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    form="purchase-form"
                    disabled={isSubmitLoading}
                    size="sm"
                    className="min-w-[90px] h-8 text-[10px] uppercase tracking-wider"
                  >
                    {isSubmitLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'SUBMIT'}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* View Modal */}
        {viewModal.isOpen && viewModal.purchase && (() => {
          const p = viewModal.purchase;
          const splitField = (val) => val ? String(val).split(',').map(s => s.trim()) : [''];
          const dates = splitField(p.date).map(d => { try { return formatDate(d); } catch { return d; } });
          const items = splitField(p.items);
          const qtys = splitField(p.qty);
          const amounts = splitField(p.amount);
          const suppliers = splitField(p.supplier);
          const invoices = splitField(p.invoiceNo);
          const rows = Math.max(items.length, 1);
          const inputClass = "block h-8 w-full rounded border border-input bg-muted/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm cursor-default select-none opacity-80 overflow-hidden text-ellipsis whitespace-nowrap";
          const roInput = (value, cls = '') => (
            <input readOnly disabled value={value || ''} className={`block h-8 rounded border border-input bg-muted/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm cursor-default opacity-80 ${cls}`} />
          );
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
              <div className="w-full max-w-[1100px] max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="sticky top-0 z-10 bg-card border-b border-border p-5 pb-3.5 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                        <Edit className="h-3 w-3" />
                      </div>
                      <h2 className="text-[12px] font-bold text-foreground uppercase tracking-tight">PURCHASE DETAILS</h2>
                    </div>
                    <button onClick={() => setViewModal({ isOpen: false, purchase: null })} className="rounded-full flex h-5.5 w-5.5 items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 pt-3 space-y-3">

                  {/* Category */}
                  <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
                    <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Category</legend>
                    {roInput(getCategoryFullName(p.category), 'w-full')}
                  </fieldset>

                  {/* Items */}
                  <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-2 min-w-0">
                    <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Date / Items / Qty / Amount / Supplier / Invoice No.</legend>
                    {Array.from({ length: rows }, (_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {roInput(dates[i] || '', 'w-[140px] shrink-0')}
                        {roInput(items[i] || '', 'flex-1 min-w-0')}
                        {roInput(qtys[i] || '', 'w-[70px] shrink-0')}
                        {roInput(amounts[i] ? `₱${Number(amounts[i]).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '', 'w-[100px] shrink-0')}
                        {roInput(suppliers[i] || '', 'flex-1 min-w-0')}
                        {roInput(invoices[i] || '', 'w-[110px] shrink-0')}
                        <div className="h-8 w-8 shrink-0" />
                      </div>
                    ))}
                  </fieldset>

                  {/* Purchased By */}
                  <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
                    <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Purchased By</legend>
                    {roInput(p.purchasedBy || '', 'w-full')}
                  </fieldset>

                  {/* Budget */}
                  {p.budget > 0 && (
                    <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
                      <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Budget</legend>
                      {roInput(`₱${Number(p.budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'w-full')}
                    </fieldset>
                  )}

                  {/* Used For / Note */}
                  <fieldset className="rounded-lg border border-border bg-card px-3 pb-3 pt-2 shadow-sm space-y-1.5 min-w-0">
                    <legend className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 -ml-1">Used For / Note</legend>
                    {roInput(p.usedForNote || '', 'w-full')}
                  </fieldset>

                </div>

                {/* Footer */}
                <div className="sticky bottom-0 z-10 bg-card border-t border-border p-5 pt-3 rounded-b-xl">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase tracking-wider" onClick={() => setViewModal({ isOpen: false, purchase: null })}>Close</Button>
                    <Button size="sm" className="h-8 text-[10px] uppercase tracking-wider" onClick={() => { setViewModal({ isOpen: false, purchase: null }); openModal(p); }}>Edit</Button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setPurchaseToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Purchase?"
          description="Are you sure you want to remove this purchase record? This action cannot be undone."
          confirmText="REMOVE"
          variant="destructive"
        />
      </div>

      {/* ====== PRINT UI ====== */}
      <style>{`
      @media print {
        @page { size: ${printType === 'expenses' ? 'portrait' : 'landscape'}; margin: ${printType === 'expenses' ? '0.5cm' : '10mm'}; }
      }
    `}</style>
      <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:text-black print:z-[99999] font-sans">

        {printType === 'purchases' ? (
          <>
            <div className="text-center mb-4">
              <div className="text-[14pt] font-bold tracking-tight">ENERTECH SYSTEM INDUSTRIES, INC</div>
              <div className="text-[11pt]">LOGISTIC DEPARTMENT</div>
              <div className="text-[11pt] font-medium tracking-wide mt-1">PURCHASES REPORT</div>
            </div>

            <div className="flex justify-between items-end mb-1 text-[8pt]">
              <div className="font-medium">Filters: {generateFiltersText()}</div>
              <div className="font-medium">Date Generated: {(new Date().getMonth() + 1).toString().padStart(2, '0')}-{(new Date().getDate()).toString().padStart(2, '0')}-{new Date().getFullYear()}</div>
            </div>

            <table className="w-full border-collapse border border-black text-[7pt] leading-tight" style={{ tableLayout: 'auto' }}>
              <thead className="bg-[#f2f2f2]">
                <tr>
                  <th className="border border-black px-1 py-1 font-bold whitespace-nowrap align-middle">DATE</th>
                  <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">CATEGORY</th>
                  <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">ITEMS</th>
                  <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">QTY</th>
                  <th className="border border-black px-1 py-1 font-bold align-middle text-right whitespace-nowrap">AMOUNT</th>
                  <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">SUPPLIER</th>
                  <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">INVOICE NO.</th>
                  <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">PURCHASED BY</th>
                  <th className="border border-black px-1 py-1 font-bold align-middle whitespace-nowrap">NOTE</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.flatMap(p => {
                  const itemList = String(p.items || '').split(',').map(s => s.trim()).filter(Boolean);
                  const qtyList = String(p.qty || '').split(',').map(s => s.trim());
                  const supplierList = String(p.supplier || '').split(',').map(s => s.trim());
                  const invoiceList = String(p.invoiceNo || '').split(',').map(s => s.trim());
                  const amountList = String(p.amount || '').split(',').map(s => s.trim());
                  const dateList = String(p.date || '').split(',').map(s => s.trim());
                  const rows = Math.max(itemList.length, 1);
                  return Array.from({ length: rows }, (_, i) => (
                    <tr key={`${p._id}-${i}`} className="break-inside-avoid">
                      <td className="border border-black px-1 py-1 align-top whitespace-nowrap">{formatDate(dateList[i] || dateList[0] || p.date)}</td>
                      <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap font-medium">{getCategoryFullName(p.category)}</td>
                      <td className="border border-black px-1 py-1 align-top uppercase font-medium">{itemList[i] || ''}</td>
                      <td className="border border-black px-1 py-1 align-top uppercase text-center">{qtyList[i] || ''}</td>
                      <td className="border border-black px-1 py-1 align-top text-right font-bold whitespace-nowrap">{amountList[i] ? Number(amountList[i]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>
                      <td className="border border-black px-1 py-1 align-top uppercase">{supplierList[i] || ''}</td>
                      <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap">{invoiceList[i] || ''}</td>
                      <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap">{p.purchasedBy || '-'}</td>
                      <td className="border border-black px-1 py-1 align-top uppercase leading-tight">{i === 0 ? (p.usedForNote || '-') : ''}</td>
                    </tr>
                  ));
                })}
                {/* Total Row */}
                <tr className="bg-[#f2f2f2] break-inside-avoid">
                  <td className="border border-black px-1 py-1 font-bold bg-white" colSpan={3}></td>
                  <td className="border border-black px-1 py-1 font-bold text-center">TOTAL</td>
                  <td className="border border-black px-1 py-1 font-bold text-right whitespace-nowrap">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="border border-black px-1 py-1 font-bold bg-white" colSpan={4}></td>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          <>
            {/* === EXPENSES REPORT === */}
            <div className="text-center text-[8pt] font-bold tracking-tight text-black flex flex-col items-center">
              <div>ENERTECH SYSTEMS INDUSTRIES, INC.</div>
              <div>Expenses Report</div>
              <div className="text-[8pt] font-normal flex justify-center">
                <span className="font-bold">For the period of</span>
                <span className="inline-block border-b border-black w-20"></span>
                <span className="font-bold">to</span>
                <span className="inline-block border-b border-black w-[80px]"></span>
              </div>
            </div>

            <br />

            <div className="text-[8pt] font-bold text-black flex items-end relative justify-center w-full h-[14px]">
              <div className="absolute left-0 bottom-0 leading-none">NAME:</div>
              <span className="inline-block border-b-2 border-black w-[600px]"></span>
            </div>

            <br />

            <table className="w-full border-collapse text-[8pt] text-black" style={{ tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th className="border border-black px-1.5 py-1 text-center font-bold whitespace-nowrap w-[15%] uppercase">DATE</th>
                  <th className="border border-black px-1.5 py-1 text-center font-bold w-[35%] uppercase">PARTICULARS</th>
                  <th className="border border-black px-1.5 py-1 text-center font-bold whitespace-nowrap w-[15%] uppercase">REF O.R</th>
                  <th className="border border-black px-1.5 py-1 text-center font-bold w-[20%] uppercase">CHARGE TO J.O #</th>
                  <th className="border border-black px-1.5 py-1 text-center font-bold whitespace-nowrap w-[15%] uppercase">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {(selectedIds.size > 0 ? filteredPurchases.filter(p => selectedIds.has(p._id)) : filteredPurchases).flatMap(p => {
                  const itemList = String(p.items || '').split(',').map(s => s.trim()).filter(Boolean);
                  const invoiceList = String(p.invoiceNo || '').split(',').map(s => s.trim());
                  const amountList = String(p.amount || '').split(',').map(s => s.trim());
                  const dateList = String(p.date || '').split(',').map(s => s.trim());
                  const rows = Math.max(itemList.length, 1);
                  return Array.from({ length: rows }, (_, i) => (
                    <tr key={`${p._id}-${i}`} style={{ height: '0.5cm' }}>
                      <td className="border border-black px-1.5 whitespace-nowrap text-left align-middle font-medium">{formatDate(dateList[i] || dateList[0] || p.date)}</td>
                      <td className="border border-black px-1.5 uppercase align-middle font-medium whitespace-nowrap">{itemList[i] || '-'}</td>
                      <td className="border border-black px-1.5 uppercase whitespace-nowrap text-left align-middle font-medium">{invoiceList[i] || '-'}</td>
                      <td className="border border-black px-1.5 uppercase text-left align-middle font-medium whitespace-nowrap">{getCategoryFullName(p.category)}</td>
                      <td className="border border-black px-1.5 whitespace-nowrap text-right font-bold align-middle">
                        {amountList[i] ? Number(amountList[i]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      </td>
                    </tr>
                  ));
                })}

              </tbody>
              <tfoot>
                {(() => {
                  const printList = selectedIds.size > 0 ? filteredPurchases.filter(p => selectedIds.has(p._id)) : filteredPurchases;
                  const totalExpenses = printList.reduce((sum, p) => sum + String(p.amount || '').split(',').reduce((s, v) => s + Number(v.trim() || 0), 0), 0);
                  const aca = printList.reduce((sum, p) => sum + Number(p.budget || 0), 0);
                  const forReturn = aca - totalExpenses;
                  return (
                    <>
                      <tr>
                        <td colSpan={3} className="border-0"></td>
                        <td className="border-0 px-1.5 py-0.5 font-bold text-right align-middle text-[8pt] whitespace-nowrap">Total Expenses:</td>
                        <td className="border-0 px-1.5 py-0.5 font-bold text-right align-middle text-[8pt]">
                          ₱{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {aca > 0 && (
                        <>
                          <tr>
                            <td colSpan={3} className="border-0"></td>
                            <td className="border-0 px-1.5 py-0.5 font-bold text-right align-middle text-[8pt] whitespace-nowrap">ACA:</td>
                            <td className="border-0 px-1.5 py-0.5 font-bold text-right align-middle text-[8pt]">
                              ₱{aca.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="border-0"></td>
                            <td className="border-0 px-1.5 py-0.5 font-bold text-right align-middle text-[8pt] whitespace-nowrap">For Return / Reimbursement:</td>
                            <td className="border-0 px-1.5 py-0.5 font-bold text-right align-middle text-[8pt]">
                              {forReturn < 0 ? `-₱${Math.abs(forReturn).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `₱${forReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </td>
                          </tr>
                        </>
                      )}
                      <tr>
                        <td colSpan={5} className="border-0 px-20 font-bold text-[8pt] text-left">
                          <div className="flex w-fit items-end whitespace-nowrap">
                            <span className="min-w-fit pr-1">Less: Cash Advance per C.V #</span>
                            <span className="border-b border-black w-[80px] inline-block"></span>
                            <span className="min-w-fit px-1">dated</span>
                            <span className="border-b border-black w-[80px] inline-block"></span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="border-0 px-20 pt-1.5 font-bold text-[8pt] text-left">
                          <div className="flex w-fit items-end whitespace-nowrap">
                            <span className="min-w-fit pr-1">Amount Due to (From) Company</span>
                            <span className="border-b border-black w-[250px] inline-block"></span>
                            <span className="w-10"></span>
                            <span className="border-b border-black w-[120px] inline-block"></span>
                          </div>
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tfoot>
            </table>
            <br />
            <div className="grid grid-cols-3 gap-8 text-[8pt] font-bold text-black w-[90%]">
              <div>Prepared by: JRAZ</div>
              <div>Recommended by: EAD</div>
              <div>Approved for Payment: LBC</div>
            </div>
            <div className="mt-4 text-[8pt] text-black">
              <div>Note: Refer to attached supporting papers.</div>
              <div>/mdm07</div>
            </div>
          </>
        )}

      </div>
    </>
  );
}

export default PurchasesPage;

