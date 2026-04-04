import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Users,
  ChevronDown,
  Truck,
  UserPlus,
  Wrench,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { useAppToast } from '../../../components/ui/alert-toast-provider';
import AlertDialog from '../../../components/ui/alert-dialog';

function PersonnelsPage() {
  const [personnels, setPersonnels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState(null);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [filterPosition, setFilterPosition] = useState('All');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    position: ''
  });

  const toast = useAppToast();

  const positions = ['Driver', 'Helper', 'Maintenance'];

  useEffect(() => {
    fetchPersonnels();
  }, []);

  const fetchPersonnels = async () => {
    try {
      const response = await axios.get('/api/personnels');
      setPersonnels(response.data);
    } catch (error) {
      console.error('Error fetching personnels:', error);
      toast.error('Failed to load personnels');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (pos, personne = null) => {
    if (personne) {
      setFormData({
        firstname: personne.firstname,
        lastname: personne.lastname,
        position: personne.position
      });
      setEditingId(personne._id);
    } else {
      setFormData({
        firstname: '',
        lastname: '',
        position: pos
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
    setIsAddDropdownOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ firstname: '', lastname: '', position: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);

    try {
      if (editingId) {
        await axios.put(`/api/personnels/${editingId}`, formData);
        toast.success('Personnel updated successfully');
      } else {
        await axios.post('/api/personnels', formData);
        toast.success('Personnel added successfully');
      }

      fetchPersonnels();
      closeModal();
    } catch (error) {
      console.error('Error saving personnel:', error);
      toast.error(error.response?.data?.message || 'Failed to save personnel');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = (id) => {
    setPersonnelToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!personnelToDelete) return;

    try {
      await axios.delete(`/api/personnels/${personnelToDelete}`);
      toast.success('Personnel deleted successfully');
      fetchPersonnels();
    } catch (error) {
      console.error('Error deleting personnel:', error);
      toast.error('Failed to delete personnel');
    } finally {
      setPersonnelToDelete(null);
      setIsDeleteDialogOpen(false); // Close the dialog
    }
  };


  const handleReset = () => {
    setSearchQuery('');
    setFilterPosition('All');
    toast.success('Filters cleared');
  };

  const filteredPersonnels = personnels.filter(p => {
    const matchesSearch =
      p.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lastname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.position.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterPosition === 'All' || p.position === filterPosition;

    return matchesSearch && matchesFilter;
  });

  const getPositionStyles = (pos) => {
    switch (pos) {
      case 'Driver':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Helper':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Maintenance':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500">

      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Personnels</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Manage Your Personnels Effortlessly</p>
        </div>
      </div>

      {/* Unified Search & Filters Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center border-b border-border pb-4">
        <div className="relative w-full max-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="SEARCH MEMBERS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-8 w-full rounded border border-input bg-card/50 px-2.5 py-1 pl-8 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
          />
        </div>

        <div className="relative inline-block">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="inline-flex h-8 min-w-[110px] items-center justify-between gap-2 rounded border border-input bg-card/50 px-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
          >
            <span className="truncate">{filterPosition === 'All' ? 'ALL ROLES' : filterPosition.toUpperCase()}</span>
            <ChevronDown className={`h-2.5 w-2.5 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFilterDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsFilterDropdownOpen(false)}
              />
              <div className="absolute left-0 z-20 mt-1 w-40 origin-top-left rounded border border-border bg-popover text-popover-foreground shadow-lg outline-none animate-in fade-in zoom-in-95 backdrop-blur-sm">
                <div className="py-1">
                  <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 mb-1">Filter by Position:</p>
                  <button
                    onClick={() => { setFilterPosition('All'); setIsFilterDropdownOpen(false); }}
                    className={`flex w-full items-center px-3 py-2 text-[11px] font-bold uppercase tracking-tight transition-colors ${filterPosition === 'All' ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'}`}
                  >
                    All Roles
                  </button>
                  {positions.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => { setFilterPosition(pos); setIsFilterDropdownOpen(false); }}
                      className={`flex w-full items-center px-3 py-2 text-[11px] font-bold uppercase tracking-tight transition-colors ${filterPosition === pos ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'}`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {(searchQuery || filterPosition !== 'All') && (
          <button
            onClick={handleReset}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded px-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-primary active:scale-95"
            title="Clear all filters"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}

        {/* ADD PERSONNEL DROPDOWN (ALIGNED RIGHT) */}
        <div className="relative ml-auto">
          <button
            onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title="Add Personnel"
          >
            <Plus className="h-4 w-4" />
          </button>

          {isAddDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsAddDropdownOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 min-w-[140px] origin-top-right rounded border border-border bg-popover text-popover-foreground shadow-lg outline-none animate-in fade-in zoom-in-95 backdrop-blur-sm">
                <div className="py-1">
                  <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 mb-1">Select Position:</p>
                  {positions.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => openModal(pos)}
                      className="flex w-full items-center px-3 py-2 text-[11px] font-bold uppercase tracking-tight hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card Grid Layout */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loading team...</span>
          </div>
        ) : filteredPersonnels.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
            <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No personnels found</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Try adjusting your search or add a new team member.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
            {filteredPersonnels.map((personnel) => (
              <div
                key={personnel._id}
                className="group relative flex flex-col gap-1.5 rounded border border-border bg-card p-2.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md animate-in fade-in zoom-in-95 duration-300"
              >
                {/* Floating Hover Actions */}
                <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10">
                  <button
                    onClick={() => openModal(personnel.position, personnel)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/20 bg-background/80 text-primary shadow-sm backdrop-blur-md transition-all hover:bg-primary hover:text-primary-foreground"
                    title="Edit Personnel"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(personnel._id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-destructive/20 bg-background/80 text-destructive shadow-sm backdrop-blur-md transition-all hover:bg-destructive hover:text-destructive-foreground"
                    title="Remove Personnel"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Personnel Info Section */}
                <div className="flex items-stretch gap-2.5">
                  <div className={`flex w-8 shrink-0 items-center justify-center rounded ${getPositionStyles(personnel.position).split(' ')[0]} ${getPositionStyles(personnel.position).split(' ')[1]}`}>
                    {personnel.position === 'Driver' ? <Truck className="h-5 w-5" /> :
                      personnel.position === 'Helper' ? <UserPlus className="h-5 w-5" /> :
                        personnel.position === 'Maintenance' ? <Wrench className="h-5 w-5" /> :
                          <Users className="h-5 w-5" />}
                  </div>

                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <h3 className="text-[11px] font-bold text-foreground leading-tight truncate uppercase tracking-tight">
                      {personnel.lastname.toUpperCase()}, {personnel.firstname.toUpperCase()}
                    </h3>

                    <div className="flex">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${getPositionStyles(personnel.position)}`}>
                        {personnel.position}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer with UID */}
                <div className="mt-1 flex items-center justify-between border-t border-border/40 pt-1.5 text-[8px] text-muted-foreground uppercase">
                  <span className="font-semibold tracking-tighter opacity-80">UID: {personnel._id.slice(-8).toUpperCase()}</span>
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
                  {editingId ? `EDIT ${formData.position.toUpperCase()}` : `NEW ${formData.position.toUpperCase()}`}
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
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>SELECT ROLE</option>
                    {positions.map(pos => (
                      <option key={pos} value={pos} className="font-bold">{pos.toUpperCase()}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <input
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  required
                  placeholder="LAST NAME"
                  className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                />
              </div>

              <div className="space-y-1">
                <input
                  id="firstname"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  required
                  placeholder="FIRST NAME"
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
          setPersonnelToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Personnel?"
        description="Are you sure you want to remove this team member? This action cannot be undone."
        confirmText="REMOVE"
        variant="destructive"
      />
    </div>
  );
}

export default PersonnelsPage;
