import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  RotateCcw,
  ShoppingBag,
  Calendar,
  Printer
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

  const [formData, setFormData] = useState({
    date: '',
    category: '',
    items: '',
    qty: '',
    amount: '',
    supplier: '',
    invoiceNo: '',
    purchasedBy: '',
    usedForNote: ''
  });

  const toast = useAppToast();

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

  const openModal = (purchase = null) => {
    if (purchase) {
      setFormData({
        date: new Date(purchase.date).toISOString().split('T')[0],
        category: purchase.category || '',
        items: purchase.items,
        qty: purchase.qty,
        amount: purchase.amount,
        supplier: purchase.supplier || '',
        invoiceNo: purchase.invoiceNo || '',
        purchasedBy: purchase.purchasedBy || '',
        usedForNote: purchase.usedForNote || ''
      });
      setEditingId(purchase._id);
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: '',
        items: '',
        qty: '',
        amount: '',
        supplier: '',
        invoiceNo: '',
        purchasedBy: '',
        usedForNote: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      date: '',
      category: '',
      items: '',
      qty: '',
      amount: '',
      supplier: '',
      invoiceNo: '',
      purchasedBy: '',
      usedForNote: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);

    try {
      if (editingId) {
        await axios.put(`/api/purchases/${editingId}`, formData);
        toast.success('Purchase updated successfully');
      } else {
        await axios.post('/api/purchases', formData);
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

  const totalAmount = filteredPurchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);

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
        <div className="flex-1 overflow-auto rounded-md border border-border">
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
            <div className="relative w-full overflow-auto">
              <table className="w-full min-w-[max-content] border-collapse relative">
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
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-right align-middle">Amount</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Supplier</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Invoice No.</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Purchased By</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-left align-middle">Note</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white text-center align-middle w-[60px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase._id} onClick={() => toggleSelectRow(purchase._id)} className="cursor-pointer border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="px-3 py-2 align-middle text-[10px] w-[36px]">
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
                        {new Date(purchase.date).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{getCategoryFullName(purchase.category)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{purchase.items}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{purchase.qty}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-primary tracking-tight text-right">₱{purchase.amount?.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{purchase.supplier || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{purchase.invoiceNo || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground uppercase tracking-tight">{purchase.purchasedBy || '-'}</td>
                      <td className="px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-tight max-w-[200px] truncate" title={purchase.usedForNote}>
                        {purchase.usedForNote ? purchase.usedForNote.length > 30 ? purchase.usedForNote.substring(0, 30) + '...' : purchase.usedForNote : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
            </div>
          )}
        </div>

        {/* Modern Compact Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 p-4 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="w-full max-w-[540px] rounded-xl border border-border bg-card p-5 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                    {editingId ? <Edit className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  </div>
                  <h2 className="text-[12px] font-bold text-foreground">
                    {editingId ? 'EDIT PURCHASE' : 'NEW PURCHASE'}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="flex h-5.5 w-5.5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Date *</label>
                    <div className="relative w-full">
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="block h-8 w-full rounded border border-input bg-background px-2.5 py-1 pr-8 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2.5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                    >
                      <option value="" disabled>SELECT CATEGORY</option>
                      <option value="00012 - MOTORPOOL">00012 - MOTORPOOL</option>
                      <option value="4078 - PLANT & FACILITIES">4078 - PLANT & FACILITIES</option>
                      <option value="100E - MAINTENANCE">100E - MAINTENANCE</option>
                      {vehicles.map(v => (
                        <option key={v._id} value={v.plateNumber}>{v.plateNumber.toUpperCase()} - {v.model.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Items *</label>
                    <input
                      type="text"
                      name="items"
                      value={formData.items}
                      onChange={handleInputChange}
                      required
                      className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Quantity *</label>
                    <input
                      type="text"
                      name="qty"
                      value={formData.qty}
                      onChange={handleInputChange}
                      required
                      className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Amount (₱) *</label>
                    <input
                      type="number"
                      step="any"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Supplier</label>
                    <input
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Invoice No.</label>
                    <input
                      name="invoiceNo"
                      value={formData.invoiceNo}
                      onChange={handleInputChange}
                      className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Purchased By</label>
                    <select
                      name="purchasedBy"
                      value={formData.purchasedBy}
                      onChange={handleInputChange}
                      className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                    >
                      <option value="">SELECT PERSONNEL</option>
                      {personnels.map(p => (
                        <option key={p._id} value={`${p.firstname} ${p.lastname}`}>{p.firstname.toUpperCase()} {p.lastname.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Used For/Note</label>
                    <input
                      name="usedForNote"
                      value={formData.usedForNote}
                      onChange={handleInputChange}
                      className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitLoading}
                    className="inline-flex h-8 min-w-[90px] items-center justify-center rounded-lg bg-primary px-4 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'SUBMIT'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                {filteredPurchases.map(p => (
                  <tr key={p._id} className="break-inside-avoid">
                    <td className="border border-black px-1 py-1 align-top whitespace-nowrap">{formatDate(p.date)}</td>
                    <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap font-medium">{getCategoryFullName(p.category)}</td>
                    <td className="border border-black px-1 py-1 align-top uppercase font-medium">{p.items}</td>
                    <td className="border border-black px-1 py-1 align-top uppercase text-center">{p.qty}</td>
                    <td className="border border-black px-1 py-1 align-top text-right font-bold whitespace-nowrap">{Number(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="border border-black px-1 py-1 align-top uppercase">{p.supplier || '-'}</td>
                    <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap">{p.invoiceNo || '-'}</td>
                    <td className="border border-black px-1 py-1 align-top uppercase whitespace-nowrap">{p.purchasedBy || '-'}</td>
                    <td className="border border-black px-1 py-1 align-top uppercase leading-tight">{p.usedForNote || '-'}</td>
                  </tr>
                ))}
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
                {(selectedIds.size > 0 ? filteredPurchases.filter(p => selectedIds.has(p._id)) : filteredPurchases).map((p, i) => (
                  <tr key={p._id} style={{ height: '0.5cm' }}>
                    <td className="border border-black px-1.5 whitespace-nowrap text-center align-middle font-medium">{formatDate(p.date)}</td>
                    <td className="border border-black px-1.5 uppercase align-middle font-medium">{p.items || '-'}</td>
                    <td className="border border-black px-1.5 uppercase whitespace-nowrap text-center align-middle font-medium">{p.invoiceNo || '-'}</td>
                    <td className="border border-black px-1.5 uppercase text-left align-middle font-medium">{getCategoryFullName(p.category)}</td>
                    <td className="border border-black px-1.5 whitespace-nowrap text-right font-bold align-middle">
                      {Number(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}

              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="border-0"></td>
                  <td className="border-0 px-1.5 py-1.5 font-bold text-right align-middle text-[10pt]">
                    Total Expenses:
                  </td>
                  <td className="border-0 px-1.5 py-1.5 font-bold text-right align-middle text-[10pt]">
                    ₱{Number((selectedIds.size > 0 ? filteredPurchases.filter(p => selectedIds.has(p._id)) : filteredPurchases).reduce((sum, p) => sum + Number(p.amount || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
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
              </tfoot>
            </table>
            <br />
            <div className="grid grid-cols-3 gap-8 text-[8pt] font-bold text-black w-[90%]">
              <div>Prepared by:</div>
              <div>Recommended by: EAD</div>
              <div>Approved for Payment: LBC</div>
            </div>
          </>
        )}

      </div>
    </>
  );
}

export default PurchasesPage;

