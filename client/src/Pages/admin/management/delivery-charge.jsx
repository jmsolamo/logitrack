import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  RotateCcw,
  ChevronDown,
  MapPin,
  Banknote
} from 'lucide-react';
import axios from 'axios';
import { useAppToast } from '../../../components/ui/alert-toast-provider';
import AlertDialog from '../../../components/ui/alert-dialog';

function DeliveryChargePage() {
  const [charges, setCharges] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chargeToDelete, setChargeToDelete] = useState(null);

  const [formData, setFormData] = useState({
    plateNumber: '',
    destination: '',
    charge: ''
  });

  const toast = useAppToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [chargesRes, vehiclesRes, destinationsRes] = await Promise.all([
        axios.get('/api/delivery-charges'),
        axios.get('/api/vehicles'),
        axios.get('/api/destinations')
      ]);
      setCharges(chargesRes.data);
      setVehicles(vehiclesRes.data);
      setDestinations(destinationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load pricing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (charge = null) => {
    if (charge) {
      setFormData({
        plateNumber: charge.plateNumber,
        destination: charge.destination,
        charge: charge.charge
      });
      setEditingId(charge._id);
    } else {
      setFormData({
        plateNumber: '',
        destination: '',
        charge: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ plateNumber: '', destination: '', charge: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Local duplicate check to prevent console errors
    const isDuplicate = charges.some(c => 
      c.plateNumber === formData.plateNumber && 
      c.destination === formData.destination &&
      c._id !== editingId
    );

    if (isDuplicate) {
      toast.warning('A delivery charge for this route already exists');
      return;
    }

    setIsSubmitLoading(true);

    try {
      if (editingId) {
        await axios.put(`/api/delivery-charges/${editingId}`, formData);
        toast.success('Charge entry updated');
      } else {
        await axios.post('/api/delivery-charges', formData);
        toast.success('Charge entry added');
      }

      const response = await axios.get('/api/delivery-charges');
      setCharges(response.data);
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save charge');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = (id) => {
    setChargeToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!chargeToDelete) return;

    try {
      await axios.delete(`/api/delivery-charges/${chargeToDelete}`);
      toast.success('Charge entry removed');
      setCharges(prev => prev.filter(c => c._id !== chargeToDelete));
    } catch (error) {
      console.error('Error deleting charge:', error);
      toast.error('Failed to remove charge');
    } finally {
      setChargeToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    toast.success('Filters cleared');
  };

  const filteredCharges = charges.filter(c => 
    c.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500">

      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Delivery Charges</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Manage Rate Cards Effortlessly</p>
        </div>
      </div>

      {/* Unified Search & Actions Header */}
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <div className="relative w-full max-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="SEARCH ROUTES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-8 w-full rounded border border-input bg-card/50 px-2.5 py-1 pl-8 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
          />
        </div>

        {searchQuery && (
          <button
            onClick={handleReset}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded px-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-primary active:scale-95"
            title="Clear search"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}

        <button
          onClick={() => openModal()}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          title="Add Delivery Charge"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Card Grid Layout */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loading rates...</span>
          </div>
        ) : filteredCharges.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
            <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No delivery charges found</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Try adjusting your search or add a new rate card.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
            {filteredCharges.map((item) => (
              <div
                key={item._id}
                className="group relative flex flex-col gap-1 rounded border border-border bg-card p-2.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md animate-in fade-in zoom-in-95 duration-300"
              >
                {/* Floating Hover Actions */}
                <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10">
                  <button
                    onClick={() => openModal(item)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/20 bg-background/80 text-primary shadow-sm backdrop-blur-md transition-all hover:bg-primary hover:text-primary-foreground"
                    title="Edit Entry"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-destructive/20 bg-background/80 text-destructive shadow-sm backdrop-blur-md transition-all hover:bg-destructive hover:text-destructive-foreground"
                    title="Remove Entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Info Section */}
                <div className="flex items-start gap-2.5">
                  <div className="flex w-8 shrink-0 flex-col gap-1 items-center justify-center py-2 rounded bg-primary/5 text-primary">
                    <Banknote className="h-5 w-5" />
                  </div>

                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[11px] font-bold text-foreground leading-tight truncate uppercase tracking-tight">
                        {(() => {
                          const v = vehicles.find(veh => veh.plateNumber === item.plateNumber);
                          return v ? `${item.plateNumber} - ${v.model.toUpperCase()}` : item.plateNumber;
                        })()}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground/80 uppercase tracking-widest">
                      <span className="truncate">
                        {(() => {
                          const d = destinations.find(dest => dest.name === item.destination);
                          return d && d.customerSupplier ? `${d.customerSupplier.toUpperCase()} - ${item.destination.toUpperCase()}` : item.destination.toUpperCase();
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer with Charge */}
                <div className="mt-1 flex items-center justify-end border-t border-border/40 pt-1.5 text-[8px] text-muted-foreground uppercase">
                  <span className="text-[11px] font-bold text-primary tracking-wider">
                    ₱{Number(item.charge).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Compact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[360px] rounded-xl border border-border bg-card p-5 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                  {editingId ? <Edit className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                </div>
                <h2 className="text-[12px] font-bold text-foreground uppercase tracking-tight">
                  {editingId ? 'EDIT DELIVERY CHARGE' : 'NEW DELIVERY CHARGE'}
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
              <div className="space-y-1">
                 <div className="relative">
                  <select
                    id="plateNumber"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                    required
                    className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>SELECT PLATE NUMBER</option>
                    {vehicles.map(v => (
                      <option key={v._id} value={v.plateNumber} className="font-bold">
                        {v.plateNumber.toUpperCase()} - {v.model.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <select
                    id="destination"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    required
                    className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>SELECT DESTINATION</option>
                    {destinations.map(d => (
                      <option key={d._id} value={d.name} className="font-bold">
                        {d.customerSupplier ? `${d.customerSupplier.toUpperCase()} - ` : ''}{d.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground/60 select-none">
                    ₱
                  </div>
                  <input
                    id="charge"
                    name="charge"
                    type="number"
                    value={formData.charge}
                    onChange={handleInputChange}
                    required
                    placeholder="DELIVERY CHARGE (₱)"
                    className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 pl-7 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-5 text-[10px] font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 uppercase tracking-wider min-w-[90px]"
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
          setChargeToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Pricing Entry?"
        description="Are you sure you want to remove this delivery charge? This action cannot be undone."
        confirmText="REMOVE"
        variant="destructive"
      />
    </div>
  );
}

export default DeliveryChargePage;
