import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Truck,
  RotateCcw,
  Wrench,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import { useAppToast } from '../../../components/ui/alert-toast-provider';
import AlertDialog from '../../../components/ui/alert-dialog';

function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  // Maintenance modal state
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceVehicle, setMaintenanceVehicle] = useState(null);
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    status: 'Maintenance',
    maintenanceReason: '',
    maintenanceStartDate: '',
    maintenanceEndDate: ''
  });

  const [formData, setFormData] = useState({
    plateNumber: '',
    model: ''
  });

  const toast = useAppToast();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('/api/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (vehicle = null) => {
    if (vehicle) {
      setFormData({
        plateNumber: vehicle.plateNumber,
        model: vehicle.model
      });
      setEditingId(vehicle._id);
    } else {
      setFormData({
        plateNumber: '',
        model: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ plateNumber: '', model: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);

    try {
      if (editingId) {
        await axios.put(`/api/vehicles/${editingId}`, formData);
        toast.success('Vehicle updated successfully');
      } else {
        await axios.post('/api/vehicles', formData);
        toast.success('Vehicle added successfully');
      }

      fetchVehicles();
      closeModal();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error(error.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = (id) => {
    setVehicleToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;

    try {
      await axios.delete(`/api/vehicles/${vehicleToDelete}`);
      toast.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    } finally {
      setVehicleToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    toast.success('Filters cleared');
  };

  // Maintenance modal handlers
  const openMaintenanceModal = (vehicle) => {
    setMaintenanceVehicle(vehicle);
    const today = new Date().toISOString().split('T')[0];
    if (vehicle.status === 'Maintenance' || vehicle.status === 'Unavailable') {
      setMaintenanceFormData({
        status: vehicle.status,
        maintenanceReason: vehicle.maintenanceReason || '',
        maintenanceStartDate: vehicle.maintenanceStartDate ? vehicle.maintenanceStartDate.split('T')[0] : today,
        maintenanceEndDate: vehicle.maintenanceEndDate ? vehicle.maintenanceEndDate.split('T')[0] : ''
      });
    } else {
      setMaintenanceFormData({
        status: 'Maintenance',
        maintenanceReason: '',
        maintenanceStartDate: today,
        maintenanceEndDate: ''
      });
    }
    setIsMaintenanceModalOpen(true);
  };

  const closeMaintenanceModal = () => {
    setIsMaintenanceModalOpen(false);
    setMaintenanceVehicle(null);
    setMaintenanceFormData({
      status: 'Maintenance',
      maintenanceReason: '',
      maintenanceStartDate: '',
      maintenanceEndDate: ''
    });
  };

  const handleMaintenanceInputChange = (e) => {
    const { name, value } = e.target;
    setMaintenanceFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    if (!maintenanceVehicle) return;
    setIsMaintenanceLoading(true);

    try {
      await axios.put(`/api/vehicles/${maintenanceVehicle._id}/maintenance`, maintenanceFormData);
      toast.success(
        maintenanceFormData.status === 'Available'
          ? 'Vehicle set to Available'
          : `Vehicle set to ${maintenanceFormData.status}`
      );
      fetchVehicles();
      closeMaintenanceModal();
    } catch (error) {
      console.error('Error updating maintenance:', error);
      toast.error(error.response?.data?.message || 'Failed to update vehicle maintenance');
    } finally {
      setIsMaintenanceLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Available':
        return { color: 'bg-green-500/10 text-green-600 border-green-500/20', dot: 'bg-green-600', label: 'AVAILABLE' };
      case 'Booked':
        return { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', dot: 'bg-blue-600', label: 'BOOKED' };
      case 'Maintenance':
        return { color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', dot: 'bg-orange-600', label: 'MAINTENANCE' };
      case 'Unavailable':
        return { color: 'bg-red-500/10 text-red-600 border-red-500/20', dot: 'bg-red-600', label: 'UNAVAILABLE' };
      default:
        return { color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', dot: 'bg-gray-600', label: status?.toUpperCase() || 'UNKNOWN' };
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch =
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="flex h-full flex-col bg-background p-[5px] overflow-hidden animate-in fade-in duration-500">

      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base uppercase">Vehicles</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Manage Your Fleet Effortlessly</p>
        </div>
      </div>

      {/* Unified Search & Actions Header */}
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <div className="relative w-full max-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="SEARCH VEHICLES..."
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
          title="Add Vehicle"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Card Grid Layout */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loading fleet...</span>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 text-center opacity-70">
            <p className="font-bold text-[12px] text-foreground uppercase tracking-tight">No vehicles found</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center">Try adjusting your search or add a new vehicle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
            {filteredVehicles.map((vehicle) => {
              const statusConfig = getStatusConfig(vehicle.status);
              return (
                <div
                  key={vehicle._id}
                  className="group relative flex flex-col gap-1.5 rounded border border-border bg-card p-2.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md animate-in fade-in zoom-in-95 duration-300"
                >
                  {/* Floating Hover Actions */}
                  <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10">
                    <button
                      onClick={() => openMaintenanceModal(vehicle)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-500/20 bg-background/80 text-orange-500 shadow-sm backdrop-blur-md transition-all hover:bg-orange-500 hover:text-white"
                      title="Maintenance"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openModal(vehicle)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/20 bg-background/80 text-primary shadow-sm backdrop-blur-md transition-all hover:bg-primary hover:text-primary-foreground"
                      title="Edit Vehicle"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle._id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-destructive/20 bg-background/80 text-destructive shadow-sm backdrop-blur-md transition-all hover:bg-destructive hover:text-destructive-foreground"
                      title="Remove Vehicle"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Vehicle Info Section */}
                  <div className="flex items-stretch gap-2.5">
                    <div className="flex w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                      <Truck className="h-5 w-5" />
                    </div>

                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <h3 className="text-[11px] font-bold text-foreground leading-tight truncate uppercase tracking-tight">
                        {vehicle.plateNumber.toUpperCase()}
                      </h3>
                      <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                        {vehicle.model}
                      </p>
                    </div>
                  </div>

                  {/* Footer with Status Badge */}
                  <div className="mt-1 flex items-center justify-end border-t border-border/40 pt-1.5 text-[8px] text-muted-foreground uppercase">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-tight border ${statusConfig.color}`}>
                      <span className={`h-1 w-1 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              );
            })}
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
                  {editingId ? 'EDIT VEHICLE' : 'NEW VEHICLE'}
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
                  id="plateNumber"
                  name="plateNumber"
                  value={formData.plateNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="PLATE NUMBER"
                  className="flex h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                />
              </div>

              <div className="space-y-1">
                <input
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                  placeholder="VEHICLE MODEL"
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

      {/* Maintenance Modal */}
      {isMaintenanceModalOpen && maintenanceVehicle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[400px] rounded-xl border border-border bg-card p-5 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-500/10 text-orange-500">
                  <Wrench className="h-3 w-3" />
                </div>
                <div>
                  <h2 className="text-[12px] font-bold text-foreground uppercase">
                    Vehicle Maintenance
                  </h2>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                    {maintenanceVehicle.plateNumber} — {maintenanceVehicle.model}
                  </p>
                </div>
              </div>
              <button
                onClick={closeMaintenanceModal}
                className="rounded-full flex h-5.5 w-5.5 items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <form onSubmit={handleMaintenanceSubmit} className="space-y-3">
              {/* Status Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-tight text-foreground mb-1.5">
                  Status *
                </label>
                <div className="flex gap-2">
                  {['Available', 'Maintenance', 'Unavailable'].map((s) => {
                    const config = getStatusConfig(s);
                    const isSelected = maintenanceFormData.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMaintenanceFormData(prev => ({ ...prev, status: s }))}
                        className={`flex-1 h-8 rounded border text-[10px] font-bold uppercase tracking-tight transition-all active:scale-95 ${
                          isSelected
                            ? `${config.color} border-current shadow-sm`
                            : 'border-input bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {s === 'Available' ? 'Available' : s === 'Maintenance' ? 'Maintenance' : 'Unavailable'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional fields for Maintenance/Unavailable */}
              {(maintenanceFormData.status === 'Maintenance' || maintenanceFormData.status === 'Unavailable') && (
                <>
                  {/* Reason */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-tight text-foreground mb-1.5">
                      Reason *
                    </label>
                    <textarea
                      name="maintenanceReason"
                      value={maintenanceFormData.maintenanceReason}
                      onChange={handleMaintenanceInputChange}
                      placeholder="Enter reason for maintenance/unavailability..."
                      rows="3"
                      required
                      className="flex w-full rounded border border-input bg-background px-2.5 py-1.5 text-[11px] placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none resize-none"
                    />
                  </div>

                  {/* Date Range */}
                  <style>{`
                    input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0; position: absolute; right: 0; width: 100%; height: 100%; cursor: pointer; }
                  `}</style>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-tight text-foreground mb-1.5">
                        Start Date *
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="maintenanceStartDate"
                          value={maintenanceFormData.maintenanceStartDate}
                          onChange={handleMaintenanceInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className="flex h-8 w-full rounded border border-input bg-background px-2.5 pr-8 py-1 text-[11px] focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                        />
                        <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-tight text-foreground mb-1.5">
                        End Date
                        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="maintenanceEndDate"
                          value={maintenanceFormData.maintenanceEndDate}
                          onChange={handleMaintenanceInputChange}
                          min={maintenanceFormData.maintenanceStartDate || new Date().toISOString().split('T')[0]}
                          className="flex h-8 w-full rounded border border-input bg-background px-2.5 pr-8 py-1 text-[11px] focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
                        />
                        <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeMaintenanceModal}
                  className="flex-1 h-8 rounded border border-input bg-muted text-foreground font-bold text-[10px] uppercase tracking-tight transition-all hover:bg-muted/80 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMaintenanceLoading}
                  className="flex-1 h-8 rounded bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-tight transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isMaintenanceLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Update Status'
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
          setVehicleToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Vehicle?"
        description="Are you sure you want to remove this vehicle? This action cannot be undone."
        confirmText="REMOVE"
        variant="destructive"
      />
    </div>
  );
}

export default VehiclesPage;
