import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  MapPin,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { useAppToast } from '../../../components/ui/alert-toast-provider';
import AlertDialog from '../../../components/ui/alert-dialog';

function DestinationPage() {
  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [destinationToDelete, setDestinationToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    customerSupplier: ''
  });

  const toast = useAppToast();

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const response = await axios.get('/api/destinations');
      setDestinations(response.data);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      toast.error('Failed to load destinations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (destination = null) => {
    if (destination) {
      setFormData({
        name: destination.name,
        customerSupplier: destination.customerSupplier || ''
      });
      setEditingId(destination._id);
    } else {
      setFormData({
        name: '',
        customerSupplier: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', customerSupplier: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);

    try {
      if (editingId) {
        await axios.put(`/api/destinations/${editingId}`, formData);
        toast.success('Destination updated successfully');
      } else {
        await axios.post('/api/destinations', formData);
        toast.success('Destination added successfully');
      }

      fetchDestinations();
      closeModal();
    } catch (error) {
      console.error('Error saving destination:', error);
      toast.error(error.response?.data?.message || 'Failed to save destination');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDestinationToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!destinationToDelete) return;

    try {
      await axios.delete(`/api/destinations/${destinationToDelete}`);
      toast.success('Destination deleted successfully');
      fetchDestinations();
    } catch (error) {
      console.error('Error deleting destination:', error);
      toast.error('Failed to delete destination');
    } finally {
      setDestinationToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    toast.success('Filters cleared');
  };

  const filteredDestinations = destinations.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.customerSupplier || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500">

      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Destinations</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Manage Delivery Routes Effortlessly</p>
        </div>
      </div>

      {/* Unified Search & Actions Header */}
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <div className="relative w-full max-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="SEARCH DESTINATIONS..."
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
          title="Add Destination"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Card Grid Layout */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loading locations...</span>
          </div>
        ) : filteredDestinations.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
            <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No destinations found</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Try adjusting your search or add a new location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
            {filteredDestinations.map((destination) => (
              <div
                key={destination._id}
                className="group relative flex flex-col gap-1.5 rounded border border-border bg-card p-2.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md animate-in fade-in zoom-in-95 duration-300"
              >
                {/* Floating Hover Actions */}
                <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10">
                  <button
                    onClick={() => openModal(destination)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/20 bg-background/80 text-primary shadow-sm backdrop-blur-md transition-all hover:bg-primary hover:text-primary-foreground"
                    title="Edit Destination"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(destination._id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-destructive/20 bg-background/80 text-destructive shadow-sm backdrop-blur-md transition-all hover:bg-destructive hover:text-destructive-foreground"
                    title="Remove Destination"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Destination Info Section */}
                <div className="flex items-stretch gap-2.5">
                  <div className="flex w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>

                    <div className="flex flex-1 flex-col gap-0.5 min-w-0 justify-center">
                    <h3 className="text-[11px] font-bold text-foreground leading-tight truncate uppercase tracking-tight">
                      {destination.customerSupplier ? `${destination.customerSupplier.toUpperCase()} - ` : ''}{destination.name.toUpperCase()}
                    </h3>
                  </div>
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
                <h2 className="text-[12px] font-bold text-foreground">
                  {editingId ? 'EDIT DESTINATION' : 'NEW DESTINATION'}
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
                <input
                  id="customerSupplier"
                  name="customerSupplier"
                  value={formData.customerSupplier}
                  onChange={handleInputChange}
                  placeholder="CUSTOMER / SUPPLIER"
                  className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                />
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="DESTINATION"
                  className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-[10px] font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 uppercase tracking-wider min-w-[90px]"
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
          setDestinationToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Destination?"
        description="Are you sure you want to remove this location? This action cannot be undone."
        confirmText="REMOVE"
        variant="destructive"
      />
    </div>
  );
}

export default DestinationPage;
